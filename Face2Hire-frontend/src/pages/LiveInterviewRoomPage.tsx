import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/slices/authSlice';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  PhoneOff,
  ShieldCheck,
  Send,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'react-toastify';
import {
  scheduledInterviewService,
  type ScheduledInterviewDto,
  type RoomParticipant,
  type RoomChatMessage,
} from '../services/scheduledInterviewService';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function LiveInterviewRoomPage() {
  const { scheduledId } = useParams<{ scheduledId: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const [interview, setInterview] = useState<ScheduledInterviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sidePanel, setSidePanel] = useState<'none' | 'participants' | 'chat'>('none');

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [endingCall, setEndingCall] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const hasRedirectedRef = useRef(false);

  const isInterviewer =
    user?.role?.toLowerCase().includes('interviewer') ||
    (interview?.scheduledByInterviewer && user?.email === interview.scheduledByInterviewer);

  const myDisplayName = user?.name || (isInterviewer ? 'Interviewer' : 'Candidate');
  const myEmail = user?.email || '';

  const otherRoleDisplayName = isInterviewer
    ? interview?.intervieweeName || 'Candidate'
    : interview?.interviewerName || interview?.scheduledByInterviewer?.split('@')[0] || 'Interviewer';

  const otherRoleEmail = isInterviewer
    ? interview?.intervieweeEmail || ''
    : interview?.scheduledByInterviewer || '';

  const stopAllMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, []);

  const redirectAfterCall = useCallback(
    (interviewData: ScheduledInterviewDto | null, isHostAction: boolean) => {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;
      stopAllMedia();

      if (isInterviewer) {
        toast.info('Interview ended. Please submit the candidate evaluation and score.');
        if (interviewData?.applicationId) {
          const stageQuery = interviewData.applicationStageId || interviewData.stageId;
          navigate(
            `/interviewer/applications/${interviewData.applicationId}/status${
              stageQuery ? `?evaluateStage=${stageQuery}` : ''
            }`
          );
        } else if (interviewData?.id) {
          navigate(`/interviewer/scheduled/${interviewData.id}?evaluate=true`);
        } else {
          navigate('/interviewer/scheduled');
        }
      } else {
        if (!isHostAction) {
          toast.info('The interviewer has ended the interview. Redirecting to your dashboard...');
        } else {
          toast.info('Left the interview room.');
        }
        if (interviewData?.applicationId) {
          navigate(`/interviewee/applications/${interviewData.applicationId}`);
        } else {
          navigate('/interviewee/upcoming');
        }
      }
    },
    [isInterviewer, navigate, stopAllMedia]
  );

  const createOrGetPeerConnection = useCallback(
    (id: number) => {
      if (peerConnectionRef.current) {
        return peerConnectionRef.current;
      }
      const pc = new RTCPeerConnection(RTC_CONFIG);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setRemoteConnected(true);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          scheduledInterviewService
            .sendLiveRoomSignal(id, {
              type: 'ICE',
              data: JSON.stringify(event.candidate),
            })
            .catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setRemoteConnected(true);
        } else if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          setRemoteConnected(false);
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    []
  );

  useEffect(() => {
    const id = Number(scheduledId);
    if (!id) return;

    let active = true;

    const initRoom = async () => {
      try {
        const data = await scheduledInterviewService.getById(id);
        if (!active) return;
        setInterview(data);

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            localStreamRef.current = audioStream;
            setCamEnabled(false);
          } catch {
            setCamEnabled(false);
            setMicEnabled(false);
          }
        }

        const initialState = await scheduledInterviewService.joinLiveRoom(id);
        if (!active) return;
        setParticipants(initialState.participants || []);
        setMessages(initialState.messages || []);

        if (initialState.participants && initialState.participants.length > 1) {
          const pc = createOrGetPeerConnection(id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await scheduledInterviewService.sendLiveRoomSignal(id, {
            type: 'OFFER',
            data: JSON.stringify(offer),
          });
        }
      } catch (err) {
        console.error('Failed to initialize live interview room:', err);
        toast.error('Failed to load interview room');
      } finally {
        if (active) setLoading(false);
      }
    };

    initRoom();

    return () => {
      active = false;
      scheduledInterviewService.leaveLiveRoom(id).catch(() => {});
      stopAllMedia();
    };
  }, [scheduledId, createOrGetPeerConnection, stopAllMedia]);

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [loading, camEnabled]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const id = Number(scheduledId);
    if (!id || loading) return;

    const pollInterval = setInterval(async () => {
      try {
        const state = await scheduledInterviewService.getLiveRoomState(id);
        setParticipants(state.participants || []);
        setMessages(state.messages || []);

        if (state.roomEnded) {
          clearInterval(pollInterval);
          redirectAfterCall(interview, false);
          return;
        }

        for (const sig of state.signals || []) {
          if (sig.type === 'PEER_JOINED') {
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close();
              peerConnectionRef.current = null;
            }
            const pc = createOrGetPeerConnection(id);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await scheduledInterviewService.sendLiveRoomSignal(id, {
              type: 'OFFER',
              data: JSON.stringify(offer),
            });
          } else if (sig.type === 'OFFER') {
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close();
              peerConnectionRef.current = null;
            }
            const pc = createOrGetPeerConnection(id);
            const offerDesc = JSON.parse(sig.data);
            await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await scheduledInterviewService.sendLiveRoomSignal(id, {
              type: 'ANSWER',
              data: JSON.stringify(answer),
            });
          } else if (sig.type === 'ANSWER') {
            const pc = peerConnectionRef.current;
            if (pc && pc.signalingState === 'have-local-offer') {
              const answerDesc = JSON.parse(sig.data);
              await pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
            }
          } else if (sig.type === 'ICE') {
            const pc = peerConnectionRef.current;
            if (pc && sig.data) {
              try {
                const candidate = JSON.parse(sig.data);
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch {
                // ignore duplicate/stale ICE candidate
              }
            }
          } else if (sig.type === 'PEER_LEFT') {
            setRemoteConnected(false);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
          }
        }
      } catch {
        // ignore transient polling error
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [scheduledId, loading, interview, createOrGetPeerConnection, redirectAfterCall]);

  useRealtimeSubscription(
    [scheduledId ? `/topic/live-room/${scheduledId}` : null],
    (event) => {
      if (event.eventType === 'INTERVIEW_CALL_ENDED') {
        redirectAfterCall((event.payload as ScheduledInterviewDto) || interview, false);
      }
    }
  );

  const toggleMic = async () => {
    const next = !micEnabled;
    setMicEnabled(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
    }
    if (scheduledId) {
      await scheduledInterviewService.sendLiveRoomSignal(Number(scheduledId), {
        type: 'MEDIA_STATE',
        data: '',
        audioEnabled: next,
        videoEnabled: camEnabled,
      });
    }
  };

  const toggleCam = async () => {
    const next = !camEnabled;
    setCamEnabled(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
    }
    if (scheduledId) {
      await scheduledInterviewService.sendLiveRoomSignal(Number(scheduledId), {
        type: 'MEDIA_STATE',
        data: '',
        audioEnabled: micEnabled,
        videoEnabled: next,
      });
    }
  };

  const handleToggleScreenShare = async () => {
    if (!scheduledId) return;
    if (screenSharing) {
      setScreenSharing(false);
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = camStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = camStream;
        }
        const videoTrack = camStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      } catch {
        // ignore
      }
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      setScreenSharing(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
      }

      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');
      if (sender && screenTrack) {
        await sender.replaceTrack(screenTrack);
      }

      screenTrack.onended = () => {
        setScreenSharing(false);
      };
    } catch {
      // user cancelled screen share
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !scheduledId) return;
    const text = chatInput.trim();
    setChatInput('');
    await scheduledInterviewService.sendLiveRoomSignal(Number(scheduledId), {
      type: 'CHAT',
      data: text,
    });
  };

  const handleEndInterviewForAll = async () => {
    if (!scheduledId) return;
    setEndingCall(true);
    try {
      const updated = await scheduledInterviewService.endLiveRoomForAll(Number(scheduledId));
      redirectAfterCall(updated, true);
    } catch {
      redirectAfterCall(interview, true);
    }
  };

  const handleCandidateLeave = async () => {
    if (scheduledId) {
      await scheduledInterviewService.leaveLiveRoom(Number(scheduledId)).catch(() => {});
    }
    redirectAfterCall(interview, true);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const remoteParticipant = participants.find((p) => p.userId !== user?.id);
  const remoteDisplayName = remoteParticipant?.name || otherRoleDisplayName;
  const remoteEmail = remoteParticipant?.email || otherRoleEmail;
  const isRemotePresent = Boolean(remoteParticipant);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-4" />
        <p className="text-zinc-300 font-medium">Joining Face2Hire Live Interview Room...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col overflow-hidden select-none">
      {/* Top Zoom-style Header */}
      <header className="h-14 px-6 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-2">
              Face2Hire {interview?.type?.toUpperCase()} Interview — {interview?.intervieweeName}
              <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px]">
                Meeting ID: {interview?.meetingId || scheduledId}
              </Badge>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300">
            <Clock className="size-3.5 text-blue-400" />
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
            {interview?.duration && (
              <span className="text-zinc-500">/ {interview.duration}:00</span>
            )}
          </div>

          {(interview?.meetingStartUrl || interview?.meetingJoinUrl) && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 text-xs"
              onClick={() =>
                window.open(
                  isInterviewer
                    ? interview?.meetingStartUrl || interview?.meetingJoinUrl
                    : interview?.meetingJoinUrl,
                  '_blank'
                )
              }
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              Open in External Zoom App
            </Button>
          )}
        </div>
      </header>

      {/* Main Video Stage + Optional Side Drawer */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center bg-zinc-950">
          {/* Tile 1: Remote Participant (Other Person) */}
          <div className="relative w-full h-full max-h-[72vh] min-h-[280px] rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shadow-2xl">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${
                remoteConnected && remoteParticipant?.videoEnabled !== false ? 'block' : 'hidden'
              }`}
            />

            {(!remoteConnected || remoteParticipant?.videoEnabled === false) && (
              <div className="flex flex-col items-center justify-center text-center p-6">
                <div
                  className={`size-24 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-lg mb-3 ${
                    isInterviewer
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                  }`}
                >
                  {remoteDisplayName.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-white">{remoteDisplayName}</h3>
                {remoteEmail && <p className="text-xs text-zinc-400 mt-0.5">{remoteEmail}</p>}
                <Badge
                  variant="outline"
                  className={`mt-3 ${
                    isRemotePresent
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isRemotePresent
                    ? `${isInterviewer ? 'Candidate' : 'Interviewer'} Connected`
                    : `Waiting for ${isInterviewer ? 'Candidate' : 'Interviewer'} (${remoteDisplayName}) to join...`}
                </Badge>
              </div>
            )}

            {/* Bottom-left Name & Role Tag */}
            <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
              {remoteParticipant?.audioEnabled === false ? (
                <MicOff className="size-4 text-red-500" />
              ) : (
                <Mic className="size-4 text-emerald-400" />
              )}
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  {remoteDisplayName}
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                    {isInterviewer ? 'Candidate' : 'Interviewer (Host)'}
                  </span>
                </div>
                {remoteEmail && <div className="text-[11px] text-zinc-400">{remoteEmail}</div>}
              </div>
            </div>
          </div>

          {/* Tile 2: Local Participant (Me) */}
          <div className="relative w-full h-full max-h-[72vh] min-h-[280px] rounded-2xl bg-zinc-900 border-2 border-blue-500/40 overflow-hidden flex items-center justify-center shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${camEnabled || screenSharing ? 'block' : 'hidden'}`}
            />

            {!camEnabled && !screenSharing && (
              <div className="flex flex-col items-center justify-center text-center p-6">
                <div
                  className={`size-24 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-lg mb-3 ${
                    isInterviewer
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                  }`}
                >
                  {myDisplayName.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-white">{myDisplayName} (You)</h3>
                {myEmail && <p className="text-xs text-zinc-400 mt-0.5">{myEmail}</p>}
              </div>
            )}

            {/* Bottom-left Name & Role Tag */}
            <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
              {!micEnabled ? (
                <MicOff className="size-4 text-red-500" />
              ) : (
                <Mic className="size-4 text-emerald-400" />
              )}
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  {myDisplayName} (You)
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    {isInterviewer ? 'Interviewer (Host)' : 'Candidate'}
                  </span>
                </div>
                {myEmail && <div className="text-[11px] text-zinc-400">{myEmail}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Panel (Participants / Chat) */}
        {sidePanel !== 'none' && (
          <aside className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {sidePanel === 'participants'
                  ? `Participants (${participants.length})`
                  : 'Interview Chat'}
              </h3>
              <button
                onClick={() => setSidePanel('none')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {sidePanel === 'participants' ? (
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {participants.map((p) => {
                  const isHostUser =
                    p.role?.toLowerCase().includes('interviewer') ||
                    p.email === interview?.scheduledByInterviewer;
                  return (
                    <div
                      key={p.userId}
                      className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isHostUser ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white flex items-center gap-1.5">
                            {p.name}
                            {p.userId === user?.id && (
                              <span className="text-xs text-zinc-400">(You)</span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400">{p.email}</div>
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px] py-0 h-4 border-zinc-600 text-zinc-300"
                          >
                            {isHostUser ? 'Interviewer • Host' : 'Candidate'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {p.audioEnabled ? (
                          <Mic className="size-4 text-emerald-400" />
                        ) : (
                          <MicOff className="size-4 text-red-500" />
                        )}
                        {p.videoEnabled ? (
                          <Video className="size-4 text-emerald-400" />
                        ) : (
                          <VideoOff className="size-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-8">
                      No messages yet. Share links or notes with the other participant here.
                    </p>
                  ) : (
                    messages.map((m, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl text-xs ${
                          m.senderId === user?.id
                            ? 'bg-blue-600/20 border border-blue-500/30 ml-4'
                            : 'bg-zinc-800 border border-zinc-700 mr-4'
                        }`}
                      >
                        <div className="font-semibold text-zinc-200 mb-1">{m.senderName}</div>
                        <div className="text-zinc-100 whitespace-pre-wrap">{m.text}</div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendChat} className="p-3 border-t border-zinc-800 flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-zinc-800 border-zinc-700 text-white text-xs h-9"
                  />
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 h-9">
                    <Send className="size-3.5" />
                  </Button>
                </form>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Zoom-style Control Bar */}
      <footer className="h-20 px-8 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMic}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors ${
              micEnabled ? 'hover:bg-zinc-800 text-zinc-200' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {micEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
            <span className="text-[11px] mt-1">{micEnabled ? 'Mute' : 'Unmute'}</span>
          </button>

          <button
            onClick={toggleCam}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors ${
              camEnabled ? 'hover:bg-zinc-800 text-zinc-200' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {camEnabled ? <Video className="size-5" /> : <VideoOff className="size-5" />}
            <span className="text-[11px] mt-1">{camEnabled ? 'Stop Video' : 'Start Video'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setSidePanel(sidePanel === 'participants' ? 'none' : 'participants')
            }
            className={`flex flex-col items-center justify-center w-20 h-14 rounded-xl transition-colors relative ${
              sidePanel === 'participants'
                ? 'bg-zinc-800 text-blue-400'
                : 'hover:bg-zinc-800 text-zinc-200'
            }`}
          >
            <Users className="size-5" />
            <span className="text-[11px] mt-1">Participants ({participants.length})</span>
          </button>

          <button
            onClick={() => setSidePanel(sidePanel === 'chat' ? 'none' : 'chat')}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors ${
              sidePanel === 'chat' ? 'bg-zinc-800 text-blue-400' : 'hover:bg-zinc-800 text-zinc-200'
            }`}
          >
            <MessageSquare className="size-5" />
            <span className="text-[11px] mt-1">Chat</span>
          </button>

          <button
            onClick={handleToggleScreenShare}
            className={`flex flex-col items-center justify-center w-20 h-14 rounded-xl transition-colors ${
              screenSharing
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'hover:bg-zinc-800 text-zinc-200'
            }`}
          >
            <MonitorUp className="size-5 text-emerald-400" />
            <span className="text-[11px] mt-1">
              {screenSharing ? 'Stop Share' : 'Share Screen'}
            </span>
          </button>
        </div>

        <div>
          {isInterviewer ? (
            <Button
              onClick={handleEndInterviewForAll}
              disabled={endingCall}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 h-11 rounded-xl"
            >
              <PhoneOff className="size-4 mr-2" />
              {endingCall ? 'Ending...' : 'End Interview & Grade'}
            </Button>
          ) : (
            <Button
              onClick={handleCandidateLeave}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 h-11 rounded-xl"
            >
              <PhoneOff className="size-4 mr-2" />
              Leave Interview
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

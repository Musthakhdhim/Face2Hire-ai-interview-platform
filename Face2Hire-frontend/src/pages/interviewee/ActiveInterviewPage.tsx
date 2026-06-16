import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Mic, MicOff, SkipForward, CheckCircle, Maximize2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { interviewService, type QuestionResponseDto, type InterviewType, type Difficulty, type AvatarStyle, type SessionStateDto } from '../../services/interviewService';
import { audioService } from '../../services/audioService';
// import { websocketService } from '../../services/websocketService'; 
import ThreeAvatar from '../../components/interview/ThreeAvatar';
import FaceDetector from '../../components/interview/FaceDetector';
// import { useSelector } from 'react-redux';
// import type { RootState } from '../../store/store';
import screenfull from 'screenfull';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
// import CustomAvatar from '../../components/interview/CustomAvatar';  
// import RealisticAvatar from '../../components/interview/RealisticAvatar'; 


interface SessionConfig {
  type: InterviewType;
  difficulty: Difficulty;
  duration: number;
  questionCount: number;
  avatarStyle: AvatarStyle;
  firstQuestionId?: number;
  scheduledInterviewId?: number;
  currentQuestion?: QuestionResponseDto;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export default function ActiveInterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // const { token } = useSelector((state: RootState) => state.auth);
  const sessionConfig = location.state as SessionConfig;

  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponseDto | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(sessionConfig?.questionCount || 10);
  const [timeRemaining, setTimeRemaining] = useState((sessionConfig?.duration || 30) * 60);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [avatarState, setAvatarState] = useState<'idle' | 'speaking' | 'listening'>('idle');
  const [loading, setLoading] = useState(true);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showFullscreenModal, setShowFullscreenModal] = useState(() => !!(sessionId && sessionConfig));
  const [showFullscreenWarningDialog, setShowFullscreenWarningDialog] = useState(false);
  const [showVisibilityWarningDialog, setShowVisibilityWarningDialog] = useState(false);
  const [activeSession, setActiveSession] = useState<SessionStateDto | null>(null);


  const [faceDetected, setFaceDetected] = useState(true);
  const [faceViolationCount, setFaceViolationCount] = useState(0);
  const [showCameraWarningDialog, setShowCameraWarningDialog] = useState(false);

  const fullscreenExitCountRef = useRef(0);
  const visibilityHiddenCountRef = useRef(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
  if (!sessionConfig && sessionId) {
    const stored = localStorage.getItem(`interview_config_${sessionId}`);
    if (stored) {
      try {
        // const parsed = JSON.parse(stored);
       
        console.log('Found stored config for session', sessionId);
      
      } catch (e) {
        console.log();
        
      }
    }
  }
}, [sessionConfig, sessionId]);

  useEffect(() => {
    const checkActive = async () => {
      try {
        const active = await interviewService.getActiveSession();
        if (active && active.status === 'ACTIVE') {
          setActiveSession(active);
          setTotalQuestions(active.totalQuestions);
          setTimeRemaining(active.remainingTimeSeconds);
      
        }
      } catch (error) {
        console.error('Failed to check active session', error);
      }
    };
    checkActive();
  }, []);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current.onended = null;
      const url = currentAudioRef.current.src;
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      currentAudioRef.current = null;
    }
    setAudioElement(null);
  }, []);
  

  const speakQuestion = useCallback(async (text: string) => {
    stopCurrentAudio();
    setAvatarState('speaking');
    try {
      const audioBlob = await audioService.textToSpeech(text, sessionConfig.avatarStyle);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      setAudioElement(audio);
      audio.onended = () => {
        setAvatarState('listening');
        URL.revokeObjectURL(url);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        setAudioElement(null);
      };
      await audio.play();
    } catch {
      console.error('TTS error');
      setAvatarState('listening');
    }
  }, [sessionConfig, stopCurrentAudio]);

  const endInterview = useCallback(async () => {
    stopCurrentAudio();
    
    try {
      const overallFeedback = await interviewService.endSession(Number(sessionId));
      
      localStorage.removeItem(`interview_config_${sessionId}`);
      
      if (screenfull.isFullscreen) {
        await screenfull.exit();
      }
      
      navigate(`/interviewee/interview/feedback/${sessionId}`, { state: { feedback: overallFeedback } });
    } catch (error) {
      console.error('Failed to end interview:', error);
      toast.error('Error ending interview');
      navigate(`/interviewee/interview/feedback/${sessionId}`);
    }
  }, [sessionId, navigate, stopCurrentAudio]);

  const handleTimeEnd = useCallback(async () => {
    toast.info("Time's up! Ending interview.");
    await endInterview();
  }, [endInterview]);

  useEffect(() => {
  if (faceViolationCount >= 5) {
    toast.error('Maximum face violations reached. Ending interview.');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    endInterview();
  }
}, [faceViolationCount, endInterview]);

  useEffect(() => {
    if (loading || answerSubmitted) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, answerSubmitted, handleTimeEnd]);

  useEffect(() => {
    if (!loading && !showFullscreenModal) {
      const handleFullscreenChange = () => {
        if (!screenfull.isFullscreen) {
          fullscreenExitCountRef.current += 1;
          if (fullscreenExitCountRef.current <= 100) {
            setShowFullscreenWarningDialog(true);
          } else {
            toast.error('You exited fullscreen again. The interview will be ended.');
            endInterview();
          }
        }
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          visibilityHiddenCountRef.current += 1;
          if (visibilityHiddenCountRef.current <= 100) {
            setShowVisibilityWarningDialog(true);
          } else {
            toast.error('You switched tabs again. The interview will be ended.');
            endInterview();
          }
        }
      };

      if (screenfull.isEnabled) {
        screenfull.on('change', handleFullscreenChange);
      }
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (screenfull.isEnabled) {
          screenfull.off('change', handleFullscreenChange);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [loading, showFullscreenModal, endInterview]);

  const startInterview = useCallback(async () => {
    try {
      let firstQuestion: QuestionResponseDto;

      if (sessionConfig?.firstQuestionId) {
      
        if (activeSession && activeSession.sessionId === Number(sessionId)) {
          setTotalQuestions(activeSession.totalQuestions);
          setTimeRemaining(activeSession.remainingTimeSeconds);
        }
        if (sessionConfig.currentQuestion) {
          firstQuestion = sessionConfig.currentQuestion;
        } else {
          firstQuestion = await interviewService.getCurrentQuestionForSession(Number(sessionId));
        }
        setQuestionIndex(firstQuestion.questionIndex);
      } else {
        const started = await interviewService.startSession({
          type: sessionConfig.type,
          difficulty: sessionConfig.difficulty,
          duration: sessionConfig.duration,
          questionCount: sessionConfig.questionCount,
          avatarStyle: sessionConfig.avatarStyle,
          scheduledInterviewId: sessionConfig.scheduledInterviewId,
        });
        setTotalQuestions(started.totalQuestions);
        setTimeRemaining(started.durationSeconds);
        localStorage.setItem(`interview_config_${started.sessionId}`, JSON.stringify({
          ...sessionConfig,
          totalQuestions: started.totalQuestions,
          durationSeconds: started.durationSeconds,
        }));
        const q = await interviewService.getNextQuestion(started.sessionId, 0);
        firstQuestion = q;
        setQuestionIndex(firstQuestion.questionIndex);
      }

      setCurrentQuestion(firstQuestion);
      setLoading(false);
      await speakQuestion(firstQuestion.questionText);
    } catch (error) {
      toast.error('Failed to start interview');
      navigate('/interviewee/interview/setup');
    }
  }, [sessionId, sessionConfig, activeSession, navigate, speakQuestion]);

  const enableFullscreenAndStart = async () => {
    if (screenfull.isEnabled) {
      try {
        await screenfull.request();
        setShowFullscreenModal(false);
        startInterview();
      } catch {
        toast.error('Failed to enter fullscreen. Please allow fullscreen to continue.');
      }
    } else {
      toast.error('Fullscreen is not supported in your browser.');
    }
  };

  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, [stopCurrentAudio]);

  const startRecording = async () => {
    if (isMuted) {
      toast.error('Please unmute your microphone');
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.start(1000);
    setIsRecording(true);
    setAvatarState('listening');

    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor() as SpeechRecognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          interim += event.results[i][0].transcript;
        }
        setTranscript(interim);
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const stopRecordingAndSubmit = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
    setAvatarState('idle');
    if (recognitionRef.current) recognitionRef.current.stop();

    await new Promise(resolve => setTimeout(resolve, 500));
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setSubmitting(true);
    try {
      const audioUrl = await audioService.uploadAudio(audioBlob);
      const responseDuration = Math.round(audioChunksRef.current.length);
      const feedback = await interviewService.submitAnswer({
        sessionId: Number(sessionId),
        questionId: currentQuestion!.questionId,
        audioUrl,
        responseDuration,
      });
      setAnswerSubmitted(true);
      console.log(`Score: ${feedback.score}%`)
      setTimeout(() => {
        setAnswerSubmitted(false);
        goToNextQuestion();
      }, 2000);
    } catch {
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const goToNextQuestion = async () => {
    if (questionIndex >= totalQuestions) {
      await endInterview();
      return;
    }
    stopCurrentAudio();
    try {
      const next = await interviewService.getNextQuestion(Number(sessionId), currentQuestion!.questionId);
      setCurrentQuestion(next);
      setQuestionIndex(prev => prev + 1);
      setTranscript('');
      await speakQuestion(next.questionText);
    } catch {
      toast.error('Failed to load next question');
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCameraViolation = useCallback(() => {
    setShowCameraWarningDialog(true);
  }, []);

  const handleFaceStatus = useCallback((detected: boolean, count: number) => {
    setFaceDetected(detected);
    setFaceViolationCount(count);
  }, []);

  if (showFullscreenModal) {
    return (
      <Dialog open={showFullscreenModal} onOpenChange={setShowFullscreenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fullscreen Required</DialogTitle>
            <DialogDescription>
              To maintain interview integrity, you must enter fullscreen mode before starting.
              Click the button below to enable fullscreen and begin your interview.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Button onClick={enableFullscreenAndStart} className="bg-indigo-600">
              <Maximize2 className="mr-2 size-4" />
              Enter Fullscreen & Start
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (loading) return <div className="flex justify-center py-12">Loading interview...</div>;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex flex-col overflow-hidden">
      <Dialog open={showFullscreenWarningDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&>button:last-child]:hidden">
          <DialogHeader>
            <DialogTitle>⚠️ Fullscreen Exited</DialogTitle>
            <DialogDescription>
              You have exited fullscreen mode. Please re-enter fullscreen immediately to continue the interview.
              If you exit fullscreen again, the interview will be terminated.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Button
              onClick={() => {
                setShowFullscreenWarningDialog(false);
                if (screenfull.isEnabled && !screenfull.isFullscreen) {
                  screenfull.request();
                }
              }}
            >
              Re-enter Fullscreen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVisibilityWarningDialog} onOpenChange={setShowVisibilityWarningDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Tab Switched</DialogTitle>
            <DialogDescription>
              You have switched away from the interview tab. Please return to this tab immediately.
              If you switch tabs again, the interview will be terminated.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Button onClick={() => setShowVisibilityWarningDialog(false)}>I'm Back</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCameraWarningDialog} onOpenChange={setShowCameraWarningDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Face Not Detected</DialogTitle>
            <DialogDescription>
              Please look into the camera. Violation {faceViolationCount} of 5.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Button onClick={() => setShowCameraWarningDialog(false)}>I'm Back</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <span className="size-2 bg-red-500 rounded-full mr-2 animate-pulse" />
            LIVE
          </Badge>
          <div className="flex items-center gap-4">
            <div className="text-white font-mono text-lg">{formatTime(timeRemaining)}</div>
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-white text-xs">
                {faceDetected ? 'Face OK' : `No face (${faceViolationCount}/5)`}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
            Q{questionIndex}/{totalQuestions}
          </Badge>
        </div>
        <Progress value={(questionIndex / totalQuestions) * 100} className="h-1 mt-2 rounded-none" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-8 items-center">
          <div className="flex justify-center h-[60vh] lg:h-[70vh]">
            <ThreeAvatar 
              style={sessionConfig.avatarStyle} 
              isSpeaking={avatarState === 'speaking'} 
              audioElement={audioElement || undefined} 
            />

            {/* <CustomAvatar 
              style={sessionConfig.avatarStyle} 
              isSpeaking={avatarState === 'speaking'} 
              audioElement={audioElement || undefined} 
            /> */}

            {/* <RealisticAvatar 
              style={sessionConfig.avatarStyle} 
              isSpeaking={avatarState === 'speaking'} 
              audioElement={audioElement || undefined} 
            /> */}

          </div>
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-8">
              <p className="text-2xl font-light leading-relaxed">{currentQuestion?.questionText}</p>
              {transcript && (
                <div className="mt-6 p-4 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                  <p className="text-sm italic">"{transcript}"</p>
                </div>
              )}
              {answerSubmitted && (
                <div className="mt-6 p-4 bg-green-500/20 rounded-lg text-center">
                  <CheckCircle className="inline size-6 mr-2" /> Answer submitted! Moving to next question...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'default'}
            className="rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
          </Button>
          <div className="flex gap-3">
            {!isRecording ? (
              <Button size="lg" className="bg-red-600 hover:bg-red-700" onClick={startRecording} disabled={answerSubmitted || submitting}>
                Start Recording
              </Button>
            ) : (
              <Button size="lg" variant="default" onClick={stopRecordingAndSubmit} disabled={submitting}>
                Stop & Submit
              </Button>
            )}
            {!isRecording && !answerSubmitted && (
              <Button size="lg" variant="outline" onClick={goToNextQuestion}>
                Skip <SkipForward className="ml-2 size-5" />
              </Button>
            )}
          </div>
          <div className="w-12" /> 
        </div>
      </div>

      <FaceDetector
        onViolation={handleCameraViolation}
        onFaceStatus={handleFaceStatus}
        maxViolations={5}
        showPreview={true}
      />
    </div>
  );
}
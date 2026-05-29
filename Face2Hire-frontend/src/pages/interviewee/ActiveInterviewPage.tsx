import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Mic, MicOff, Volume2, SkipForward, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { interviewService, type QuestionResponseDto, type InterviewType, type Difficulty, type AvatarStyle } from '../../services/interviewService';
import { audioService } from '../../services/audioService';
import { websocketService } from '../../services/websocketService';
import Avatar from '../../components/interview/Avatar';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

interface SessionConfig {
  type: InterviewType;
  difficulty: Difficulty;
  duration: number;
  questionCount: number;
  avatarStyle: AvatarStyle;
  firstQuestionId?: number;
  scheduledInterviewId?: number;
}

// Timer message type from WebSocket
interface TimerMessage {
  remainingSeconds: number;
}

// Speech recognition interfaces (unchanged)
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
  const { token } = useSelector((state: RootState) => state.auth);
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const speakQuestion = useCallback(async (text: string) => {
    setAvatarState('speaking');
    try {
      const audioBlob = await audioService.textToSpeech(text, sessionConfig.avatarStyle);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      setAudioElement(audio);
      audio.onended = () => {
        setAvatarState('listening');
        URL.revokeObjectURL(url);
        setAudioElement(null);
      };
      audio.play();
    } catch {
      console.error('TTS error');
      setAvatarState('listening');
    }
  }, [sessionConfig]);

  useEffect(() => {
    const startSession = async () => {
      try {
        let firstQuestion: QuestionResponseDto;
        if (sessionConfig?.firstQuestionId) {
          const res = await interviewService.getNextQuestion(Number(sessionId), 0);
          firstQuestion = res;
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
          const q = await interviewService.getNextQuestion(started.sessionId, 0);
          firstQuestion = q;
        }
        setCurrentQuestion(firstQuestion);
        setQuestionIndex(1);
        setLoading(false);
        websocketService.connect(Number(sessionId), token!, () => {
          // ✅ Cast `data` to TimerMessage type to access `remainingSeconds`
          websocketService.on('timer', (data) => {
            const timerData = data as TimerMessage;
            setTimeRemaining(timerData.remainingSeconds);
          });
        });
        await speakQuestion(firstQuestion.questionText);
      } catch {
        toast.error('Failed to start interview');
        navigate('/interviewee/interview/setup');
      }
    };
    if (sessionId && sessionConfig) startSession();
  }, [sessionId, sessionConfig, token, navigate, speakQuestion]);

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
      const SpeechRecognitionConstructor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
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
      toast.success(`Score: ${feedback.score}%`);
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
      const overallFeedback = await interviewService.endSession(Number(sessionId));
      navigate(`/interviewee/interview/feedback/${sessionId}`, { state: { feedback: overallFeedback } });
      return;
    }
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

  if (loading) return <div className="flex justify-center py-12">Loading interview...</div>;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex flex-col overflow-hidden">
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <span className="size-2 bg-red-500 rounded-full mr-2 animate-pulse" />
            LIVE
          </Badge>
          <div className="text-white font-mono text-lg">{formatTime(timeRemaining)}</div>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
            Q{questionIndex}/{totalQuestions}
          </Badge>
        </div>
        <Progress value={(questionIndex / totalQuestions) * 100} className="h-1 mt-2 rounded-none" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-8 items-center">
          <div className="flex justify-center">
            <Avatar mode={sessionConfig.avatarStyle} isSpeaking={avatarState === 'speaking'} audioElement={audioElement || undefined} />
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
          <Button
            size="lg"
            variant="ghost"
            className="text-white"
            onClick={() => {
              if (audioElement) {
                if (audioElement.paused) audioElement.play();
                else audioElement.pause();
              }
            }}
          >
            <Volume2 className="size-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
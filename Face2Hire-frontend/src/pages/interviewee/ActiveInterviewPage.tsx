import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Mic, MicOff, Volume2, VolumeX, SkipForward, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { interviewService } from '../../services/interviewService';
import type { QuestionResponseDto, FeedbackResponseDto } from '../../services/interviewService';
import { audioService } from '../../services/audioService';
import { websocketService } from '../../services/websocketService';
import Avatar from '../../components/interview/Avatar';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export default function ActiveInterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useSelector((state: RootState) => state.auth);
  const sessionConfig = location.state as any; // { type, difficulty, duration, questionCount, avatarStyle, scheduledInterviewId }

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load first question on mount
  useEffect(() => {
    const startSession = async () => {
      try {
        let firstQuestion: QuestionResponseDto;
        if (sessionConfig?.firstQuestionId) {
          // If we already have a session (e.g., from setup)
          const res = await interviewService.getNextQuestion(Number(sessionId), 0);
          firstQuestion = res;
        } else {
          // Start a new session
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
        // Connect WebSocket for timer & state
        websocketService.connect(Number(sessionId), token!, () => {
          websocketService.on('timer', (data) => setTimeRemaining(data.remainingSeconds));
        });
        // Speak the first question
        speakQuestion(firstQuestion.questionText);
      } catch (err) {
        toast.error('Failed to start interview');
        navigate('/interviewee/interview/setup');
      }
    };
    if (sessionId) startSession();
  }, [sessionId, sessionConfig, token, navigate]);

  const speakQuestion = async (text: string) => {
    setAvatarState('speaking');
    try {
      const audioBlob = await audioService.textToSpeech(text, sessionConfig.avatarStyle);
      const url = URL.createObjectURL(audioBlob);
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        URL.revokeObjectURL(ttsAudioRef.current.src);
      }
      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.onended = () => {
        setAvatarState('listening');
        URL.revokeObjectURL(url);
      };
      audio.play();
    } catch (err) {
      console.error('TTS error', err);
      setAvatarState('listening');
    }
  };

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
    mediaRecorderRef.current.start(1000); // chunk every second
    setIsRecording(true);
    setAvatarState('listening');

    // Optional: use Web Speech API for live transcript
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
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

    // Wait for final audio blob
    await new Promise(resolve => setTimeout(resolve, 500));
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setSubmitting(true);
    try {
      const audioUrl = await audioService.uploadAudio(audioBlob);
      const responseDuration = Math.round(audioChunksRef.current.length); // rough estimate in seconds
      const feedback = await interviewService.submitAnswer({
        sessionId: Number(sessionId),
        questionId: currentQuestion!.questionId,
        audioUrl,
        responseDuration,
      });
      setAnswerSubmitted(true);
      // Show feedback briefly
      toast.success(`Score: ${feedback.score}%`);
      // Automatically go to next question after delay
      setTimeout(() => {
        setAnswerSubmitted(false);
        goToNextQuestion();
      }, 2000);
    } catch (err) {
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const goToNextQuestion = async () => {
    if (questionIndex >= totalQuestions) {
      // End interview
      const overallFeedback = await interviewService.endSession(Number(sessionId));
      navigate(`/interviewee/interview/feedback/${sessionId}`, { state: { feedback: overallFeedback } });
      return;
    }
    try {
      const next = await interviewService.getNextQuestion(Number(sessionId), currentQuestion!.questionId);
      setCurrentQuestion(next);
      setQuestionIndex(prev => prev + 1);
      setTranscript('');
      speakQuestion(next.questionText);
    } catch (err) {
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
            <Avatar mode={sessionConfig.avatarStyle} isSpeaking={avatarState === 'speaking'} audioElement={ttsAudioRef.current || undefined} />
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
              if (ttsAudioRef.current) {
                if (ttsAudioRef.current.paused) ttsAudioRef.current.play();
                else ttsAudioRef.current.pause();
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
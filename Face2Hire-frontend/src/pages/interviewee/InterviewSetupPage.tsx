import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";
import { Slider } from "../../components/ui/slider";
import { Code, Users, DollarSign, MessageSquare, CheckCircle2, Lock } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { toast } from "react-toastify";
import { interviewService, type StartSessionRequest, type AvatarStyle, type Difficulty, type InterviewType } from "../../services/interviewService";
import { scheduledInterviewService, type ScheduledInterviewDto } from "../../services/scheduledInterviewService";

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scheduledId = searchParams.get("scheduled");

  const [scheduledInterview, setScheduledInterview] = useState<ScheduledInterviewDto | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<InterviewType>("technical");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [duration, setDuration] = useState(30);
  const [questionCount, setQuestionCount] = useState(10);
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>("professional");

  useEffect(() => {
    if (scheduledId) {
      scheduledInterviewService.getMyScheduled().then(list => {
        const found = list.find(s => s.id === Number(scheduledId));
        if (found) {
          setScheduledInterview(found);
          setSelectedType(found.type);
          setDifficulty(found.difficulty);
          setDuration(found.duration);
          setQuestionCount(found.questionCount);
          setAvatarStyle(found.avatarStyle);
          setIsLocked(true);
        } else {
          toast.error("Scheduled interview not found");
        }
      }).catch(() => toast.error("Failed to load scheduled interview"));
    }
  }, [scheduledId]);

  const types = [
    { id: "technical", icon: Code, title: "Technical", description: "Coding & system design", color: "bg-blue-100 text-blue-600" },
    { id: "hr", icon: Users, title: "HR", description: "Behavioral & cultural fit", color: "bg-green-100 text-green-600" },
    { id: "salary", icon: DollarSign, title: "Salary", description: "Compensation discussion", color: "bg-purple-100 text-purple-600" },
    { id: "behavioral", icon: MessageSquare, title: "Behavioral", description: "STAR method questions", color: "bg-amber-100 text-amber-600" },
  ];

  const avatars = [
    { id: "professional", emoji: "👔", name: "Professional", description: "Formal and focused" },
    { id: "friendly", emoji: "😊", name: "Friendly", description: "Warm and encouraging" },
    { id: "strict", emoji: "🧐", name: "Strict", description: "Direct and challenging" },
  ];

  const handleStartInterview = async () => {
    if (!selectedType) {
      toast.error("Please select an interview type");
      return;
    }
    try {
      const request: StartSessionRequest = {
        type: selectedType,
        difficulty,
        duration,
        questionCount,
        avatarStyle,
        scheduledInterviewId: scheduledId ? Number(scheduledId) : undefined,
      };
      const started = await interviewService.startSession(request);
      navigate(`/interviewee/interview/active/${started.sessionId}`, {
        state: {
          sessionId: started.sessionId,
          type: selectedType,
          difficulty,
          duration,
          questionCount,
          avatarStyle,
          firstQuestionId: started.firstQuestionId,
          scheduledInterviewId: scheduledId,
        },
      });
    } catch (err) {
      toast.error("Failed to start interview");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Setup Interview</h1>
          <p className="text-gray-600 mt-1">Configure your practice session</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">Step {step} of 3</Badge>
      </div>

      {isLocked && scheduledInterview && (
        <Card className="border-0 shadow-lg bg-amber-50 border-l-4 border-l-amber-600">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Lock className="size-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Scheduled Interview - Settings Locked</h3>
                <p className="text-sm text-gray-600">
                  This interview was scheduled by <strong>{scheduledInterview.scheduledByInterviewer}</strong>.
                  All settings have been preset and cannot be changed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      {step === 1 && (
        <Card className="border-0 shadow-lg">
          <CardHeader><CardTitle>Select Interview Type</CardTitle><CardDescription>Choose the type of interview you want to practice</CardDescription></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {types.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <Card key={type.id} className={`${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-lg'} transition-all ${isSelected ? "border-2 border-indigo-500 shadow-lg" : ""}`}
                    onClick={() => !isLocked && setSelectedType(type.id as InterviewType)}>
                    <CardContent className="p-6 relative">
                      {isLocked && isSelected && <div className="absolute top-3 right-3"><Lock className="size-6 text-amber-600" /></div>}
                      {!isLocked && isSelected && <div className="absolute top-3 right-3"><CheckCircle2 className="size-6 text-indigo-600" /></div>}
                      <div className={`size-12 rounded-xl ${type.color} flex items-center justify-center mb-3`}><Icon className="size-6" /></div>
                      <h3 className="font-bold text-gray-900 mb-1">{type.title}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Button className="w-full" size="lg" onClick={() => setStep(2)} disabled={!selectedType}>Continue to Settings</Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-0 shadow-lg">
          <CardHeader><CardTitle>Interview Settings</CardTitle><CardDescription>Configure difficulty, duration, and question count</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-3"><Label className="text-base font-semibold">Difficulty Level</Label>{isLocked && <Badge variant="outline" className="text-amber-600"><Lock className="size-3 mr-1" />Locked</Badge>}</div>
              <RadioGroup value={difficulty} onValueChange={isLocked ? undefined : (v) => setDifficulty(v as Difficulty)}>
                <div className="grid grid-cols-3 gap-4">
                  {["beginner", "intermediate", "expert"].map((level) => (
                    <label key={level} className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-all ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${difficulty === level ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
                      <RadioGroupItem value={level} id={level} disabled={isLocked} />
                      <Label htmlFor={level} className={`capitalize flex-1 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>{level}</Label>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
            <div>
              <div className="flex justify-between mb-3"><Label className="text-base font-semibold">Duration</Label><div><Badge variant="outline">{duration} minutes</Badge>{isLocked && <Badge variant="outline" className="ml-2"><Lock className="size-3 mr-1" />Locked</Badge>}</div></div>
              <Slider value={[duration]} onValueChange={isLocked ? undefined : ([val]) => setDuration(val)} min={15} max={60} step={15} disabled={isLocked} />
              <div className="flex justify-between text-xs text-gray-500 mt-2"><span>15 min</span><span>30 min</span><span>45 min</span><span>60 min</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-3"><Label className="text-base font-semibold">Number of Questions</Label><div><Badge variant="outline">{questionCount} questions</Badge>{isLocked && <Badge variant="outline" className="ml-2"><Lock className="size-3 mr-1" />Locked</Badge>}</div></div>
              <Slider value={[questionCount]} onValueChange={isLocked ? undefined : ([val]) => setQuestionCount(val)} min={5} max={20} step={5} disabled={isLocked} />
              <div className="flex justify-between text-xs text-gray-500 mt-2"><span>5</span><span>10</span><span>15</span><span>20</span></div>
            </div>
            <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button><Button className="flex-1" onClick={() => setStep(3)}>Continue to Avatar</Button></div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-0 shadow-lg">
          <CardHeader><CardTitle>Interviewer Avatar</CardTitle><CardDescription>{isLocked ? "Avatar personality set by interviewer" : "Select the personality of your AI interviewer"}</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {avatars.map((avatar) => (
                <Card key={avatar.id} className={`${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-lg'} transition-all ${avatarStyle === avatar.id ? "border-2 border-indigo-500 shadow-lg" : ""}`}
                  onClick={() => !isLocked && setAvatarStyle(avatar.id as AvatarStyle)}>
                  <CardContent className="p-6 text-center relative">
                    {isLocked && avatarStyle === avatar.id && <div className="absolute top-3 right-3"><Lock className="size-6 text-amber-600" /></div>}
                    {!isLocked && avatarStyle === avatar.id && <div className="absolute top-3 right-3"><CheckCircle2 className="size-6 text-indigo-600" /></div>}
                    <div className="text-6xl mb-3">{avatar.emoji}</div>
                    <h3 className="font-bold text-gray-900 mb-1">{avatar.name}</h3>
                    <p className="text-sm text-gray-600">{avatar.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className={isLocked ? "bg-amber-50 border-amber-200" : "bg-indigo-50 border-indigo-200"}>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">Interview Summary{isLocked && <Badge variant="outline" className="text-amber-600">All Locked</Badge>}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Type:</span><span className="font-medium capitalize flex items-center gap-2">{selectedType}{isLocked && <Lock className="size-3 text-amber-600" />}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Difficulty:</span><span className="font-medium capitalize flex items-center gap-2">{difficulty}{isLocked && <Lock className="size-3 text-amber-600" />}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Duration:</span><span className="font-medium flex items-center gap-2">{duration} minutes{isLocked && <Lock className="size-3 text-amber-600" />}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Questions:</span><span className="font-medium flex items-center gap-2">{questionCount}{isLocked && <Lock className="size-3 text-amber-600" />}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Avatar:</span><span className="font-medium capitalize flex items-center gap-2">{avatars.find(a => a.id === avatarStyle)?.emoji} {avatarStyle}{isLocked && <Lock className="size-3 text-amber-600" />}</span></div>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button><Button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600" size="lg" onClick={handleStartInterview}>Start Interview</Button></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
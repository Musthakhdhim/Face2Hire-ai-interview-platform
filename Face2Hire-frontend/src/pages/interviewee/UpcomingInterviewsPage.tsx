import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Calendar, Clock, Award, User, AlertCircle, Timer, ListChecks, FileText, X, Video, CheckCircle2, Filter } from "lucide-react";
import { motion } from "motion/react";
import {
  scheduledInterviewService,
  sortScheduledInterviewsByPriority,
  type ScheduledInterviewDto,
} from "../../services/scheduledInterviewService";
import { resumeService } from "../../services/resumeService";
import { useRealtimeSubscription } from "../../hooks/useRealtimeSubscription";
import { toast } from "react-toastify";

export default function UpcomingInterviewsPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [interviews, setInterviews] = useState<ScheduledInterviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCV, setHasCV] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingInterviewId, setPendingInterviewId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [modeFilter, setModeFilter] = useState<"all" | "AI" | "ZOOM">("all");

  const fetchScheduled = useCallback(async (silent = false) => {
    try {
      const data = await scheduledInterviewService.getMyScheduled();
      setInterviews(sortScheduledInterviewsByPriority(Array.isArray(data) ? data : []));
      
      try {
        const resume = await resumeService.getActiveResume();
        setHasCV(!!(resume && resume.status === 'COMPLETED'));
      } catch {
        setHasCV(false);
      }
    } catch (error) {
      if (!silent) {
        console.error("Failed to load scheduled interviews", error);
        toast.error("Failed to load scheduled interviews");
        setInterviews([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  useRealtimeSubscription(
    [user?.id ? `/topic/user/${user.id}/interviews` : null],
    () => {
      fetchScheduled(true);
    }
  );

  const handleStartInterview = (interviewId: number) => {
    if (!hasCV) {
      setShowResumePrompt(true);
      setPendingInterviewId(interviewId);
      return;
    }
    navigate(`/interviewee/interview/setup?scheduled=${interviewId}`);
  };

  const handleUploadResume = () => {
    setShowResumePrompt(false);
    if (pendingInterviewId) {
      sessionStorage.setItem('pendingInterviewId', String(pendingInterviewId));
    }
    navigate('/interviewee/upload-cv');
  };

  const handlePracticeInterview = () => {
    if (!hasCV) {
      setShowResumePrompt(true);
      setPendingInterviewId(null);
      return;
    }
    navigate('/interviewee/interview/setup');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "technical":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "hr":
        return "bg-green-100 text-green-700 border-green-200";
      case "behavioral":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "salary":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500";
      case "intermediate":
        return "bg-amber-500";
      case "expert":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const isExpired = (interview: ScheduledInterviewDto): boolean => {
    if (interview.completed || interview.callEnded) return false;
    const targetDate =
      interview.interviewMode === "ZOOM" && interview.scheduledAt
        ? interview.scheduledAt
        : interview.dueDate;
    return new Date(targetDate) < new Date();
  };

  const interviewList = useMemo(() => {
    return sortScheduledInterviewsByPriority(interviews).filter((i) => {
      if (modeFilter !== "all") {
        const m = i.interviewMode || "AI";
        if (m !== modeFilter) return false;
      }
      if (statusFilter === "upcoming" && i.completed) return false;
      if (statusFilter === "completed" && !i.completed) return false;
      return true;
    });
  }, [interviews, statusFilter, modeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const hasScheduledInterviews = interviews.length > 0;

  return (
    <div className="space-y-6">
      {showResumePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setShowResumePrompt(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="size-5 text-gray-500" />
            </button>

            <div className="text-center">
              <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="size-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Resume Required
              </h3>
              <p className="text-gray-600 mb-6">
                You need to upload your resume before starting an interview. 
                This helps us personalize your interview experience and match you with relevant questions.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleUploadResume}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white w-full hover:from-indigo-600 hover:to-purple-700"
                >
                  Upload Resume Now
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowResumePrompt(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upcoming & Scheduled Interviews</h1>
          <p className="text-gray-600 mt-1">Upcoming interviews are shown first, followed by completed interviews</p>
        </div>
        <Button 
          onClick={handlePracticeInterview}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
        >
          Practice Interview
        </Button>
      </div>

      {hasScheduledInterviews && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <Filter className="size-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "upcoming" | "completed")}>
              <SelectTrigger className="w-[210px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (Upcoming First)</SelectItem>
                <SelectItem value="upcoming">Upcoming Only</SelectItem>
                <SelectItem value="completed">Completed Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modeFilter} onValueChange={(v) => setModeFilter(v as "all" | "AI" | "ZOOM")}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="AI">🤖 AI Interview</SelectItem>
                <SelectItem value="ZOOM">🎥 Zoom Live</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {!hasScheduledInterviews ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="size-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Upcoming Interviews
            </h3>
            <p className="text-gray-600 mb-6">
              You don't have any scheduled interviews at the moment.
            </p>
            <Button 
              onClick={handlePracticeInterview}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
            >
              Practice Interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-0 shadow-lg bg-blue-50 border-l-4 border-l-blue-600">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Important Information
                  </h3>
                  <p className="text-sm text-gray-600">
                    These interviews have been scheduled by recruiters. All
                    interview settings are locked and cannot be modified. Please
                    complete them before the due date.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {interviewList.map((interview, index) => {
              const isZoom = interview.interviewMode === "ZOOM";
              const expired = isExpired(interview);
              const isCompleted = Boolean(interview.completed);
              
              return (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${expired ? 'opacity-75' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`size-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? "bg-gradient-to-br from-emerald-500 to-green-600"
                              : isZoom
                              ? "bg-gradient-to-br from-blue-500 to-cyan-600"
                              : "bg-gradient-to-br from-indigo-500 to-purple-600"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="size-8 text-white" />
                            ) : isZoom ? (
                              <Video className="size-8 text-white" />
                            ) : (
                              <Calendar className="size-8 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <h3 className="text-xl font-bold text-gray-900 capitalize">
                                {interview.type} Interview
                              </h3>
                              <Badge className={getTypeColor(interview.type)}>
                                {interview.type}
                              </Badge>
                              <Badge variant="outline" className={isZoom ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}>
                                {isZoom ? "🎥 Live Zoom Interview" : "🤖 AI Interview"}
                              </Badge>
                              {isCompleted ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  Completed
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                  Upcoming
                                </Badge>
                              )}
                              {expired && (
                                <Badge className="bg-red-100 text-red-700 border-red-200">
                                  Expired
                                </Badge>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-3 mb-4">
                              <div className="flex items-center gap-2 text-gray-600">
                                <User className="size-4" />
                                <span className="text-sm">
                                  Scheduled by:{" "}
                                  <span className="font-medium">
                                    {interview.scheduledByInterviewer}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="size-4" />
                                <span className="text-sm">
                                  {isZoom ? "Scheduled at: " : "Due: "}
                                  <span className="font-medium">
                                    {isZoom && interview.scheduledAt
                                      ? new Date(interview.scheduledAt).toLocaleString()
                                      : new Date(interview.dueDate).toLocaleDateString()}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Timer className="size-4" />
                                <span className="text-sm">
                                  Duration:{" "}
                                  <span className="font-medium">
                                    {interview.duration} min
                                  </span>
                                </span>
                              </div>
                              {isZoom ? (
                                <>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Video className="size-4 text-blue-600" />
                                    <span className="text-sm">
                                      Meeting ID:{" "}
                                      <span className="font-medium">
                                        {interview.meetingId || "Ready"}
                                      </span>
                                    </span>
                                  </div>
                                  {interview.meetingPasscode && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <span className="text-sm">
                                        Passcode:{" "}
                                        <span className="font-mono font-semibold bg-gray-100 px-1.5 py-0.5 rounded">
                                          {interview.meetingPasscode}
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Award className="size-4" />
                                    <span className="text-sm">
                                      Difficulty:{" "}
                                      <span className="font-medium capitalize">
                                        {interview.difficulty}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <ListChecks className="size-4" />
                                    <span className="text-sm">
                                      Questions:{" "}
                                      <span className="font-medium">
                                        {interview.questionCount}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <span className="text-lg">
                                      {interview.avatarStyle === "professional"
                                        ? "👔"
                                        : interview.avatarStyle === "friendly"
                                        ? "😊"
                                        : "🧐"}
                                    </span>
                                    <span className="text-sm">
                                      Avatar:{" "}
                                      <span className="font-medium capitalize">
                                        {interview.avatarStyle}
                                      </span>
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            {!isZoom && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  Difficulty:
                                </span>
                                <div className="flex-1 max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getDifficultyColor(
                                      interview.difficulty
                                    )}`}
                                    style={{
                                      width:
                                        interview.difficulty === "beginner"
                                          ? "33%"
                                          : interview.difficulty === "intermediate"
                                          ? "66%"
                                          : "100%",
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-52">
                          {isCompleted ? (
                            <>
                              <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                  <CheckCircle2 className="size-4 text-green-600" />
                                  <span className="text-xs font-semibold text-green-700">
                                    COMPLETED
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  Evaluation & feedback available
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  interview.applicationId
                                    ? navigate(`/interviewee/applications/${interview.applicationId}`)
                                    : navigate("/interviewee/history")
                                }
                                className="w-full border-green-300 text-green-700 hover:bg-green-50"
                              >
                                View Results
                              </Button>
                            </>
                          ) : isZoom ? (
                            interview.callEnded ? (
                              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                  <Clock className="size-4 text-purple-600 animate-pulse" />
                                  <span className="text-xs font-semibold text-purple-700">
                                    EVALUATION IN PROGRESS
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  Interview completed! Your score & feedback will be updated soon by the interviewer.
                                </p>
                              </div>
                            ) : (
                              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                  <Video className="size-4 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-700">
                                    LIVE INTERVIEW ROOM
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  Join at scheduled time
                                </p>
                              </div>
                            )
                          ) : (
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <AlertCircle className="size-4 text-amber-600" />
                                <span className="text-xs font-medium text-amber-700">
                                  LOCKED SETTINGS
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                Cannot be modified
                              </p>
                            </div>
                          )}
                          
                          {!isCompleted && (isZoom && interview.callEnded ? (
                            <Button
                              variant="outline"
                              onClick={() =>
                                interview.applicationId
                                  ? navigate(`/interviewee/applications/${interview.applicationId}`)
                                  : toast.info("Your score and feedback will be updated soon once the interviewer completes evaluation.")
                              }
                              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              ⏳ Score Updating Soon
                            </Button>
                          ) : expired ? (
                            <div className="space-y-2">
                              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                  <AlertCircle className="size-4 text-red-600" />
                                  <span className="text-xs font-medium text-red-700">
                                    TIME HAS EXPIRED
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  This interview is no longer available.
                                </p>
                              </div>
                              <Button disabled className="w-full bg-gray-400 cursor-not-allowed">
                                {isZoom ? "Join Live Interview" : "Start Interview"}
                              </Button>
                            </div>
                          ) : isZoom ? (
                            <Button
                              onClick={() => navigate(`/live-interview/${interview.id}`)}
                              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                            >
                              <Video className="mr-2 size-4" />
                              Join Live Interview
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleStartInterview(interview.id)}
                              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                            >
                              Start Interview
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
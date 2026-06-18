import { useEffect, useState } from "react";
import {  useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Calendar, Clock, Award, User, AlertCircle, Timer, ListChecks, FileText, X } from "lucide-react";
import { motion } from "motion/react";
import { scheduledInterviewService } from "../../services/scheduledInterviewService";
import type { ScheduledInterviewDto } from "../../services/scheduledInterviewService";
import { resumeService } from "../../services/resumeService";
import { toast } from "react-toastify";

export default function UpcomingInterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<ScheduledInterviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCV, setHasCV] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingInterviewId, setPendingInterviewId] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await scheduledInterviewService.getMyScheduled();
        setInterviews(Array.isArray(data) ? data : []);
        
        try {
          const resume = await resumeService.getActiveResume();
          setHasCV(!!(resume && resume.status === 'COMPLETED'));
        } catch {
          setHasCV(false);
        }
      } catch (error) {
        console.error("Failed to load scheduled interviews", error);
        toast.error("Failed to load scheduled interviews");
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

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

  const isExpired = (dueDate: string): boolean => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const interviewList = Array.isArray(interviews) ? interviews.filter(i => !i.completed) : [];
  const hasScheduledInterviews = interviewList.length > 0;

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

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Interviews</h1>
          <p className="text-gray-600 mt-1">Interviews scheduled by recruiters</p>
        </div>
        <Button 
          onClick={handlePracticeInterview}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
        >
          Practice Interview
        </Button>
      </div>

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
              const expired = isExpired(interview.dueDate);
              
              return (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${expired ? 'opacity-75' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="size-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Calendar className="size-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <h3 className="text-xl font-bold text-gray-900 capitalize">
                                {interview.type} Interview
                              </h3>
                              <Badge className={getTypeColor(interview.type)}>
                                {interview.type}
                              </Badge>
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
                                  Due:{" "}
                                  <span className="font-medium">
                                    {new Date(interview.dueDate).toLocaleDateString()}
                                  </span>
                                </span>
                              </div>
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
                                <Timer className="size-4" />
                                <span className="text-sm">
                                  Duration:{" "}
                                  <span className="font-medium">
                                    {interview.duration} min
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
                            </div>

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
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
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
                          
                          {expired ? (
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
                                Start Interview
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => handleStartInterview(interview.id)}
                              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                            >
                              Start Interview
                            </Button>
                          )}
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
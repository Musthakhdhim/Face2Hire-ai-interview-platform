import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Calendar, Clock, Award, User, AlertCircle, Timer, ListChecks } from "lucide-react";
import { motion } from "motion/react";
import { scheduledInterviewService } from "../../services/scheduledInterviewService";
import type { ScheduledInterviewDto } from "../../services/scheduledInterviewService";
import { toast } from "react-toastify";

export default function UpcomingInterviewsPage() {
  const [interviews, setInterviews] = useState<ScheduledInterviewDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await scheduledInterviewService.getMyScheduled();
        setInterviews(Array.isArray(data) ? data : []);
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const interviewList = Array.isArray(interviews) ? interviews : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upcoming Interviews</h1>
        <p className="text-gray-600 mt-1">Interviews scheduled by recruiters</p>
      </div>

      {interviewList.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="size-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Upcoming Interviews
            </h3>
            <p className="text-gray-600 mb-6">
              You don't have any scheduled interviews at the moment.
            </p>
            <Link to="/interviewee/interview/setup">
              <Button>Practice Interview</Button>
            </Link>
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
            {interviewList.map((interview, index) => (
              <motion.div
                key={interview.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="size-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Calendar className="size-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-xl font-bold text-gray-900 capitalize">
                              {interview.type} Interview
                            </h3>
                            <Badge className={getTypeColor(interview.type)}>
                              {interview.type}
                            </Badge>
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
                        <Link
                          to={`/interviewee/interview/setup?scheduled=${interview.id}`}
                        >
                          <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">
                            Start Interview
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
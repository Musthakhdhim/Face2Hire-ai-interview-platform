import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Calendar, Clock, User, Target, Award, FileText, MessageSquare } from "lucide-react";
import { scheduledInterviewService, type ScheduledInterviewDto } from "../../services/scheduledInterviewService";
import { interviewService, type OverallFeedbackDto } from "../../services/interviewService";
import { toast } from "react-toastify";

export default function ScheduledInterviewDetailPage() {
    const { scheduledId } = useParams();
    const navigate = useNavigate();
    const [interview, setInterview] = useState<ScheduledInterviewDto | null>(null);
    const [feedback, setFeedback] = useState<OverallFeedbackDto | null>(null);
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        
        const fetch = async () => {
            try {
                const data = await scheduledInterviewService.getById(Number(scheduledId));
                setInterview(data);
                if (data.completed) {
                    try {
                        const fb = await interviewService.getOverallFeedbackByScheduledId(data.id);
                        setFeedback(fb);

                        console.log("feedback "+feedback);
                    } catch (err) {
                        console.error("Failed to fetch feedback", err);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load interview details");
                navigate("/interviewer/scheduled");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [scheduledId, navigate]);

    if (loading) return <div className="text-center py-12">Loading...</div>;
    if (!interview) return <div className="text-center py-12">Interview not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate("/interviewer/scheduled")}>← Back to Scheduled Interviews</Button>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Scheduled Interview Details</h1>
                <p className="text-gray-600 mt-1">View interview settings and candidate progress</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Interview Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <User className="size-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm text-gray-500">Candidate</div>
                                    <div className="font-medium text-gray-900">{interview.intervieweeName}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Target className="size-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm text-gray-500">Type / Difficulty</div>
                                    <div className="font-medium capitalize">{interview.type} • {interview.difficulty}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="size-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm text-gray-500">Duration / Questions</div>
                                    <div className="font-medium">{interview.duration} min • {interview.questionCount} questions</div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Calendar className="size-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm text-gray-500">Due Date</div>
                                    <div className="font-medium">{new Date(interview.dueDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Award className="size-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm text-gray-500">Minimum Score Required</div>
                                    <div className="font-medium">{interview.minimumScore}%</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FileText className="size-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm text-gray-500">Avatar</div>
                                    <div className="font-medium capitalize">
                                        {interview.avatarStyle === "professional" ? "👔" : interview.avatarStyle === "friendly" ? "😊" : "🧐"} {interview.avatarStyle}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Badge className={interview.completed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                                {interview.completed ? "Completed" : "Pending"}
                            </Badge>
                            <span className="text-sm text-gray-600">
                                {interview.completed ? "Candidate has taken this interview." : "Candidate has not yet taken the interview."}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {feedback && (
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="size-5 text-indigo-600" />
                            Interview Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-3xl font-bold text-blue-600">{feedback.communicationScore}%</div>
                                <div className="text-sm text-gray-600">Communication</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-3xl font-bold text-purple-600">{feedback.technicalScore}%</div>
                                <div className="text-sm text-gray-600">Technical / Relevant</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-3xl font-bold text-green-600">{feedback.confidenceScore}%</div>
                                <div className="text-sm text-gray-600">Confidence</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Strengths</h4>
                            <p className="text-gray-700">{feedback.strengths}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Areas for Improvement</h4>
                            <p className="text-gray-700">{feedback.improvements}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Detailed Feedback</h4>
                            <p className="text-gray-700">{feedback.detailedFeedback}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!interview.completed && (
                <Card className="bg-amber-50 border-l-4 border-l-amber-600">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-700">
                            This interview has not been completed yet. Once the candidate takes it, the feedback will appear here.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
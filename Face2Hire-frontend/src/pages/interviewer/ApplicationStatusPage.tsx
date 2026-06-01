import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { 
  Briefcase, User, Mail, Calendar, Clock, 
  Award, Target, MessageSquare, CheckCircle2, XCircle, FileText 
} from "lucide-react";
import { applicationService, type ApplicationResponse } from "../../services/applicationService";
import { scheduledInterviewService, type ScheduledInterviewDto } from "../../services/scheduledInterviewService";
import { interviewService, type OverallFeedbackDto } from "../../services/interviewService";
import { toast } from "react-toastify";

export default function ApplicationStatusPage() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState<ApplicationResponse | null>(null);
    const [scheduled, setScheduled] = useState<ScheduledInterviewDto | null>(null);
    const [feedback, setFeedback] = useState<OverallFeedbackDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const app = await applicationService.getApplicationById(Number(applicationId));
                setApplication(app);
                const sched = await scheduledInterviewService.getByApplicationId(Number(applicationId));
                setScheduled(sched);
                // Fetch feedback if application has a score and a scheduled interview exists
                if (app.score && app.score > 0 && sched) {
                    try {
                        const fb = await interviewService.getOverallFeedbackByScheduledId(sched.id);
                        setFeedback(fb);
                    } catch (err) {
                        console.error("Failed to fetch feedback", err);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [applicationId]);

    const handleApprove = async () => {
        try {
            await applicationService.updateApplicationStatus(Number(applicationId), "APPROVED");
            toast.success("Application approved");
            navigate("/interviewer/applications");
        } catch {
            toast.error("Failed to approve");
        }
    };

    const handleReject = async () => {
        try {
            await applicationService.updateApplicationStatus(Number(applicationId), "REJECTED");
            toast.success("Application rejected");
            navigate("/interviewer/applications");
        } catch {
            toast.error("Failed to reject");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="size-3 mr-1" /> Approved</Badge>;
            case "REJECTED":
                return <Badge className="bg-red-100 text-red-700"><XCircle className="size-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
        }
    };

    if (loading) return <div className="flex justify-center py-12">Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <Button variant="ghost" onClick={() => navigate("/interviewer/applications")} className="mb-2">
                    ← Back to Applications
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
                <p className="text-gray-600 mt-1">Review candidate information and interview results</p>
            </div>

            {/* Application Details Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="size-5 text-indigo-600" />
                            Application Information
                        </CardTitle>
                        {getStatusBadge(application?.status || "")}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Briefcase className="size-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-500">Job</div>
                                        <div className="font-medium text-gray-900">{application?.jobTitle} at {application?.company}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="size-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-500">Candidate</div>
                                        <div className="font-medium text-gray-900">{application?.userName}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="size-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-500">Email</div>
                                        <div className="font-medium text-gray-900">{application?.userEmail}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <FileText className="size-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-500">Cover Letter</div>
                                        <div className="text-gray-700">{application?.coverLetter || "No cover letter provided"}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Award className="size-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-500">Overall Score</div>
                                        <div className="font-semibold text-gray-900">{application?.score ?? "Not yet"}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Scheduled Interview Card */}
            {scheduled && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="size-5 text-indigo-600" />
                                Scheduled Interview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Target className="size-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-sm text-gray-500">Type</div>
                                            <div className="font-medium capitalize text-gray-900">{scheduled.type}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="size-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-sm text-gray-500">Duration / Questions</div>
                                            <div className="font-medium text-gray-900">{scheduled.duration} min • {scheduled.questionCount} questions</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Award className="size-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-sm text-gray-500">Minimum Score Required</div>
                                            <div className="font-medium text-gray-900">{scheduled.minimumScore}%</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="size-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-sm text-gray-500">Due Date</div>
                                            <div className="font-medium text-gray-900">{new Date(scheduled.dueDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <User className="size-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-sm text-gray-500">Scheduled By</div>
                                            <div className="font-medium text-gray-900">{scheduled.scheduledByInterviewer}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="size-5" />
                                        <div>
                                            <div className="text-sm text-gray-500">Avatar</div>
                                            <div className="font-medium capitalize flex items-center gap-1">
                                                <span className="text-lg">
                                                    {scheduled.avatarStyle === "professional" ? "👔" : 
                                                     scheduled.avatarStyle === "friendly" ? "😊" : "🧐"}
                                                </span>
                                                {scheduled.avatarStyle}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Feedback Card */}
            {feedback && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="size-5 text-indigo-600" />
                                Interview Feedback
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="text-3xl font-bold text-blue-600">{feedback.communicationScore}%</div>
                                    <div className="text-sm text-gray-600 mt-1">Communication</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <div className="text-3xl font-bold text-purple-600">{feedback.technicalScore}%</div>
                                    <div className="text-sm text-gray-600 mt-1">Technical Skills</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="text-3xl font-bold text-green-600">{feedback.confidenceScore}%</div>
                                    <div className="text-sm text-gray-600 mt-1">Confidence</div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Strengths</h4>
                                <p className="text-gray-700 whitespace-pre-wrap">{feedback.strengths || "None observed."}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Areas for Improvement</h4>
                                <p className="text-gray-700 whitespace-pre-wrap">{feedback.improvements || "No specific improvements noted."}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Detailed Feedback</h4>
                                <p className="text-gray-700 whitespace-pre-wrap">{feedback.detailedFeedback}</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Action Buttons (only if application is still pending) */}
            {application?.status === "PENDING" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Make a Decision</h3>
                                    <p className="text-sm text-gray-600">Approve or reject this application based on the interview results.</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle2 className="mr-2 size-4" /> Approve
                                    </Button>
                                    <Button onClick={handleReject} variant="destructive">
                                        <XCircle className="mr-2 size-4" /> Reject
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
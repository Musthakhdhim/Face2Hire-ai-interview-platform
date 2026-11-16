import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Calendar, Clock, User, Target, Award, FileText, MessageSquare, Video, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { scheduledInterviewService, type ScheduledInterviewDto } from "../../services/scheduledInterviewService";
import { interviewService, type OverallFeedbackDto } from "../../services/interviewService";
import { useRealtimeSubscription } from "../../hooks/useRealtimeSubscription";
import { toast } from "react-toastify";

export default function ScheduledInterviewDetailPage() {
    const { scheduledId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [interview, setInterview] = useState<ScheduledInterviewDto | null>(null);
    const [feedback, setFeedback] = useState<OverallFeedbackDto | null>(null);
    const [loading, setLoading] = useState(true);

    const [showEvalForm, setShowEvalForm] = useState(false);
    const [submittingEval, setSubmittingEval] = useState(false);
    const [evalApproved, setEvalApproved] = useState(true);
    const [overallScore, setOverallScore] = useState(75);
    const [communicationScore, setCommunicationScore] = useState(75);
    const [technicalScore, setTechnicalScore] = useState(75);
    const [confidenceScore, setConfidenceScore] = useState(75);
    const [strengths, setStrengths] = useState("");
    const [improvements, setImprovements] = useState("");
    const [detailedFeedback, setDetailedFeedback] = useState("");

    const fetchDetail = useCallback(async (silent = false) => {
        try {
            const data = await scheduledInterviewService.getById(Number(scheduledId));
            setInterview(data);
            if (!silent && data.minimumScore) {
                setOverallScore(data.minimumScore);
            }
            if (!silent && searchParams.get("evaluate") === "true" && !data.completed) {
                setShowEvalForm(true);
            }
            if (data.completed) {
                try {
                    const fb = await interviewService.getOverallFeedbackByScheduledId(data.id);
                    setFeedback(fb);
                } catch (err) {
                    console.error("Failed to fetch feedback", err);
                }
            }
        } catch (error) {
            if (!silent) {
                console.error(error);
                toast.error("Failed to load interview details");
                navigate("/interviewer/scheduled");
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [scheduledId, navigate, searchParams]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    useRealtimeSubscription(
        [
            scheduledId ? `/topic/live-room/${scheduledId}` : null,
            "/topic/interviewer/interviews",
        ],
        () => {
            fetchDetail(true);
        }
    );

    const handleSubmitEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!interview) return;
        setSubmittingEval(true);
        try {
            const updated = await scheduledInterviewService.evaluateLiveInterview(interview.id, {
                approved: evalApproved,
                score: overallScore,
                communicationScore,
                technicalScore,
                confidenceScore,
                strengths: strengths.trim() || undefined,
                improvements: improvements.trim() || undefined,
                feedback: detailedFeedback.trim() || undefined,
            });
            setInterview(updated);
            setShowEvalForm(false);
            toast.success(evalApproved ? "Candidate approved and evaluation saved!" : "Candidate rejected and evaluation saved.");
            try {
                const fb = await interviewService.getOverallFeedbackByScheduledId(interview.id);
                setFeedback(fb);
            } catch {
                // ignore
            }
        } catch {
            toast.error("Failed to submit evaluation");
        } finally {
            setSubmittingEval(false);
        }
    };

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
                    <div className="flex items-center justify-between">
                        <CardTitle>Interview Information</CardTitle>
                        <Badge variant="outline" className={interview.interviewMode === "ZOOM" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}>
                            {interview.interviewMode === "ZOOM" ? "🎥 Zoom Live Interview" : "🤖 AI Interview"}
                        </Badge>
                    </div>
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
                                    <div className="text-sm text-gray-500">
                                        {interview.interviewMode === "ZOOM" ? "Round Type / Mode" : "Type / Difficulty"}
                                    </div>
                                    <div className="font-medium capitalize">
                                        {interview.interviewMode === "ZOOM"
                                            ? `${interview.type} • Live Zoom`
                                            : `${interview.type} • ${interview.difficulty}`}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="size-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm text-gray-500">
                                        {interview.interviewMode === "ZOOM" ? "Duration" : "Duration / Questions"}
                                    </div>
                                    <div className="font-medium">
                                        {interview.interviewMode === "ZOOM"
                                            ? `${interview.duration} min`
                                            : `${interview.duration} min • ${interview.questionCount} questions`}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Calendar className="size-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm text-gray-500">
                                        {interview.interviewMode === "ZOOM" ? "Scheduled Date & Time" : "Due Date"}
                                    </div>
                                    <div className="font-medium">
                                        {interview.interviewMode === "ZOOM" && interview.scheduledAt
                                            ? new Date(interview.scheduledAt).toLocaleString()
                                            : new Date(interview.dueDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Award className="size-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm text-gray-500">Minimum Score Required</div>
                                    <div className="font-medium">{interview.minimumScore}%</div>
                                </div>
                            </div>
                            {interview.interviewMode === "ZOOM" ? (
                                <div className="flex items-start gap-3">
                                    <Video className="size-5 text-blue-500 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-500">Zoom Meeting Details</div>
                                        <div className="font-medium text-sm">
                                            ID: {interview.meetingId || "Auto"}{" "}
                                            {interview.meetingPasscode && `• Passcode: ${interview.meetingPasscode}`}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <FileText className="size-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-500">Avatar</div>
                                        <div className="font-medium capitalize">
                                            {interview.avatarStyle === "professional" ? "👔" : interview.avatarStyle === "friendly" ? "😊" : "🧐"} {interview.avatarStyle}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {interview.interviewMode === "ZOOM" && !interview.completed && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-semibold text-blue-900">
                                    {interview.callEnded ? "Live Call Ended — Ready for Evaluation" : "Live Interview Room Ready"}
                                </h4>
                                <p className="text-xs text-blue-700 mt-0.5">
                                    {interview.callEnded
                                        ? "Please record the candidate's score, strengths, weaknesses, and decision below."
                                        : "Join the embedded Face2Hire live interview room at the scheduled time."}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => navigate(`/live-interview/${interview.id}`)}
                                >
                                    <Video className="mr-2 size-4" />
                                    {interview.callEnded ? "Rejoin Live Room" : "Start Live Interview"}
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => setShowEvalForm(prev => !prev)}
                                >
                                    <CheckCircle2 className="mr-2 size-4" />
                                    {showEvalForm ? "Hide Evaluation Form" : "Evaluate & Score Candidate"}
                                </Button>
                                {interview.applicationId && (
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/interviewer/applications/${interview.applicationId}/status`)}
                                    >
                                        <ExternalLink className="mr-2 size-4" /> Application Stages
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Badge className={interview.completed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                                {interview.completed ? "Completed" : "Pending"}
                            </Badge>
                            <span className="text-sm text-gray-600">
                                {interview.completed
                                    ? "This interview has been completed."
                                    : interview.interviewMode === "ZOOM"
                                    ? "Awaiting live Zoom session and interviewer evaluation."
                                    : "Candidate has not yet taken the interview."}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {showEvalForm && !interview.completed && (
                <Card className="border-2 border-indigo-500 shadow-xl">
                    <CardHeader>
                        <CardTitle>Evaluate Candidate — {interview.intervieweeName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmitEvaluation} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEvalApproved(true)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        evalApproved
                                            ? "border-2 border-green-600 bg-green-50 text-green-900 font-semibold"
                                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                                    }`}
                                >
                                    <CheckCircle2 className="inline size-4 mr-1 text-green-600" /> Approve Candidate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEvalApproved(false);
                                        if (overallScore >= (interview.minimumScore || 70)) {
                                            setOverallScore(45);
                                        }
                                    }}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        !evalApproved
                                            ? "border-2 border-red-600 bg-red-50 text-red-900 font-semibold"
                                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                                    }`}
                                >
                                    <XCircle className="inline size-4 mr-1 text-red-600" /> Reject Candidate
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <Label className="text-xs font-semibold">Overall Score (%) *</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={overallScore}
                                        onChange={(e) => setOverallScore(Number(e.target.value))}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Communication (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={communicationScore}
                                        onChange={(e) => setCommunicationScore(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Technical (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={technicalScore}
                                        onChange={(e) => setTechnicalScore(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Confidence (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={confidenceScore}
                                        onChange={(e) => setConfidenceScore(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                    <Label>Strengths</Label>
                                    <Textarea
                                        value={strengths}
                                        onChange={(e) => setStrengths(e.target.value)}
                                        placeholder="Key strengths observed during the interview..."
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label>Weaknesses / Areas for Improvement</Label>
                                    <Textarea
                                        value={improvements}
                                        onChange={(e) => setImprovements(e.target.value)}
                                        placeholder="Areas where the candidate can improve..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Detailed Feedback</Label>
                                <Textarea
                                    value={detailedFeedback}
                                    onChange={(e) => setDetailedFeedback(e.target.value)}
                                    placeholder="Overall summary and decision rationale..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowEvalForm(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submittingEval}
                                    className={evalApproved ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                                >
                                    {submittingEval
                                        ? "Saving..."
                                        : evalApproved
                                        ? "Save Score & Approve"
                                        : "Save Score & Reject"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

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
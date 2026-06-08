import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Loader2, User, Mail, Calendar, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { interviewService } from '../../services/interviewService';
import type { AdminInterviewDetailResponse } from '../../types/admin';

export default function AdminInterviewDetailPage() {
    const { interviewId } = useParams();
    const [detail, setDetail] = useState<AdminInterviewDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await interviewService.getInterviewDetailForAdmin(Number(interviewId));
                setDetail(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load interview details');
            } finally {
                setLoading(false);
            }
        };
        if (interviewId) fetchDetail();
    }, [interviewId]);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-indigo-600" /></div>;
    if (!detail) return <div className="text-center py-12">Interview not found</div>;

    const formatDate = (dateStr: string | null) => dateStr ? new Date(dateStr).toLocaleString() : 'N/A';
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
            case 'ACTIVE': return <Badge className="bg-blue-100 text-blue-700">Active</Badge>;
            default: return <Badge className="bg-red-100 text-red-700">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Link to="/admin/interviews">
                    <Button variant="ghost">← Back to Interviews</Button>
                </Link>
            </div>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Interview Details</h1>
                <p className="text-gray-600 mt-1">Complete session information with question‑wise analysis</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Session Overview</CardTitle>
                    <CardDescription>Basic information about the interview</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2"><User className="size-4 text-gray-400" /> <strong>Candidate:</strong> {detail.userName || detail.userEmail}</div>
                        <div className="flex items-center gap-2"><Mail className="size-4 text-gray-400" /> {detail.userEmail}</div>
                        <div className="flex items-center gap-2"><Calendar className="size-4 text-gray-400" /> <strong>Started:</strong> {formatDate(detail.startedAt)}</div>
                        <div className="flex items-center gap-2"><Clock className="size-4 text-gray-400" /> <strong>Completed:</strong> {formatDate(detail.completedAt)}</div>
                    </div>
                    <div className="space-y-2">
                        <div><strong>Type:</strong> <span className="capitalize">{detail.type}</span> | <strong>Difficulty:</strong> <span className="capitalize">{detail.difficulty}</span></div>
                        <div><strong>Duration:</strong> {detail.duration} min | <strong>Questions:</strong> {detail.questionCount}</div>
                        <div>{getStatusBadge(detail.status)}</div>
                        {detail.isScheduled && <Badge variant="outline">Scheduled (ID: {detail.scheduledInterviewId})</Badge>}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{detail.overallScore ?? 'N/A'}%</div><div className="text-sm text-gray-600">Overall</div></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{detail.communicationScore ?? 'N/A'}%</div><div className="text-sm text-gray-600">Communication</div></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{detail.technicalScore ?? 'N/A'}%</div><div className="text-sm text-gray-600">Technical</div></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-amber-600">{detail.confidenceScore ?? 'N/A'}%</div><div className="text-sm text-gray-600">Confidence</div></CardContent></Card>
            </div>

            <Tabs defaultValue="questions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
                    <TabsTrigger value="feedback">Detailed Feedback</TabsTrigger>
                </TabsList>
                <TabsContent value="questions" className="space-y-6">
                    {detail.questions.map((q, _) => (
                        <Card key={q.questionId} className="border-0 shadow-lg">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">Q{q.questionIndex}: {q.questionText}</CardTitle>
                                    {q.score !== null && <Badge className={q.score >= 70 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>Score: {q.score}%</Badge>}
                                </div>
                                <CardDescription>Category: {q.category}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div><strong>Expected keywords:</strong> <span className="text-sm">{q.expectedKeywords.join(', ') || 'None'}</span></div>
                                {q.transcribedText && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <strong className="block mb-1">Transcribed Answer:</strong>
                                        <p className="text-sm">{q.transcribedText}</p>
                                    </div>
                                )}
                                {q.keywordsMatched && q.keywordsMatched.length > 0 && (
                                    <div><strong>Keywords matched:</strong> <span className="text-sm text-green-600">{q.keywordsMatched.join(', ')}</span></div>
                                )}
                                {q.keywordsMissing && q.keywordsMissing.length > 0 && (
                                    <div><strong>Keywords missing:</strong> <span className="text-sm text-red-600">{q.keywordsMissing.join(', ')}</span></div>
                                )}
                                {q.grammarIssues && q.grammarIssues.length > 0 && (
                                    <div><strong>Grammar issues:</strong> <span className="text-sm text-amber-600">{q.grammarIssues.join(', ')}</span></div>
                                )}
                                {q.suggestedAnswer && (
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <strong className="block mb-1">Suggested Answer:</strong>
                                        <p className="text-sm italic">{q.suggestedAnswer}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
                <TabsContent value="feedback" className="space-y-6">
                    {detail.questions.map((q) => (
                        q.feedbackText && (
                            <Card key={q.questionId} className="border-0 shadow-lg">
                                <CardHeader><CardTitle>Q{q.questionIndex}: {q.questionText.substring(0, 80)}...</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <div><strong>Feedback:</strong> {q.feedbackText}</div>
                                    {q.strengths && <div><strong>Strengths:</strong> {q.strengths}</div>}
                                    {q.improvements && <div><strong>Improvements:</strong> {q.improvements}</div>}
                                </CardContent>
                            </Card>
                        )
                    ))}
                    {detail.questions.every(q => !q.feedbackText) && <div className="text-center text-gray-500">No detailed feedback available for any question.</div>}
                </TabsContent>
            </Tabs>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Loader2, Briefcase, MapPin, DollarSign, Calendar, User, Mail, Users, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import { jobService } from '../../services/jobService';
import type { AdminJobDetailResponse } from '../../types/admin';

export default function AdminJobDetailPage() {
    const { jobId } = useParams();
    const [jobDetail, setJobDetail] = useState<AdminJobDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await jobService.getJobDetailForAdmin(Number(jobId));
                setJobDetail(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };
        if (jobId) fetchDetail();
    }, [jobId]);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-indigo-600" /></div>;
    if (!jobDetail) return <div className="text-center py-12">Job not found</div>;

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();
    const getStatusBadge = (status: string) => {
        if (status === 'ACTIVE') return <Badge className="bg-green-100 text-green-700">Active</Badge>;
        return <Badge className="bg-red-100 text-red-700">Closed</Badge>;
    };

    const getAppStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
            case 'REJECTED': return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
            default: return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Link to="/admin/jobs">
                    <Button variant="ghost">← Back to Jobs</Button>
                </Link>
            </div>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Details</h1>
                <p className="text-gray-600 mt-1">Complete information about the job posting and applicants</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>{jobDetail.title}</CardTitle>
                    <CardDescription>{jobDetail.company}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                        {getStatusBadge(jobDetail.status)}
                        <Badge variant="outline" className="capitalize">{jobDetail.type.toLowerCase().replace('_', ' ')}</Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2"><MapPin className="size-4 text-gray-400" /> {jobDetail.location || 'Remote'}</div>
                            <div className="flex items-center gap-2"><DollarSign className="size-4 text-gray-400" /> {jobDetail.salary || 'Not specified'}</div>
                            <div className="flex items-center gap-2"><Briefcase className="size-4 text-gray-400" /> Experience: {jobDetail.requiredExperience ?? 0} years</div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2"><Calendar className="size-4 text-gray-400" /> Posted: {formatDate(jobDetail.createdAt)}</div>
                            <div className="flex items-center gap-2"><Users className="size-4 text-gray-400" /> Applicants: {jobDetail.applicantsCount}</div>
                            <div className="flex items-center gap-2"><User className="size-4 text-gray-400" /> Posted by: {jobDetail.postedByUserName || jobDetail.postedByUserEmail}</div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{jobDetail.description}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {jobDetail.skills.map((skill, idx) => (
                                <Badge key={idx} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="applications">
                <TabsList>
                    <TabsTrigger value="applications">Applications ({jobDetail.applications.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="applications">
                    <Card className="border-0 shadow-lg">
                        <CardHeader><CardTitle>Candidates Who Applied</CardTitle></CardHeader>
                        <CardContent>
                            {jobDetail.applications.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">No applications yet</div>
                            ) : (
                                <div className="space-y-4">
                                    {jobDetail.applications.map((app) => (
                                        <Card key={app.id} className="border border-gray-200">
                                            <CardContent className="p-4">
                                                <div className="flex flex-wrap justify-between items-start gap-4">
                                                    <div>
                                                        <div className="font-semibold">{app.userName}</div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-2"><Mail className="size-3" /> {app.userEmail}</div>
                                                        <div className="text-xs text-gray-400">Applied: {formatDate(app.appliedAt)}</div>
                                                        {app.score && <div className="text-sm mt-1">Score: {app.score}%</div>}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        {getAppStatusBadge(app.status)}
                                                        {app.hasScheduledInterview && <Badge variant="outline" className="bg-blue-50">Scheduled</Badge>}
                                                        <Link to={`/admin/users/${app.userId}`}>
                                                            <Button size="sm" variant="outline">View Candidate</Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Loader2, Mail, Phone, Calendar, FileText, User, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { userService } from '../../services/userService';
import type { AdminUserDetailResponse } from '../../types/admin';

export default function AdminUserDetailPage() {
    const { userId } = useParams();
    const [userDetail, setUserDetail] = useState<AdminUserDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await userService.getUserDetail(Number(userId));
                // console.log('User detail:', data);
                setUserDetail(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load user details');
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchDetail();
    }, [userId]);

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-indigo-600" /></div>;
    }
    if (!userDetail) return <div className="text-center py-12">User not found</div>;

    const formatDate = (dateStr: string | null) => dateStr ? new Date(dateStr).toLocaleString() : 'Never';

    const isInterviewee = userDetail.role === 'INTERVIEWEE';

    const isUserActive = (userDetail as any).active !== undefined ? (userDetail as any).active : userDetail.isActive;
    
    const getStatusBadge = () => {
        if (isUserActive) {
            return <Badge className="bg-green-100 text-green-700">Active</Badge>;
        } else {
            return <Badge className="bg-red-100 text-red-700">Blocked</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Link to="/admin/users">
                    <Button variant="ghost" className="mb-2">← Back to Users</Button>
                </Link>
            </div>

            <div>
                <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
                <p className="text-gray-600 mt-1">View complete profile, interview performance and resume information</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6 text-center">
                        <Avatar className="size-24 mx-auto mb-4">
                            <AvatarImage src={userDetail.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-2xl">
                                {(userDetail.fullName?.[0] || userDetail.userName?.[0] || 'U').toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold">{userDetail.fullName || userDetail.userName}</h2>
                        <p className="text-gray-500">@{userDetail.userName}</p>
                        <div className="flex justify-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="capitalize">{userDetail.role.toLowerCase()}</Badge>
                            {getStatusBadge()}
                            {userDetail.isVerified && <Badge className="bg-blue-100 text-blue-700">Verified</Badge>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg col-span-2">
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>Personal and account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2"><Mail className="size-4 text-gray-400" /> {userDetail.email}</div>
                        <div className="flex items-center gap-2"><Phone className="size-4 text-gray-400" /> {userDetail.phoneNumber || 'Not provided'}</div>
                        <div className="flex items-center gap-2"><User className="size-4 text-gray-400" /> Username: {userDetail.userName}</div>
                        <div className="flex items-center gap-2"><Calendar className="size-4 text-gray-400" /> Joined: {formatDate(userDetail.createdAt)}</div>
                        <div className="flex items-center gap-2"><Calendar className="size-4 text-gray-400" /> Last Active: {formatDate(userDetail.lastLoginAt)}</div>
                    </CardContent>
                </Card>
            </div>

            {isInterviewee ? (
                <Tabs defaultValue="interviews" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="interviews">Interview Statistics</TabsTrigger>
                        <TabsTrigger value="resume">Resume Data</TabsTrigger>
                    </TabsList>

                    <TabsContent value="interviews">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle>Performance Overview</CardTitle>
                                <CardDescription>Aggregated scores from completed interviews</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-5 gap-4 mb-6">
                                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                                        <div className="text-3xl font-bold text-blue-600">{userDetail.interviewStats?.totalCompletedInterviews ?? 0}</div>
                                        <div className="text-sm text-gray-600">Completed Interviews</div>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg text-center">
                                        <div className="text-3xl font-bold text-green-600">{Math.round(userDetail.interviewStats?.avgOverallScore ?? 0)}%</div>
                                        <div className="text-sm text-gray-600">Avg Overall</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                                        <div className="text-3xl font-bold text-purple-600">{Math.round(userDetail.interviewStats?.avgCommunicationScore ?? 0)}%</div>
                                        <div className="text-sm text-gray-600">Communication</div>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                                        <div className="text-3xl font-bold text-amber-600">{Math.round(userDetail.interviewStats?.avgTechnicalScore ?? 0)}%</div>
                                        <div className="text-sm text-gray-600">Technical</div>
                                    </div>
                                    <div className="p-4 bg-indigo-50 rounded-lg text-center">
                                        <div className="text-3xl font-bold text-indigo-600">{Math.round(userDetail.interviewStats?.avgConfidenceScore ?? 0)}%</div>
                                        <div className="text-sm text-gray-600">Confidence</div>
                                    </div>
                                </div>
                                {(userDetail.interviewStats?.totalCompletedInterviews ?? 0) === 0 && (
                                    <p className="text-center text-gray-500 mt-4">No completed interviews yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="resume">
                        {!userDetail.resume ? (
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-12 text-center text-gray-500">No resume uploaded or processing incomplete</CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader>
                                        <CardTitle>Uploaded Resume</CardTitle>
                                        <CardDescription>Extracted information from CV</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FileText className="size-8 text-indigo-600" />
                                                <div>
                                                    <div className="font-medium">{userDetail.resume.fileName}</div>
                                                    <div className="text-sm text-gray-500">Uploaded {formatDate(userDetail.resume.uploadedAt)}</div>
                                                </div>
                                            </div>
                                            <Badge variant={userDetail.resume.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                                {userDetail.resume.status}
                                            </Badge>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                                            <div><strong>Extracted Name:</strong> {userDetail.resume.extractedFullName || '—'}</div>
                                            <div><strong>Extracted Email:</strong> {userDetail.resume.extractedEmail || '—'}</div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {userDetail.resume.skills.length > 0 && (
                                    <Card className="border-0 shadow-lg">
                                        <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
                                        <CardContent className="flex flex-wrap gap-2">
                                            {userDetail.resume.skills.map((skill, i) => (
                                                <Badge key={i} variant="secondary" className="text-sm py-1.5">
                                                    {skill.name}
                                                    {skill.proficiencyLevel && <span className="ml-1 text-xs opacity-70">({skill.proficiencyLevel.toLowerCase()})</span>}
                                                </Badge>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}

                                {userDetail.resume.experiences.length > 0 && (
                                    <Card className="border-0 shadow-lg">
                                        <CardHeader><CardTitle>Work Experience</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            {userDetail.resume.experiences.map((exp, i) => (
                                                <div key={i} className="border-b pb-4 last:border-0">
                                                    <div className="font-semibold">{exp.jobTitle} at {exp.companyName}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : '?'} – {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                                                    </div>
                                                    {exp.description && <p className="text-sm mt-1 text-gray-700">{exp.description}</p>}
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            ) : (
                <Card className="border-0 shadow-lg bg-gray-50">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="size-12 mx-auto mb-3 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No Interview Data</h3>
                        <p className="text-gray-500">This user is an {userDetail.role}. Only interviewees have interview statistics and resume information.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
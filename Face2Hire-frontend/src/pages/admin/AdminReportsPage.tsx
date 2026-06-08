import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
    Loader2, Users, UserCheck, Briefcase, 
    FileText, TrendingUp, Activity, Star, CheckCircle2, XCircle, 
    Clock
} from 'lucide-react';
import { adminService } from '../../services/userService';
import type { AdminReportsDto } from '../../types/admin';
import { toast } from 'react-toastify';
import { 
    BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function AdminReportsPage() {
    const [reports, setReports] = useState<AdminReportsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [fetchTrigger, setFetchTrigger] = useState(0);

    // Fetch reports when date filters or fetchTrigger changes
    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const data = await adminService.getReports(startDate || undefined, endDate || undefined);
                setReports(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load reports');
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [startDate, endDate, fetchTrigger]);

    const handleFilter = () => {
        setFetchTrigger(prev => prev + 1);
    };

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setFetchTrigger(prev => prev + 1);
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-indigo-600" /></div>;
    }

    if (!reports) return <div className="text-center py-12">No report data available</div>;

    const userRoleData = Object.entries(reports.userReport.usersByRole).map(([role, count]) => ({ name: role, value: count }));
    const interviewTypeData = Object.entries(reports.interviewReport.interviewsByType).map(([type, count]) => ({ name: type, value: count }));
    const avgScoreData = Object.entries(reports.interviewReport.averageScoreByType).map(([type, score]) => ({ type, score: Math.round(score) }));
    const jobTypeData = Object.entries(reports.jobReport.jobsByType).map(([type, count]) => ({ name: type, value: count }));
    const appStatusData = Object.entries(reports.applicationReport.applicationsByStatus).map(([status, count]) => ({ name: status, value: count }));

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600 mt-1">Comprehensive platform statistics and insights</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="text-sm font-medium">From Date</label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-48" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">To Date</label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-48" />
                        </div>
                        <Button onClick={handleFilter} className="bg-indigo-600">Apply Filter</Button>
                        <Button variant="outline" onClick={resetFilters}>Reset</Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="interviews">Interviews</TabsTrigger>
                    <TabsTrigger value="jobs">Jobs</TabsTrigger>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card><CardContent className="p-6 text-center"><Users className="size-8 mx-auto text-blue-500 mb-2" /><div className="text-3xl font-bold">{reports.userReport.totalUsers}</div><div className="text-sm text-gray-600">Total Users</div></CardContent></Card>
                        <Card><CardContent className="p-6 text-center"><UserCheck className="size-8 mx-auto text-green-500 mb-2" /><div className="text-3xl font-bold">{reports.userReport.activeUsers}</div><div className="text-sm text-gray-600">Active Users</div></CardContent></Card>
                        <Card><CardContent className="p-6 text-center"><Star className="size-8 mx-auto text-amber-500 mb-2" /><div className="text-3xl font-bold">{reports.userReport.verifiedUsers}</div><div className="text-sm text-gray-600">Verified Users</div></CardContent></Card>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle>User Growth Trend</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={reports.userReport.userGrowth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#6366f1" name="Users" /></LineChart></ResponsiveContainer></CardContent></Card>
                        <Card><CardHeader><CardTitle>Users by Role</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><RePieChart><Pie data={userRoleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{userRoleData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></RePieChart></ResponsiveContainer></CardContent></Card>
                    </div>
                </TabsContent>

                <TabsContent value="interviews" className="space-y-6">
                    <div className="grid md:grid-cols-4 gap-6">
                        <Card><CardContent className="p-6 text-center"><Activity className="size-8 mx-auto text-purple-500 mb-2" /><div className="text-3xl font-bold">{reports.interviewReport.totalInterviews}</div><div className="text-sm text-gray-600">Total Interviews</div></CardContent></Card>
                        <Card><CardContent className="p-6 text-center"><CheckCircle2 className="size-8 mx-auto text-green-500 mb-2" /><div className="text-3xl font-bold">{reports.interviewReport.completedInterviews}</div><div className="text-sm text-gray-600">Completed</div></CardContent></Card>
                        <Card><CardContent className="p-6 text-center"><XCircle className="size-8 mx-auto text-red-500 mb-2" /><div className="text-3xl font-bold">{reports.interviewReport.abandonedInterviews}</div><div className="text-sm text-gray-600">Abandoned</div></CardContent></Card>
                        <Card><CardContent className="p-6 text-center"><Clock className="size-8 mx-auto text-blue-500 mb-2" /><div className="text-3xl font-bold">{reports.interviewReport.activeInterviews}</div><div className="text-sm text-gray-600">In Progress</div></CardContent></Card>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle>Interviews by Type</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><RePieChart><Pie data={interviewTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{interviewTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></RePieChart></ResponsiveContainer></CardContent></Card>
                        <Card><CardHeader><CardTitle>Average Score by Type</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={avgScoreData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="type" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="score" fill="#8b5cf6" name="Avg Score (%)" /></BarChart></ResponsiveContainer></CardContent></Card>
                    </div>
                    <Card><CardHeader><CardTitle>Interview Volume Trend</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={reports.interviewReport.interviewVolume}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#f59e0b" name="Interviews" /></LineChart></ResponsiveContainer></CardContent></Card>
                </TabsContent>

                <TabsContent value="jobs" className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card><CardContent className="p-6 text-center"><Briefcase className="size-8 mx-auto text-indigo-500 mb-2" /><div className="text-3xl font-bold">{reports.jobReport.totalJobs}</div><div className="text-sm text-gray-600">Total Jobs</div></CardContent></Card>
                        <Card><CardContent className="p-6 text-center"><TrendingUp className="size-8 mx-auto text-green-500 mb-2" /><div className="text-3xl font-bold">{reports.jobReport.activeJobs}</div><div className="text-sm text-gray-600">Active Jobs</div></CardContent></Card>
                        <Card><CardContent className="p-6 text-center"><XCircle className="size-8 mx-auto text-red-500 mb-2" /><div className="text-3xl font-bold">{reports.jobReport.closedJobs}</div><div className="text-sm text-gray-600">Closed Jobs</div></CardContent></Card>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle>Jobs by Type</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><RePieChart><Pie data={jobTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{jobTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></RePieChart></ResponsiveContainer></CardContent></Card>
                        <Card><CardHeader><CardTitle>Job Postings Trend</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={reports.jobReport.jobPostings}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#10b981" name="Jobs Posted" /></LineChart></ResponsiveContainer></CardContent></Card>
                    </div>
                </TabsContent>

                <TabsContent value="applications" className="space-y-6">
                    <div className="grid md:grid-cols-4 gap-6">
                        <Card><CardContent className="p-6 text-center"><FileText className="size-8 mx-auto text-blue-500 mb-2" /><div className="text-3xl font-bold">{reports.applicationReport.totalApplications}</div><div className="text-sm text-gray-600">Total Applications</div></CardContent></Card>
                        <Card><CardContent className="p-6 text-center"><Clock className="size-8 mx-auto text-amber-500 mb-2" /><div className="text-3xl font-bold">{reports.applicationReport.pendingApplications}</div><div className="text-sm text-gray-600">Pending</div></CardContent></Card>
                        <Card><CardContent className="p-6 text-center"><CheckCircle2 className="size-8 mx-auto text-green-500 mb-2" /><div className="text-3xl font-bold">{reports.applicationReport.approvedApplications}</div><div className="text-sm text-gray-600">Approved</div></CardContent></Card>
                        <Card><CardContent className="p-6 text-center"><XCircle className="size-8 mx-auto text-red-500 mb-2" /><div className="text-3xl font-bold">{reports.applicationReport.rejectedApplications}</div><div className="text-sm text-gray-600">Rejected</div></CardContent></Card>
                    </div>
                    <Card><CardHeader><CardTitle>Applications by Status</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><RePieChart><Pie data={appStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{appStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></RePieChart></ResponsiveContainer></CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
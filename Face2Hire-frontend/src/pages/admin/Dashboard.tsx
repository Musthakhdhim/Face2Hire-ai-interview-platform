import { useState, useEffect, type JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Users, Activity, TrendingUp, Star } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminService, type AdminStats } from '../../services/userService';
import { toast } from 'react-toastify';

interface StatItem {
    title: string;
    value: string;
    change: string;
    icon: React.ElementType;
    color: string;
}

interface UserGrowthDataPoint {
    month: string;
    users: number;
}

interface InterviewVolumeDataPoint {
    type: string;
    count: number;
}

export default function AdminDashboard(): JSX.Element {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalInterviews: 0,
        premiumUsers: 0,
    });
    const [loading, setLoading] = useState(true);
    const [userGrowthData, setUserGrowthData] = useState<UserGrowthDataPoint[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, growthData] = await Promise.all([
                    adminService.getStats(),
                    adminService.getUserGrowth(),
                ]);
                setStats(statsData);
                setUserGrowthData(growthData);
            } catch {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const statItems: StatItem[] = [
        { title: 'Total Users', value: stats.totalUsers.toString(), change: '+0%', icon: Users, color: 'bg-blue-100 text-blue-600' },
        { title: 'Active Users', value: stats.activeUsers.toString(), change: '+0%', icon: Activity, color: 'bg-green-100 text-green-600' },
        { title: 'Total Interviews', value: stats.totalInterviews.toString(), change: '+0%', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
        { title: 'Premium Users', value: stats.premiumUsers.toString(), change: '+0%', icon: Star, color: 'bg-amber-100 text-amber-600' },
    ];

    const interviewVolumeData: InterviewVolumeDataPoint[] = [
        { type: 'Technical', count: 2354 },
        { type: 'HR', count: 1308 },
        { type: 'Behavioral', count: 1046 },
        { type: 'Salary', count: 523 },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="size-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-red-500 to-purple-600 text-white border-0">
                <CardContent className="p-8">
                    <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
                    <p className="text-red-100 text-lg">Manage system, users, and monitor platform activity</p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-4 gap-6">
                {statItems.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i} className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className={`size-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                                    <Icon className="size-6" />
                                </div>
                                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-600 mb-2">{stat.title}</div>
                                <Badge className="bg-green-100 text-green-700">{stat.change}</Badge>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>User Growth Trend</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={userGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="users" stroke="#6366f1" name="Users" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Interview Volume by Type</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={interviewVolumeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <span className="font-semibold">System</span> is ready for data. No activity yet.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
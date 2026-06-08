import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Briefcase, Calendar, TrendingUp, Target, Clock, ArrowRight, Loader2 } from 'lucide-react';
import type { RootState } from '../../store/store';
import type { JSX } from 'react';
import { applicationService, type ApplicationListResponse } from '../../services/applicationService';
import { interviewService, type InterviewSessionDto } from '../../services/interviewService';

interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}

export default function IntervieweeDashboard(): JSX.Element {
  const { user } = useSelector((state: RootState) => state.auth);
  const [applications, setApplications] = useState<ApplicationListResponse[]>([]);
  const [completedSessions, setCompletedSessions] = useState<InterviewSessionDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [jobsAppliedCount, setJobsAppliedCount] = useState(0);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [totalPracticeHours, setTotalPracticeHours] = useState(0);
  const [_avgDuration, setAvgDuration] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const appsData = await applicationService.getMyApplications(0, 100);
        setApplications(appsData.content);
        setJobsAppliedCount(appsData.totalElements);

        const allSessions = await interviewService.getUserSessions();
        const completed = allSessions.filter(
          s => s.status === 'COMPLETED' && s.overallScore != null
        );
        setCompletedSessions(completed);
        setTotalInterviews(completed.length);

        if (completed.length > 0) {
          const sum = completed.reduce((acc, s) => acc + (s.overallScore || 0), 0);
          setAvgScore(Math.round(sum / completed.length));
        } else {
          setAvgScore(0);
        }

        const totalMinutes = completed.reduce((acc, s) => acc + (s.duration || 0), 0);
        const hours = Math.round((totalMinutes / 60) * 10) / 10;
        setTotalPracticeHours(hours);

        if (completed.length > 0) {
          setAvgDuration(Math.round(totalMinutes / completed.length));
        } else {
          setAvgDuration(0);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const last3Applications = [...applications]
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 3);

  const last3Interviews = [...completedSessions]
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
    .slice(0, 3);

  const stats: StatItem[] = [
    { title: 'Total Interviews', value: totalInterviews.toString(), change: totalInterviews > 0 ? `+${totalInterviews}` : '0', icon: Target, color: 'bg-blue-100 text-blue-600' },
    { title: 'Average Score', value: `${avgScore}%`, change: avgScore > 0 ? `+${avgScore}%` : '0%', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
    { title: 'Practice Hours', value: `${totalPracticeHours}h`, change: totalPracticeHours > 0 ? `+${totalPracticeHours}h` : '0h', icon: Clock, color: 'bg-purple-100 text-purple-600' },
    { title: 'Jobs Applied', value: jobsAppliedCount.toString(), change: jobsAppliedCount > 0 ? 'New' : 'None', icon: Briefcase, color: 'bg-amber-100 text-amber-600' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case 'REJECTED': return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
          <p className="text-indigo-100 text-lg">Ready to practice today?</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className={`size-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <Icon className="size-6" />
                  </div>
                  <Badge variant="outline">{stat.change}</Badge>
                </div>
                <div className="text-3xl font-bold mt-4">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/interviewee/interview/setup">
          <Card className="border-2 border-indigo-500 bg-indigo-50 hover:shadow-lg transition cursor-pointer">
            <CardContent className="p-6">
              <Target className="size-12 text-indigo-600 mb-3" />
              <h3 className="text-xl font-bold">Start New Interview</h3>
              <p className="text-gray-600 mb-4">Begin a new practice session</p>
              <Button className="w-full bg-indigo-600">Start Now <ArrowRight className="ml-2 size-4" /></Button>
            </CardContent>
          </Card>
        </Link>
        <Link to="/interviewee/jobs">
          <Card className="border-0 shadow-lg hover:shadow-lg transition cursor-pointer">
            <CardContent className="p-6">
              <Briefcase className="size-12 text-purple-600 mb-3" />
              <h3 className="text-xl font-bold">Browse Jobs</h3>
              <p className="text-gray-600 mb-4">Find your next opportunity</p>
              <Button variant="outline" className="w-full">View Jobs</Button>
            </CardContent>
          </Card>
        </Link>
        <Link to="/interviewee/applications">
          <Card className="border-0 shadow-lg hover:shadow-lg transition cursor-pointer">
            <CardContent className="p-6">
              <Calendar className="size-12 text-green-600 mb-3" />
              <h3 className="text-xl font-bold">My Applications</h3>
              <p className="text-gray-600 mb-4">Track your job applications</p>
              <Button variant="outline" className="w-full">View History</Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Applied Jobs</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {last3Applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applications yet. 
                <Link to="/interviewee/jobs" className="text-indigo-600 ml-1">Browse jobs</Link> to apply.
              </div>
            ) : (
              <div className="space-y-3">
                {last3Applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{app.jobTitle}</div>
                      <div className="text-sm text-gray-500">Applied on {formatDate(app.appliedAt)}</div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                ))}
                {jobsAppliedCount > 3 && (
                  <Link to="/interviewee/applications">
                    <Button variant="ghost" className="w-full mt-2">View all {jobsAppliedCount} applications →</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Interviews</CardTitle>
            <CardDescription>Your last 3 practice sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {last3Interviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No interviews taken yet. 
                <Link to="/interviewee/interview/setup" className="text-indigo-600 ml-1">Start your first practice!</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {last3Interviews.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">{session.type} Interview</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(session.completedAt || session.createdAt)} • Score: {session.overallScore ?? '—'}%
                      </div>
                    </div>
                    <Link to={`/interviewee/interview/feedback/${session.id}`}>
                      <Button size="sm" variant="outline">View Feedback</Button>
                    </Link>
                  </div>
                ))}
                {totalInterviews > 3 && (
                  <Link to="/interviewee/history">
                    <Button variant="ghost" className="w-full mt-2">View all {totalInterviews} sessions →</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
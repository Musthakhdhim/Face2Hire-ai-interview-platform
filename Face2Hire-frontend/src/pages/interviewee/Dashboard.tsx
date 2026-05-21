import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Briefcase, Calendar, TrendingUp, Target, Clock, ArrowRight } from 'lucide-react';
import type { RootState } from '../../store/store';
import type { JSX } from 'react';
import { applicationService, type ApplicationListResponse } from '../../services/applicationService';

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
  const [loading, setLoading] = useState(true);
  const [jobsAppliedCount, setJobsAppliedCount] = useState(0);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await applicationService.getMyApplications(0, 100);
        setApplications(data.content);
        setJobsAppliedCount(data.totalElements);
      } catch (error: any) {
        console.error('Failed to fetch applications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const stats: StatItem[] = [
    { title: 'Total Interviews', value: '0', change: '+0%', icon: Target, color: 'bg-blue-100 text-blue-600' },
    { title: 'Average Score', value: '0%', change: '+0%', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
    { title: 'Practice Hours', value: '0h', change: '+0%', icon: Clock, color: 'bg-purple-100 text-purple-600' },
    { title: 'Jobs Applied', value: jobsAppliedCount.toString(), change: jobsAppliedCount > 0 ? 'New' : 'None', icon: Briefcase, color: 'bg-amber-100 text-amber-600' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case 'REJECTED': return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

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
        <Link to="/interviewee/interview">
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
        {/* Applied Jobs Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Applied Jobs</CardTitle>
            <CardDescription>Track your job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applications yet. 
                <Link to="/interviewee/jobs" className="text-indigo-600 ml-1">Browse jobs</Link> to apply.
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{app.jobTitle}</div>
                      <div className="text-sm text-gray-500">Applied on {new Date(app.appliedAt).toLocaleDateString()}</div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                ))}
                {applications.length > 5 && (
                  <Link to="/interviewee/applications">
                    <Button variant="ghost" className="w-full mt-2">View all {applications.length} applications →</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Interviews</CardTitle>
            <CardDescription>Your latest practice sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              No interviews taken yet. 
              <Link to="/interviewee/interview" className="text-indigo-600 ml-1">Start your first practice!</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Skill Proficiency</CardTitle>
          <CardDescription>Your progress in different areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {['Technical Skills', 'Communication', 'Problem Solving', 'Leadership'].map((skill, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span>{skill}</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
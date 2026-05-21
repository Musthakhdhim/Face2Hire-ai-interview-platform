import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Briefcase, Users, Calendar, TrendingUp, Plus, Eye, Loader2 } from 'lucide-react';
import type { RootState } from '../../store/store';
import type { JSX } from 'react';
import { jobService, type JobListResponse } from '../../services/jobService';
import { applicationService, type ApplicationListResponse } from '../../services/applicationService';
import { toast } from 'react-toastify';

interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}

export default function InterviewerDashboard(): JSX.Element {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobListResponse[]>([]);
  const [recentApplications, setRecentApplications] = useState<ApplicationListResponse[]>([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    scheduledInterviews: 0,
    hiredCandidates: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
  try {
    const jobsResponse = await jobService.getMyJobs(0, 100, 'createdAt', 'desc');
    const jobsList = jobsResponse.content;
    setJobs(jobsList);
    const active = jobsList.filter(job => job.status === 'ACTIVE').length;
    const totalApps = jobsList.reduce((sum, job) => sum + (job.applicantsCount || 0), 0);
    
    const appsResponse = await applicationService.getApplicationsForInterviewer(0, 100);
    const applications = appsResponse.content;
    
    const hired = applications.filter(app => app.status === 'APPROVED').length;
    
    const sorted = [...applications].sort((a, b) => 
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );
    const recent = sorted.slice(0, 5);
    setRecentApplications(recent);
    
    setStats({
      activeJobs: active,
      totalApplications: totalApps,
      scheduledInterviews: 0,
      hiredCandidates: hired,
    });
  } catch {
    toast.error('Failed to load dashboard data');
  } finally {
    setLoading(false);
  }
};
    
    fetchData();
  }, []);

  const statItems: StatItem[] = [
    { title: 'Active Jobs', value: stats.activeJobs.toString(), change: `${stats.activeJobs > 0 ? `+${stats.activeJobs}` : '0'} this month`, icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
    { title: 'Total Applications', value: stats.totalApplications.toString(), change: `+${stats.totalApplications} this week`, icon: Users, color: 'bg-green-100 text-green-600' },
    { title: 'Scheduled Interviews', value: stats.scheduledInterviews.toString(), change: '0 upcoming', icon: Calendar, color: 'bg-purple-100 text-purple-600' },
    { title: 'Hired Candidates', value: stats.hiredCandidates.toString(), change: `+${stats.hiredCandidates} total`, icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case 'REJECTED': return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}! 👋</h1>
          <p className="text-purple-100 text-lg">Manage your job postings and review candidates</p>
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
                <Badge className="bg-green-100 text-green-700 text-xs">{stat.change}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/interviewer/jobs/create">
          <Card className="border-2 border-purple-500 bg-purple-50 hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-6">
              <Plus className="size-12 text-purple-600 mb-3" />
              <h3 className="text-xl font-bold">Post New Job</h3>
              <p className="text-gray-600 mb-4">Create a new job posting and define requirements</p>
              <Button className="w-full bg-purple-600">Create Job Posting</Button>
            </CardContent>
          </Card>
        </Link>
        <Link to="/interviewer/applications">
          <Card className="border-0 shadow-lg hover:shadow-lg transition cursor-pointer">
            <CardContent className="p-6">
              <Calendar className="size-12 text-indigo-600 mb-3" />
              <h3 className="text-xl font-bold">Schedule Interview</h3>
              <p className="text-gray-600 mb-4">Schedule an interview for a candidate</p>
              <Button variant="outline" className="w-full">Schedule Now</Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Job Postings</CardTitle>
              <Link to="/interviewer/jobs">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No jobs posted yet. Click "Post New Job" to start.</div>
            ) : (
              <div className="space-y-4">
                {jobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{job.title}</h4>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className="capitalize text-xs">
                            {job.type.toLowerCase().replace('_', ' ')}
                          </Badge>
                          <Badge variant={job.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{job.applicantsCount} applicants</div>
                        <Link to={`/interviewer/jobs/${job.id}`}>
                          <Button size="sm" variant="ghost" className="mt-1">
                            <Eye className="size-4 mr-1" /> View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Applications</CardTitle>
              <Link to="/interviewer/applications">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No applications received yet.</div>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div key={app.id} className="p-3 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{app.userName}</div>
                        <div className="text-sm text-gray-600">{app.jobTitle}</div>
                        <div className="text-xs text-gray-500">Applied {new Date(app.appliedAt).toLocaleDateString()}</div>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
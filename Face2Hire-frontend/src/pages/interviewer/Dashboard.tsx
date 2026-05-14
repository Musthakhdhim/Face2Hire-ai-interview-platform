import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Briefcase, Users, Calendar, TrendingUp, Plus } from 'lucide-react';
import type { RootState } from '../../store/store';
import type { JSX } from 'react';

interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}

export default function InterviewerDashboard(): JSX.Element {
  const { user } = useSelector((state: RootState) => state.auth);

  const stats: StatItem[] = [
    { title: 'Active Jobs', value: '0', change: '+0 this month', icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
    { title: 'Total Applications', value: '0', change: '+0 this week', icon: Users, color: 'bg-green-100 text-green-600' },
    { title: 'Scheduled Interviews', value: '0', change: '0 upcoming', icon: Calendar, color: 'bg-purple-100 text-purple-600' },
    { title: 'Hired Candidates', value: '0', change: '+0 this quarter', icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}! 👋</h1>
          <p className="text-purple-100 text-lg">Manage your job postings and review candidates</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
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
        <Card className="border-2 border-purple-500 bg-purple-50">
          <CardContent className="p-6">
            <Plus className="size-12 text-purple-600 mb-3" />
            <h3 className="text-xl font-bold">Post New Job</h3>
            <p className="text-gray-600 mb-4">Create a new job posting and define requirements</p>
            <Button className="w-full bg-purple-600">Create Job Posting</Button>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <Calendar className="size-12 text-indigo-600 mb-3" />
            <h3 className="text-xl font-bold">Schedule Interview</h3>
            <p className="text-gray-600 mb-4">Schedule an interview for a candidate</p>
            <Button variant="outline" className="w-full">Schedule Now</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Your Job Postings</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">No jobs posted yet. Click "Post New Job" to start.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Applications</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">No applications received yet.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
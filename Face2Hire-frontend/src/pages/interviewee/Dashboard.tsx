import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Briefcase, Calendar, TrendingUp, Target, Clock, ArrowRight } from 'lucide-react';
import type { RootState } from '../../store/store';
import type { JSX } from 'react';

interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}

export default function IntervieweeDashboard(): JSX.Element {
  const { user } = useSelector((state: RootState) => state.auth);

  const stats: StatItem[] = [
    { title: 'Total Interviews', value: '0', change: '+0%', icon: Target, color: 'bg-blue-100 text-blue-600' },
    { title: 'Average Score', value: '0%', change: '+0%', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
    { title: 'Practice Hours', value: '0h', change: '+0%', icon: Clock, color: 'bg-purple-100 text-purple-600' },
    { title: 'Jobs Applied', value: '0', change: 'New', icon: Briefcase, color: 'bg-amber-100 text-amber-600' },
  ];

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
                  <Badge>{stat.change}</Badge>
                </div>
                <div className="text-3xl font-bold mt-4">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-2 border-indigo-500 bg-indigo-50">
          <CardContent className="p-6">
            <Target className="size-12 text-indigo-600 mb-3" />
            <h3 className="text-xl font-bold">Start New Interview</h3>
            <p className="text-gray-600 mb-4">Begin a new practice session</p>
            <Button className="w-full bg-indigo-600">Start Now <ArrowRight className="ml-2 size-4" /></Button>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <Briefcase className="size-12 text-purple-600 mb-3" />
            <h3 className="text-xl font-bold">Browse Jobs</h3>
            <p className="text-gray-600 mb-4">Find your next opportunity</p>
            <Button variant="outline" className="w-full">View Jobs</Button>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <Calendar className="size-12 text-green-600 mb-3" />
            <h3 className="text-xl font-bold">View Feedback History</h3>
            <p className="text-gray-600 mb-4">Review past performance</p>
            <Button variant="outline" className="w-full">View History</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Applied Jobs</CardTitle><CardDescription>Track your job applications</CardDescription></CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">No applications yet. Browse jobs to apply.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Interviews</CardTitle><CardDescription>Your latest practice sessions</CardDescription></CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">No interviews taken yet. Start your first practice!</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Skill Proficiency</CardTitle><CardDescription>Your progress in different areas</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {['Technical Skills', 'Communication', 'Problem Solving', 'Leadership'].map((skill, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1"><span>{skill}</span><span>75%</span></div>
              <Progress value={75} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
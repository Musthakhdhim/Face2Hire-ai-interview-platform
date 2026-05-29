import { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Calendar, User, Clock, CheckCircle2 } from "lucide-react";
import { scheduledInterviewService } from "../../services/scheduledInterviewService";
import type { ScheduledInterviewDto } from "../../services/scheduledInterviewService";
import { toast } from "react-toastify";

export default function ScheduledInterviewsPage() {
  const [interviews, setInterviews] = useState<ScheduledInterviewDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scheduledInterviewService.getForInterviewer().then(setInterviews).catch(() => toast.error("Failed to load scheduled interviews")).finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (dueDate: string) => {
    const isPast = new Date(dueDate) < new Date();
    return isPast ? <Badge className="bg-red-100 text-red-700">Expired</Badge> : <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900">Scheduled Interviews</h1><p className="text-gray-600 mt-1">View all interviews you've scheduled for candidates</p></div>
      {interviews.length === 0 ? (
        <Card className="border-0 shadow-lg"><CardContent className="p-12 text-center"><Calendar className="size-16 mx-auto mb-4 text-gray-300" /><h3 className="text-xl font-semibold mb-2">No scheduled interviews</h3><p className="text-gray-600">Schedule interviews for candidates from your applications</p></CardContent></Card>
      ) : (
        <div className="grid gap-6">
          {interviews.map((interview) => (
            <Card key={interview.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4"><div className="flex items-start gap-4"><div className="size-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center"><User className="size-7 text-white" /></div><div><h3 className="text-xl font-bold text-gray-900 mb-1">{interview.intervieweeName}</h3><div className="flex items-center gap-2 mb-2"><Badge className="capitalize">{interview.type}</Badge><Badge variant="outline" className="capitalize">{interview.difficulty}</Badge>{getStatusBadge(interview.dueDate)}</div></div></div></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                  <div><div className="text-sm text-gray-600 mb-1">Due Date</div><div className="font-semibold">{new Date(interview.dueDate).toLocaleDateString()}</div></div>
                  <div><div className="text-sm text-gray-600 mb-1">Duration</div><div className="font-semibold">{interview.duration} minutes</div></div>
                  <div><div className="text-sm text-gray-600 mb-1">Questions</div><div className="font-semibold">{interview.questionCount}</div></div>
                  <div><div className="text-sm text-gray-600 mb-1">Avatar</div><div className="font-semibold capitalize flex items-center gap-2"><span className="text-lg">{interview.avatarStyle === "professional" ? "👔" : interview.avatarStyle === "friendly" ? "😊" : "🧐"}</span>{interview.avatarStyle}</div></div>
                  <div><div className="text-sm text-gray-600 mb-1">Scheduled By</div><div className="font-semibold">{interview.scheduledByInterviewer}</div></div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"><h4 className="font-semibold text-gray-900 mb-2">Interview Settings (Locked)</h4><p className="text-sm text-gray-600">The candidate cannot modify these settings. They must complete a <strong className="capitalize">{interview.difficulty}</strong> level {interview.type} interview with {interview.duration} minutes, {interview.questionCount} questions, and a {interview.avatarStyle} avatar personality by {new Date(interview.dueDate).toLocaleDateString()}.</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { TrendingUp, Target, BarChart as BarChartIcon, Clock, BarChart3 } from "lucide-react";
import { interviewService } from "../../services/interviewService";
import type { InterviewSessionDto } from "../../services/interviewService";
import { Link } from "react-router-dom";

export default function AnalyticsPage() {
  const [allSessions, setAllSessions] = useState<InterviewSessionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewService.getUserSessions()
      .then((data) => {
        const sessionsArray = Array.isArray(data) ? data : [];
        setAllSessions(sessionsArray);
      })
      .catch((error) => {
        console.error("Failed to load sessions:", error);
        setAllSessions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Only completed sessions with valid overall score
  const completedSessions = useMemo(() => {
    return allSessions.filter(s => s.status === "COMPLETED" && s.overallScore != null);
  }, [allSessions]);

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  if (completedSessions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your progress and improvement over time</p>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <BarChart3 className="size-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No analytics data yet</h3>
            <p className="text-gray-600 mb-6">Complete an interview to see your performance analytics</p>
            <Link to="/interviewee/interview/setup">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">
                Start Your First Interview
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Data for line chart (chronological order)
  const scoreByDate = [...completedSessions]
    .sort((a, b) => new Date(a.completedAt || a.createdAt).getTime() - new Date(b.completedAt || b.createdAt).getTime())
    .map(s => ({
      date: new Date(s.completedAt || s.createdAt).toLocaleDateString(),
      score: s.overallScore || 0,
      communication: s.communicationScore || 0,
      technical: s.technicalScore || 0,
      confidence: s.confidenceScore || 0,
    }));

  // Average score per interview type
  const scoreByType = Object.values(completedSessions.reduce((acc, s) => {
    if (!acc[s.type]) acc[s.type] = { type: s.type, total: 0, count: 0 };
    acc[s.type].total += s.overallScore || 0;
    acc[s.type].count += 1;
    return acc;
  }, {} as Record<string, { type: string; total: number; count: number }>)).map(v => ({
    type: v.type,
    avgScore: Math.round(v.total / v.count)
  }));

  // Radar chart data – only from actual scores (no fake "Problem Solving" or "Leadership")
  const skillsData = [
    { skill: "Communication", score: Math.round(completedSessions.reduce((a, s) => a + (s.communicationScore || 0), 0) / completedSessions.length) || 0 },
    { skill: "Technical", score: Math.round(completedSessions.reduce((a, s) => a + (s.technicalScore || 0), 0) / completedSessions.length) || 0 },
    { skill: "Confidence", score: Math.round(completedSessions.reduce((a, s) => a + (s.confidenceScore || 0), 0) / completedSessions.length) || 0 },
  ];

  // Summary stats
  const avgScore = Math.round(completedSessions.reduce((a, s) => a + (s.overallScore || 0), 0) / completedSessions.length);
  const totalInterviews = completedSessions.length;
  const totalMinutes = completedSessions.reduce((a, s) => a + s.duration, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const avgDuration = Math.round(totalMinutes / totalInterviews);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your progress and improvement over time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <TrendingUp className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{avgScore}%</div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Target className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalInterviews}</div>
                <div className="text-sm text-gray-600">Completed Interviews</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <Clock className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalHours}h</div>
                <div className="text-sm text-gray-600">Total Practice</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <BarChartIcon className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{avgDuration}m</div>
                <div className="text-sm text-gray-600">Avg Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Score Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} name="Overall Score" />
              <Line type="monotone" dataKey="communication" stroke="#10b981" strokeWidth={2} name="Communication" />
              <Line type="monotone" dataKey="technical" stroke="#8b5cf6" strokeWidth={2} name="Technical" />
              <Line type="monotone" dataKey="confidence" stroke="#f59e0b" strokeWidth={2} name="Confidence" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Performance by Interview Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#6366f1" name="Average Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Skills Proficiency Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skillsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Skill Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skillsData.map((skill) => (
              <div key={skill.skill}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                  <Badge className={skill.score >= 75 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                    {skill.score}%
                  </Badge>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${skill.score >= 75 ? "bg-green-600" : "bg-amber-600"}`}
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
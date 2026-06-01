import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Eye, TrendingUp, Clock, MessageSquare } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { interviewService } from "../../services/interviewService";
import type { InterviewSessionDto } from "../../services/interviewService";
import { toast } from "react-toastify";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<InterviewSessionDto[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await interviewService.getUserSessions();
        const sessionsArray = Array.isArray(data) ? data : [];
        setSessions(sessionsArray);
      } catch (error) {
        console.error("Failed to load history", error);
        toast.error("Failed to load history");
        setSessions([]);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    let result = sessions;
    if (filterType !== "all") {
      result = result.filter(s => s.type === filterType);
    }
    if (search) {
      result = result.filter(s =>
        s.type.toLowerCase().includes(search.toLowerCase()) ||
        s.difficulty.toLowerCase().includes(search.toLowerCase())
      );
    }
    // Sort by date descending (latest first)
    return [...result].sort((a, b) =>
      new Date(b.completedAt || b.createdAt).getTime() -
      new Date(a.completedAt || a.createdAt).getTime()
    );
  }, [sessions, filterType, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(0);
  };

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(0);
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentSessions = filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  const getScoreColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-700";
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 70) return "bg-blue-100 text-blue-700";
    if (score >= 60) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
        <p className="text-gray-600 mt-1">Review your past interview sessions</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by type or difficulty..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1"
            />
            <Select value={filterType} onValueChange={handleFilterTypeChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {currentSessions.map((session) => (
          <Card key={session.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className={`size-24 rounded-xl ${getScoreColor(session.overallScore)} border-2 flex items-center justify-center flex-shrink-0`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{session.overallScore ?? "—"}%</div>
                    <div className="text-xs">Overall</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className="capitalize">{session.type}</Badge>
                    <Badge variant="outline" className="capitalize">{session.difficulty}</Badge>
                    <Badge variant="secondary">{new Date(session.completedAt || session.createdAt).toLocaleDateString()}</Badge>
                    {session.scheduledInterviewId && <Badge className="bg-purple-100 text-purple-700">Scheduled</Badge>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Communication</div>
                        <div className="font-semibold">{session.communicationScore ?? "N/A"}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Technical</div>
                        <div className="font-semibold">{session.technicalScore ?? "N/A"}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="font-semibold">{session.duration} min</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-4" />
                      <div>
                        <div className="text-sm text-gray-600">Questions</div>
                        <div className="font-semibold">{session.questionCount}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/interviewee/interview/feedback/${session.id}`}>
                      <Button size="sm"><Eye className="mr-2 size-4" />View Feedback</Button>
                    </Link>
                    {session.scheduledInterviewId ? (
                      <Button size="sm" variant="outline" disabled className="opacity-50 cursor-not-allowed">
                          Retake Interview (Scheduled)
                      </Button>
                  ) : (
                      <Link to="/interviewee/interview/setup">
                          <Button size="sm" variant="outline">Retake Interview</Button>
                      </Link>
                  )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <MessageSquare className="size-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No interviews found</h3>
            <p className="text-gray-600 mb-6">Start practicing to see your history</p>
            <Link to="/interviewee/interview/setup"><Button>Start Your First Interview</Button></Link>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={!canPrevious}>
            Previous
          </Button>
          <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={!canNext}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
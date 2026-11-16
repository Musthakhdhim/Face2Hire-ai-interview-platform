import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Calendar, User, Clock, Search, Loader2, Eye, Video, Filter } from "lucide-react";
import {
    scheduledInterviewService,
    sortScheduledInterviewsByPriority,
    type ScheduledInterviewDto,
} from "../../services/scheduledInterviewService";
import { useRealtimeSubscription } from "../../hooks/useRealtimeSubscription";
import { toast } from "react-toastify";

export default function ScheduledInterviewsPage() {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<ScheduledInterviewDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "completed" | "expired">("all");
    const [modeFilter, setModeFilter] = useState<"all" | "AI" | "ZOOM">("all");
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 10;

    const fetchInterviews = useCallback(async (silent = false) => {
        try {
            const data = await scheduledInterviewService.getForInterviewer();
            setInterviews(sortScheduledInterviewsByPriority(Array.isArray(data) ? data : []));
        } catch {
            if (!silent) toast.error("Failed to load scheduled interviews");
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInterviews();
    }, [fetchInterviews]);

    useRealtimeSubscription(["/topic/interviewer/interviews"], () => {
        fetchInterviews(true);
    });

    const filtered = useMemo(() => {
        const now = Date.now();
        return sortScheduledInterviewsByPriority(interviews).filter((i) => {
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesName =
                    i.intervieweeName?.toLowerCase().includes(query) ||
                    (i.intervieweeId && i.intervieweeId.toString().includes(query));
                if (!matchesName) return false;
            }
            if (modeFilter !== "all") {
                const itemMode = i.interviewMode || "AI";
                if (itemMode !== modeFilter) return false;
            }
            if (statusFilter !== "all") {
                const targetDate = i.interviewMode === "ZOOM" && i.scheduledAt ? i.scheduledAt : i.dueDate;
                const isExpired = !i.completed && !i.callEnded && new Date(targetDate).getTime() < now;
                if (statusFilter === "upcoming" && (i.completed || isExpired)) return false;
                if (statusFilter === "completed" && !i.completed) return false;
                if (statusFilter === "expired" && !isExpired) return false;
            }
            return true;
        });
    }, [searchQuery, statusFilter, modeFilter, interviews]);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(0);
    };

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const currentInterviews = filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
    const canPrevious = currentPage > 0;
    const canNext = currentPage < totalPages - 1;

    const getStatusBadge = (interview: ScheduledInterviewDto) => {
        if (interview.completed) return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
        if (interview.callEnded) return <Badge className="bg-purple-100 text-purple-700">Evaluation Pending</Badge>;
        const targetDate = interview.interviewMode === "ZOOM" && interview.scheduledAt ? interview.scheduledAt : interview.dueDate;
        const isPast = new Date(targetDate) < new Date();
        return isPast ? <Badge className="bg-red-100 text-red-700">Expired</Badge> : <Badge className="bg-blue-100 text-blue-700">Upcoming</Badge>;
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Scheduled Interviews</h1>
                <p className="text-gray-600 mt-1">Upcoming interviews are prioritized first, ordered by scheduled/due date</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                placeholder="Search by candidate name..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={(val) => {
                                setStatusFilter(val as "all" | "upcoming" | "completed" | "expired");
                                setCurrentPage(0);
                            }}
                        >
                            <SelectTrigger className="w-full md:w-[210px]">
                                <Filter className="mr-2 size-4" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All (Upcoming First)</SelectItem>
                                <SelectItem value="upcoming">Upcoming Only</SelectItem>
                                <SelectItem value="completed">Completed Only</SelectItem>
                                <SelectItem value="expired">Expired Only</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={modeFilter}
                            onValueChange={(val) => {
                                setModeFilter(val as "all" | "AI" | "ZOOM");
                                setCurrentPage(0);
                            }}
                        >
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Modes</SelectItem>
                                <SelectItem value="AI">🤖 AI Interview</SelectItem>
                                <SelectItem value="ZOOM">🎥 Zoom Live</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {currentInterviews.length === 0 ? (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-12 text-center">
                        <Calendar className="size-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold mb-2">No scheduled interviews</h3>
                        <p className="text-gray-600">Schedule interviews from the applications page or use the Schedule Interview tab.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {currentInterviews.map((interview) => (
                        <Card key={interview.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="size-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                            <User className="size-7 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                <h3 className="text-xl font-bold text-gray-900">{interview.intervieweeName}</h3>
                                                <Badge className="capitalize">{interview.type}</Badge>
                                                <Badge variant="outline" className={interview.interviewMode === "ZOOM" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}>
                                                    {interview.interviewMode === "ZOOM" ? "🎥 Zoom Live" : "🤖 AI Interview"}
                                                </Badge>
                                                {getStatusBadge(interview)}
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-3 mb-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Clock className="size-4" />
                                                    <span className="text-sm">Duration: {interview.duration} min</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="size-4" />
                                                    <span className="text-sm">
                                                        {interview.interviewMode === "ZOOM" && interview.scheduledAt
                                                            ? `Scheduled: ${new Date(interview.scheduledAt).toLocaleString()}`
                                                            : `Due: ${new Date(interview.dueDate).toLocaleDateString()}`}
                                                    </span>
                                                </div>
                                                {interview.interviewMode === "ZOOM" ? (
                                                    <>
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Video className="size-4 text-blue-600" />
                                                            <span className="text-sm">Meeting ID: {interview.meetingId || "Auto"}</span>
                                                        </div>
                                                        {interview.meetingPasscode && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <span className="text-sm">Passcode: <span className="font-mono">{interview.meetingPasscode}</span></span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <div className="size-4" />
                                                            <span className="text-sm">Questions: {interview.questionCount}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <span className="text-lg">
                                                                {interview.avatarStyle === "professional" ? "👔" : interview.avatarStyle === "friendly" ? "😊" : "🧐"}
                                                            </span>
                                                            <span className="text-sm capitalize">Avatar: {interview.avatarStyle}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center gap-2 lg:w-48">
                                        {interview.interviewMode === "ZOOM" && !interview.completed && (
                                            <Button
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => navigate(`/live-interview/${interview.id}`)}
                                            >
                                                <Video className="mr-2 size-4" />
                                                {interview.callEnded ? "Rejoin Room" : "Start Live Interview"}
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => navigate(`/interviewer/scheduled/${interview.id}${interview.callEnded && !interview.completed ? "?evaluate=true" : ""}`)}
                                        >
                                            <Eye className="mr-2 size-4" />
                                            {interview.callEnded && !interview.completed ? "Evaluate Candidate" : "View Details"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <Button variant="outline" disabled={!canPrevious} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
                    <Button variant="outline" disabled={!canNext} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                </div>
            )}
        </div>
    );
}
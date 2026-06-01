import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Calendar, User, Clock, Search, Loader2, Eye } from "lucide-react";
import { scheduledInterviewService, type ScheduledInterviewDto } from "../../services/scheduledInterviewService";
import { toast } from "react-toastify";

export default function ScheduledInterviewsPage() {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<ScheduledInterviewDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await scheduledInterviewService.getForInterviewer();
                setInterviews(data);
            } catch {
                toast.error("Failed to load scheduled interviews");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) {
            return interviews;
        }
        const query = searchQuery.toLowerCase();
        return interviews.filter(
            (i) =>
                i.intervieweeName.toLowerCase().includes(query) ||
                (i.intervieweeId && i.intervieweeId.toString().includes(query))
        );
    }, [searchQuery, interviews]);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(0);
    };

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const currentInterviews = filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
    const canPrevious = currentPage > 0;
    const canNext = currentPage < totalPages - 1;

    const getStatusBadge = (dueDate: string, completed?: boolean) => {
        if (completed) return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
        const isPast = new Date(dueDate) < new Date();
        return isPast ? <Badge className="bg-red-100 text-red-700">Expired</Badge> : <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Scheduled Interviews</h1>
                <p className="text-gray-600 mt-1">View all interviews you've scheduled for candidates</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            placeholder="Search by candidate name..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                        />
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
                                            <div className="flex items-center gap-2 mb-3">
                                                <h3 className="text-xl font-bold text-gray-900">{interview.intervieweeName}</h3>
                                                <Badge className="capitalize">{interview.type}</Badge>
                                                {getStatusBadge(interview.dueDate, interview.completed)}
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-3 mb-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Clock className="size-4" />
                                                    <span className="text-sm">Duration: {interview.duration} min</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="size-4" />
                                                    <span className="text-sm">Due: {new Date(interview.dueDate).toLocaleDateString()}</span>
                                                </div>
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
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center lg:w-48">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => navigate(`/interviewer/scheduled/${interview.id}`)}
                                        >
                                            <Eye className="mr-2 size-4" /> View Details
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
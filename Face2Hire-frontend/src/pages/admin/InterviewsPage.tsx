import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search,  Loader2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { interviewService } from '../../services/interviewService';
import type { AdminInterviewResponse, AdminInterviewFilter, PaginatedResponse } from '../../types/admin';
import { Link } from 'react-router-dom';

export default function AdminInterviewsPage() {
    const [interviews, setInterviews] = useState<AdminInterviewResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;

    // Filters
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const fetchInterviews = useCallback(async () => {
        setLoading(true);
        try {
            const filter: AdminInterviewFilter = {
                search: search || undefined,
                type: typeFilter === 'all' ? undefined : typeFilter as any,
                status: statusFilter === 'all' ? undefined : statusFilter as any,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                page: currentPage,
                size: pageSize,
            };
            const data: PaginatedResponse<AdminInterviewResponse> = await interviewService.getAllInterviewsForAdmin(filter);
            setInterviews(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load interviews');
        } finally {
            setLoading(false);
        }
    }, [search, typeFilter, statusFilter, fromDate, toDate, currentPage]);

    useEffect(() => {
        fetchInterviews();
    }, [fetchInterviews]);

    const handleSearch = () => {
        setCurrentPage(0);
        fetchInterviews();
    };

    const resetFilters = () => {
        setSearch('');
        setTypeFilter('all');
        setStatusFilter('all');
        setFromDate('');
        setToDate('');
        setCurrentPage(0);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
            case 'ACTIVE': return <Badge className="bg-blue-100 text-blue-700">Active</Badge>;
            case 'ABANDONED': return <Badge className="bg-red-100 text-red-700">Abandoned</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const getScoreColor = (score?: number | null) => {
        if (!score) return 'text-gray-500';
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Interview Management</h1>
                <p className="text-gray-600 mt-1">View and filter all interviews across users</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="grid md:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                placeholder="User email or name"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger><SelectValue placeholder="Interview Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="hr">HR</SelectItem>
                                <SelectItem value="behavioral">Behavioral</SelectItem>
                                <SelectItem value="salary">Salary</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="ABANDONED">Abandoned</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input type="date" placeholder="From" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                        <Input type="date" placeholder="To" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleSearch} className="bg-indigo-600">Apply Filters</Button>
                        <Button variant="outline" onClick={resetFilters}>Reset</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle>All Interviews ({interviews.length})</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-indigo-600" /></div>
                    ) : interviews.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No interviews found</div>
                    ) : (
                        <div className="space-y-4">
                            {interviews.map((interview) => (
                                <Card key={interview.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex flex-wrap justify-between items-start gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-lg font-bold">{interview.userName || 'Unknown User'}</h3>
                                                    <Badge variant="outline">{interview.userEmail}</Badge>
                                                    {getStatusBadge(interview.status)}
                                                </div>
                                                <div className="flex gap-4 text-sm text-gray-600">
                                                    <span>Type: <strong className="capitalize">{interview.type}</strong></span>
                                                    <span>Difficulty: <strong className="capitalize">{interview.difficulty}</strong></span>
                                                    <span>Duration: <strong>{interview.duration} min</strong></span>
                                                    <span>Questions: <strong>{interview.questionCount}</strong></span>
                                                </div>
                                                <div className="flex gap-4 text-sm">
                                                    <span className={getScoreColor(interview.overallScore)}>Overall: {interview.overallScore ?? 'N/A'}%</span>
                                                    <span>Communication: {interview.communicationScore ?? 'N/A'}%</span>
                                                    <span>Technical: {interview.technicalScore ?? 'N/A'}%</span>
                                                    <span>Confidence: {interview.confidenceScore ?? 'N/A'}%</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Started: {new Date(interview.startedAt).toLocaleString()}
                                                    {interview.completedAt && ` | Completed: ${new Date(interview.completedAt).toLocaleString()}`}
                                                </div>
                                            </div>
                                            <Link to={`/admin/interviews/${interview.id}`}>
                                                <Button size="sm" variant="outline"><Eye className="size-4 mr-1" /> View Details</Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 py-4">
                    <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                </div>
            )}
        </div>
    );
}
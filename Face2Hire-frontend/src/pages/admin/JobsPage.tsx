import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, Briefcase, MapPin, DollarSign, Calendar, Loader2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { jobService } from '../../services/jobService';
import type { AdminJobResponse, AdminJobFilter, PaginatedResponse, JobType, JobStatus } from '../../types/admin';
import { Link } from 'react-router-dom';

export default function AdminJobsPage() {
    const [jobs, setJobs] = useState<AdminJobResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const filter: AdminJobFilter = {
                    search: search || undefined,
                    type: typeFilter === 'all' ? undefined : typeFilter as JobType,
                    status: statusFilter === 'all' ? undefined : statusFilter as JobStatus,
                    fromDate: fromDate || undefined,
                    toDate: toDate || undefined,
                    page: currentPage,
                    size: pageSize,
                };
                const data: PaginatedResponse<AdminJobResponse> = await jobService.getAllJobsForAdmin(filter);
                setJobs(data.content);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load jobs');
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [search, typeFilter, statusFilter, fromDate, toDate, currentPage, pageSize]);

    const handleSearch = () => {
        setCurrentPage(0);
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
        if (status === 'ACTIVE') return <Badge className="bg-green-100 text-green-700">Active</Badge>;
        return <Badge className="bg-red-100 text-red-700">Closed</Badge>;
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
                <p className="text-gray-600 mt-1">View and manage all job postings across the platform</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="grid md:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                placeholder="Title or company"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger><SelectValue placeholder="Job Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="FULL_TIME">Full-time</SelectItem>
                                <SelectItem value="PART_TIME">Part-time</SelectItem>
                                <SelectItem value="CONTRACT">Contract</SelectItem>
                                <SelectItem value="INTERNSHIP">Internship</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
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
                <CardHeader><CardTitle>All Jobs ({jobs.length})</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-indigo-600" /></div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No jobs found</div>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map((job) => (
                                <Card key={job.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex flex-wrap justify-between items-start gap-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-lg font-bold">{job.title}</h3>
                                                    {getStatusBadge(job.status)}
                                                    <Badge variant="outline" className="capitalize">
                                                        {job.type.toLowerCase().replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-gray-600">{job.company}</div>
                                                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                                    {job.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{job.location}</span>}
                                                    {job.salary && <span className="flex items-center gap-1"><DollarSign className="size-3" />{job.salary}</span>}
                                                    <span className="flex items-center gap-1"><Briefcase className="size-3" />Exp: {job.requiredExperience ?? 0} yrs</span>
                                                    <span className="flex items-center gap-1"><Calendar className="size-3" />Posted: {formatDate(job.createdAt)}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {job.skills.slice(0, 5).map((skill, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                                                    ))}
                                                    {job.skills.length > 5 && <span className="text-xs text-gray-500">+{job.skills.length - 5}</span>}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Posted by: <strong>{job.postedByUserName || job.postedByUserEmail}</strong> | 
                                                    Applicants: {job.applicantsCount}
                                                </div>
                                            </div>
                                            <Link to={`/admin/jobs/${job.id}`}>
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
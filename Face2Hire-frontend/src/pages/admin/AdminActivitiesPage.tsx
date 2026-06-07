import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { activityService } from '../../services/userService';
import type { ActivityLog, ActivityAction, ActivityFilter, PaginatedResponse } from '../../types/admin';

export default function AdminActivitiesPage() {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;

    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');

    // Fetch activities whenever filters or page change
    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            try {
                const filter: ActivityFilter = {
                    search: search || undefined,
                    action: actionFilter === 'all' ? undefined : actionFilter as ActivityAction,
                    page: currentPage,
                    size: pageSize,
                };
                const data: PaginatedResponse<ActivityLog> = await activityService.getList(filter);
                setActivities(data.content);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load activities');
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [search, actionFilter, currentPage, pageSize]);

    const handleSearch = () => {
        setCurrentPage(0);
        // The useEffect will trigger because currentPage becomes 0
    };

    const resetFilters = () => {
        setSearch('');
        setActionFilter('all');
        setCurrentPage(0);
    };

    const actionsList: ActivityAction[] = [
        'REGISTER', 'LOGIN', 'PROFILE_UPDATED', 'RESUME_UPLOADED',
        'JOB_APPLIED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED',
        'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'INTERVIEW_ATTENDED',
        'PASSWORD_CHANGED', 'EMAIL_UPDATED'
    ];

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
                <p className="text-gray-600 mt-1">View all user actions across the platform</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                placeholder="Search by user or description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-full md:w-[220px]">
                                <SelectValue placeholder="Filter by action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                {actionsList.map(action => (
                                    <SelectItem key={action} value={action}>
                                        {action.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleSearch} className="bg-indigo-600">Apply Filters</Button>
                        <Button variant="outline" onClick={resetFilters}>Reset</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle>All Activities ({activities.length})</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-indigo-600" /></div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No activities found</div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map(act => (
                                <div key={act.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex flex-wrap justify-between items-start gap-2">
                                        <div>
                                            <div className="font-semibold">{act.userName}</div>
                                            <div className="text-sm text-gray-500">{act.userEmail}</div>
                                            <div className="text-sm mt-1">{act.description}</div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className="mb-1">{act.action}</Badge>
                                            <div className="text-xs text-gray-500">{formatDate(act.createdAt)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 py-4">
                    <Button variant="outline" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
                    <Button variant="outline" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                </div>
            )}
        </div>
    );
}
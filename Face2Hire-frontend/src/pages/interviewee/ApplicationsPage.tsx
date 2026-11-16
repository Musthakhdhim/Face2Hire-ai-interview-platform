import { useEffect, useState, useCallback, useMemo, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Clock, Briefcase, Calendar, Filter } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  applicationService,
  sortApplicationsByPriority,
  type ApplicationListResponse,
} from '../../services/applicationService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

export default function IntervieweeApplicationsPage(): JSX.Element {
  const user = useSelector((state: RootState) => state.auth.user);
  const [applications, setApplications] = useState<ApplicationListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await applicationService.getMyApplications(page, pageSize);
      setApplications(sortApplicationsByPriority(data.content));
      setTotalPages(data.totalPages);
    } catch (error: unknown) {
      if (!silent) {
        const message = error instanceof AxiosError && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to load applications';
        toast.error(message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useRealtimeSubscription(
    [user?.id ? `/topic/user/${user.id}/applications` : null],
    () => {
      fetchApplications(true);
    }
  );

  const displayedApplications = useMemo(() => {
    return sortApplicationsByPriority(applications).filter((app) => {
      if (statusFilter === 'upcoming') return app.status === 'PENDING';
      if (statusFilter === 'completed') return app.status === 'APPROVED' || app.status === 'REJECTED';
      return true;
    });
  }, [applications, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="size-3 mr-1" /> Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="size-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="size-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">Upcoming & active applications are prioritized first by interview date</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'upcoming' | 'completed')}>
            <SelectTrigger className="w-[210px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All (Upcoming First)</SelectItem>
              <SelectItem value="upcoming">Pending / Upcoming</SelectItem>
              <SelectItem value="completed">Completed Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">Loading...</div>
      ) : displayedApplications.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Briefcase className="size-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600 mb-4">Start applying to jobs and they'll appear here</p>
            <Link to="/interviewee/jobs">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedApplications.map((app, idx) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-semibold text-gray-900">{app.jobTitle}</h3>
                        {getStatusBadge(app.status)}
                        {app.upcomingInterview && (
                          <Badge className="bg-blue-100 text-blue-700">Upcoming Interview</Badge>
                        )}
                        {app.interviewMode && (
                          <Badge variant="outline" className={app.interviewMode === 'ZOOM' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}>
                            {app.interviewMode === 'ZOOM' ? '🎥 Zoom Live' : '🤖 AI Interview'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>Score: <span className="font-medium">{app.score || 'N/A'}</span></span>
                        {app.interviewMode === 'ZOOM' && app.scheduledAt && (
                          <span className="flex items-center gap-1 text-blue-700 font-medium">
                            <Calendar className="size-3.5" />
                            Scheduled: {new Date(app.scheduledAt).toLocaleString()}
                          </span>
                        )}
                        {app.interviewMode !== 'ZOOM' && app.dueDate && (
                          <span className="flex items-center gap-1 text-indigo-700 font-medium">
                            <Calendar className="size-3.5" />
                            Due: {new Date(app.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link to={`/interviewee/applications/${app.id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
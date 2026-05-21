import { useEffect, useState, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Clock, Briefcase } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { applicationService, type ApplicationListResponse } from '../../services/applicationService';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

export default function IntervieweeApplicationsPage(): JSX.Element {
  const [applications, setApplications] = useState<ApplicationListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const data = await applicationService.getMyApplications(page, pageSize);
        setApplications(data.content);
        setTotalPages(data.totalPages);
      } catch (error: unknown) {
        const message = error instanceof AxiosError && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to load applications';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [page]);

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-600 mt-1">Track your job applications</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">Loading...</div>
      ) : applications.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Briefcase className="size-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-4">Start applying to jobs and they'll appear here</p>
            <Link to="/interviewee/jobs">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app, idx) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{app.jobTitle}</h3>
                        {getStatusBadge(app.status)}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Score: {app.score || 'N/A'}</span>
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
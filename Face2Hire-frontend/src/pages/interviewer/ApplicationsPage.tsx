import { useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Clock, Filter, Loader2, User, Mail, Download } from 'lucide-react'; 
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { applicationService, type ApplicationListResponse } from '../../services/applicationService';
import { jobService, type JobListResponse } from '../../services/jobService';
import { toast } from 'react-toastify';
import { resumeService } from '../../services/resumeService';   

interface ErrorWithResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as ErrorWithResponse;
    if (err.response?.data?.message) return err.response.data.message;
  }
  return 'An error occurred';
};

export default function InterviewerApplicationsPage(): JSX.Element {
  const navigate = useNavigate();   
  const [applications, setApplications] = useState<ApplicationListResponse[]>([]);
  const [jobs, setJobs] = useState<JobListResponse[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const handleDownloadResume = async (userId: number) => {
    try {
      const url = await resumeService.getResumeDownloadUrlForUser(userId);
      window.open(url, '_blank');
    } catch  {
      toast.error('Failed to download resume');
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobService.getMyJobs(0, 100);
        setJobs(data.content);
      } catch {
        console.log("failed to fetch jobs");
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        let data;
        if (selectedJobId && selectedJobId !== 'all') {
          data = await applicationService.getApplicationsForJob(Number(selectedJobId), page, pageSize);
        } else {
          data = await applicationService.getApplicationsForInterviewer(page, pageSize);
        }
        setApplications(data.content);
        setTotalPages(data.totalPages);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error) || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [selectedJobId, page]);


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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Applications Received</h1>
        <p className="text-gray-600 mt-1">Review and manage candidate applications</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Filter className="size-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by job:</span>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="All jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All jobs</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={String(job.id)}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-indigo-600" /></div>
      ) : applications.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center text-gray-500">No applications found</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((app, idx) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{app.jobTitle}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><User className="size-4" />{app.userName}</span>
                            <span className="flex items-center gap-1"><Mail className="size-4" />{app.userEmail}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadResume(app.userId)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <Download className="size-4" /> CV
                            </Button>
                          </div>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                      <div className="text-sm text-gray-500">Applied: {new Date(app.appliedAt).toLocaleString()}</div>
                      <div className="mt-2 text-sm">Score: {app.score || 'Not yet'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        {app.hasScheduledInterview ? (
                            <Button 
                                variant="outline" 
                                onClick={() => navigate(`/interviewer/applications/${app.id}/status`)}
                            >
                                View Status
                            </Button>
                        ) : (
                            app.status === 'PENDING' && (
                                <Button 
                                    variant="outline" 
                                    onClick={() => navigate(`/interviewer/schedule?intervieweeId=${app.userId}&candidateName=${encodeURIComponent(app.userName)}&applicationId=${app.id}`)}
                                >
                                    Schedule Interview
                                </Button>
                            )
                        )}
                    </div>
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
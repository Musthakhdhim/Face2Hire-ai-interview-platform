import { useState, useEffect, useCallback, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Briefcase, Plus, Search, MapPin, DollarSign, Loader2, Eye, Trash2, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-toastify';
import { jobService, type JobListResponse } from '../../services/jobService';

type JobTypeFilter = 'all' | 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

export default function InterviewerJobsPage(): JSX.Element {
  const [jobs, setJobs] = useState<JobListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<JobTypeFilter>('all');
  const [currentPage, setCurrentPage] = useState(0); 
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobService.getMyJobs(currentPage, pageSize, 'createdAt', 'desc');
      setJobs(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobs();
  }, [fetchJobs, currentPage]);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = searchQuery === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (jobId: number) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await jobService.deleteJob(jobId);
        toast.success('Job deleted');
        fetchJobs(); // refresh list
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete job');
      }
    }
  };

  const handleClose = async (jobId: number) => {
    try {
      await jobService.closeJob(jobId);
      toast.success('Job closed');
      fetchJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to close job');
    }
  };

  const currentJobs = filteredJobs; 

  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  const goToPage = (page: number) => setCurrentPage(page);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Job Postings</h1>
          <p className="text-gray-600 mt-1">Manage and view your job listings</p>
        </div>
        <Link to="/interviewer/jobs/create">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 size-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search by title, company, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as JobTypeFilter)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="FULL_TIME">Full-time</SelectItem>
                <SelectItem value="PART_TIME">Part-time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INTERNSHIP">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Job Postings ({totalElements})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-indigo-600" />
            </div>
          ) : currentJobs.length === 0 ? (
            <div className="text-center py-12">
              <Search className="size-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {currentJobs.map((job) => (
                <Card key={job.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="size-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="size-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                            <p className="text-gray-600 font-medium">{job.company}</p>
                          </div>
                          <Badge className="capitalize">
                            {job.type.toLowerCase().replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="size-4" />
                            {job.location || 'Remote'}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="size-4" />
                            {job.salary || 'Not specified'}
                          </div>
                          <Badge variant="secondary">{job.applicantsCount} applicants</Badge>
                          {job.status === 'CLOSED' && (
                            <Badge variant="destructive">Closed</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/interviewer/jobs/${job.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="mr-2 size-4" />
                              View
                            </Button>
                          </Link>
                          {job.status === 'ACTIVE' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClose(job.id)}
                              >
                                <XCircle className="mr-2 size-4" />
                                Close
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(job.id)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={!canPrevious}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={!canNext}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
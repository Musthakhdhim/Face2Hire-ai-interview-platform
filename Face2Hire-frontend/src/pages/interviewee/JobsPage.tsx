import { useState, useEffect, useCallback, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, MapPin, DollarSign, Clock, AlertCircle, CheckCircle2, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'react-toastify';
import { jobService, type JobListResponse } from '../../services/jobService';
import { resumeService } from '../../services/resumeService';
import { applicationService, type ApplicationListResponse } from '../../services/applicationService';

type JobTypeFilter = 'all' | 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

interface ParsedResumeSkill {
  name: string;
}

interface ParsedResumeExperience {
  startDate?: string;
  endDate?: string;
}

interface ParsedResume {
  skills?: ParsedResumeSkill[];
  experiences?: ParsedResumeExperience[];
}

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

export default function JobsPage(): JSX.Element {
  const [jobs, setJobs] = useState<JobListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<JobTypeFilter>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasCV, setHasCV] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userExperience, setUserExperience] = useState(0);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const pageSize = 10;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [resume, applicationsData] = await Promise.all([
          resumeService.getActiveResume(),
          applicationService.getMyApplications(0, 100)
        ]);

        if (resume && resume.status === 'COMPLETED') {
          setHasCV(true);
          if (resume.parsedContent) {
            try {
              const parsed = JSON.parse(resume.parsedContent) as ParsedResume;
              setUserSkills(parsed.skills?.map(s => s.name) || []);
              const totalExp = parsed.experiences?.reduce((sum, exp) => {
                if (exp.startDate && exp.endDate) {
                  const years = new Date(exp.endDate).getFullYear() - new Date(exp.startDate).getFullYear();
                  return sum + years;
                }
                return sum;
              }, 0) || 0;
              setUserExperience(totalExp);
            } catch {
              // ignore JSON parse error
            }
          }
        }

        const appliedIds = new Set<number>();
        if (applicationsData && applicationsData.content) {
          applicationsData.content.forEach((app: ApplicationListResponse) => {
            appliedIds.add(app.jobId);
          });
        }
        setAppliedJobIds(appliedIds);
      } catch (error) {
        console.error('Failed to fetch applications', error);
      }
    };
    fetchUserData();
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobService.getAllActiveJobs(currentPage, pageSize, searchQuery || undefined, 'createdAt', 'desc');
      setJobs(data.content);
      setTotalPages(data.totalPages);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobs();
  }, [fetchJobs, currentPage, searchQuery]);

  const filteredJobs = filterType === 'all'
    ? jobs
    : jobs.filter(job => job.type === filterType);

  const checkEligibility = (job: JobListResponse) => {
    if (appliedJobIds.has(job.id)) {
      return { eligible: false, reason: 'Already applied for this role' };
    }
    if (!hasCV) {
      return { eligible: false, reason: 'Please upload your CV first' };
    }
    const requiredExp = job.requiredExperience || 0;
    if (userExperience < requiredExp) {
      return { eligible: false, reason: `Experience requirement: ${requiredExp} years` };
    }
    const requiredSkills = job.skills;
    const hasAllSkills = requiredSkills.every(skill =>
      userSkills.some(us => us.toLowerCase() === skill.toLowerCase())
    );
    if (!hasAllSkills) {
      return { eligible: false, reason: 'Missing required skills' };
    }
    return { eligible: true, reason: '' };
  };

  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
        <p className="text-gray-600 mt-1">Find your next opportunity</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterType} onValueChange={(val) => setFilterType(val as JobTypeFilter)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="Job Type" />
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

      {!hasCV && (
        <Card className="border-amber-500 border-2 bg-amber-50">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertCircle className="size-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Upload Your CV to Apply</h3>
              <p className="text-sm text-gray-600 mb-3">You need to upload your CV before you can apply for jobs.</p>
              <Link to="/interviewee/upload-cv">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">Upload CV Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {hasCV && (
        <Card className="border-blue-500 border-2 bg-blue-50">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertCircle className="size-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Application Process</h3>
              <p className="text-sm text-gray-600">
                After applying, the interviewer will schedule an interview for you. You must pass the interview with the
                minimum required score for your application to be approved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Briefcase className="size-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredJobs.map((job, index) => {
            const eligibility = checkEligibility(job);
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${!eligibility.eligible ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="size-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="size-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                            <p className="text-gray-600 font-medium">{job.company}</p>
                          </div>
                          <Badge className="capitalize">{job.type.toLowerCase().replace('_', ' ')}</Badge>
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
                          <div className="flex items-center gap-1">
                            <Clock className="size-4" />
                            Posted {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            <div>Required Score: <span className="font-semibold">{job.matchPercentage || 'N/A'}%</span></div>
                            <div>Required Experience: <span className="font-semibold">{job.requiredExperience || 0} years</span></div>
                          </div>
                          <div className="flex items-center gap-3">
                            {eligibility.eligible ? (
                              <>
                                <div className="flex items-center gap-2 text-green-600 text-sm">
                                  <CheckCircle2 className="size-4" />
                                  <span className="font-medium">Eligible</span>
                                </div>
                                <Link to={`/interviewee/jobs/${job.id}/apply`}>
                                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                                    Apply Now
                                  </Button>
                                </Link>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 text-red-600 text-sm">
                                  <AlertCircle className="size-4" />
                                  <span className="font-medium">{eligibility.reason}</span>
                                </div>
                                <Button disabled className="cursor-not-allowed opacity-50">Apply Now</Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={!canPrevious}>
            Previous
          </Button>
          <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={!canNext}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
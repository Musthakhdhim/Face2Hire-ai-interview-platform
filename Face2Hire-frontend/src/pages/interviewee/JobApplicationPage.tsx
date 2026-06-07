import { useEffect, useState, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, FileText, Award, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { toast } from 'react-toastify';
import { jobService, type JobResponse } from '../../services/jobService';
import { applicationService } from '../../services/applicationService';
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

interface ParsedResumeSkill {
  name: string;
}

interface ParsedResume {
  skills?: ParsedResumeSkill[];
}

export default function JobApplicationPage(): JSX.Element {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user: _user } = useSelector((state: RootState) => state.auth);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [avgScore, setAvgScore] = useState(0);
  const [interviewsTaken, setInterviewsTaken] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!jobId) {
        navigate('/interviewee/jobs');
        return;
      }
      try {
        const [jobData, resumeData] = await Promise.all([
          jobService.getJobById(Number(jobId)),
          resumeService.getActiveResume(),
        ]);
        setJob(jobData);

        if (resumeData && resumeData.status === 'COMPLETED') {
          if (resumeData.parsedContent) {
            try {
              const parsed = JSON.parse(resumeData.parsedContent) as ParsedResume;
              setSkills(parsed.skills?.map(s => s.name) || []);
            } catch {
              console.log("parsing error");
              
            }
          }
        }
        setAvgScore(0);
        setInterviewsTaken(0);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error) || 'Failed to load data');
        navigate('/interviewee/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId, navigate]);

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      toast.error('Please write a cover letter');
      return;
    }
    setSubmitting(true);
    try {
      await applicationService.apply({
        jobId: Number(jobId),
        coverLetter: coverLetter.trim(),
      });
      toast.success('Application submitted successfully!');
      navigate('/interviewee');
    } catch (error: unknown) {
      const msg = getErrorMessage(error) || 'Application failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!job) {
    return <div className="text-center py-12">Job not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" onClick={() => navigate('/interviewee/jobs')}>
          ← Back to Jobs
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Apply for Position</h1>
        <p className="text-gray-600">Complete your application below</p>
      </motion.div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Briefcase className="size-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
              <p className="text-gray-600 font-medium">{job.company}</p>
              <div className="flex gap-2 mt-2">
                <Badge>{job.type.toLowerCase().replace('_', ' ')}</Badge>
                <Badge variant="outline">{job.location || 'Remote'}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-600">CV Document</Label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
              <FileText className="size-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Your CV</div>
                <div className="text-sm text-gray-500">Uploaded and verified</div>
              </div>
              <Badge className="ml-auto bg-green-100 text-green-700">
                <CheckCircle2 className="size-3 mr-1" /> Verified
              </Badge>
            </div>
          </div>

          <div>
            <Label className="text-gray-600">Interview Score</Label>
            <div className="mt-2 p-4 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center gap-3">
              <Award className="size-5 text-indigo-600" />
              <div>
                <div className="font-medium text-gray-900">Average Score: {avgScore}%</div>
                <div className="text-sm text-gray-500">Based on {interviewsTaken} interviews</div>
              </div>
              <Badge className="ml-auto bg-indigo-100 text-indigo-700">
                <CheckCircle2 className="size-3 mr-1" /> Verified
              </Badge>
            </div>
          </div>

          <div>
            <Label className="text-gray-600">Skills</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <Badge key={idx} variant="outline">{skill}</Badge>
              ))}
              {skills.length === 0 && <span className="text-sm text-gray-500">No skills detected</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Cover Letter</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Tell the employer why you're a great fit for this position..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={8}
            className="resize-none"
          />
          <p className="text-sm text-gray-500 mt-2">{coverLetter.length} / 500 characters</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Ready to submit?</h3>
              <p className="text-sm text-gray-600">Your application will be sent to {job.company}</p>
            </div>
            <Button
              onClick={handleApply}
              size="lg"
              disabled={submitting}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, Plus, X, Trash2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-toastify';
import { jobService, type JobRequest } from '../../services/jobService';

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

export default function JobDetailPage(): JSX.Element {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [originalStatus, setOriginalStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'FULL_TIME' as JobType,
    salary: '',
    requiredExperience: 0,
    description: '',
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        const job = await jobService.getJobById(Number(jobId));
        setFormData({
          title: job.title,
          company: job.company,
          location: job.location || '',
          type: job.type,
          salary: job.salary || '',
          requiredExperience: job.requiredExperience || 0,
          description: job.description || '',
        });
        setSkills(job.skills || []);
        setOriginalStatus(job.status);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load job');
        navigate('/interviewer/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, navigate]);

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company || skills.length === 0) {
      toast.error('Please fill in all required fields (title, company, at least one skill)');
      return;
    }
    setSubmitting(true);
    try {
      const payload: JobRequest = {
        title: formData.title,
        company: formData.company,
        location: formData.location || undefined,
        type: formData.type,
        salary: formData.salary || undefined,
        requiredExperience: formData.requiredExperience,
        description: formData.description,
        skills,
      };
      await jobService.updateJob(Number(jobId), payload);
      toast.success('Job updated successfully');
      navigate('/interviewer/jobs');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        await jobService.deleteJob(Number(jobId));
        toast.success('Job deleted');
        navigate('/interviewer/jobs');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete job');
      }
    }
  };

  const handleClose = async () => {
    if (window.confirm('Are you sure you want to close this job? It will no longer be visible to applicants.')) {
      try {
        await jobService.closeJob(Number(jobId));
        toast.success('Job closed');
        navigate('/interviewer/jobs');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to close job');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/interviewer/jobs')}>
            ← Back to My Jobs
          </Button>
          {originalStatus === 'ACTIVE' && (
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 size-4" /> Delete Job
              </Button>
              <Button variant="outline" onClick={handleClose}>
                <XCircle className="mr-2 size-4" /> Close Job
              </Button>
            </div>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Edit Job Posting</h1>
        <p className="text-gray-600">Update job details and requirements</p>
      </motion.div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type">Job Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData({ ...formData, type: val as JobType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full-time</SelectItem>
                    <SelectItem value="PART_TIME">Part-time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salary">Salary Range</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="experience">Minimum Experience (years)</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.requiredExperience}
                onChange={(e) => setFormData({ ...formData, requiredExperience: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="skills">Required Skills *</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="skills"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Type skill and press Enter"
                />
                <Button type="button" onClick={handleAddSkill}>
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="pl-3 pr-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {skills.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Add at least one required skill</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Save changes</h3>
                <p className="text-sm text-gray-600">Update your job posting</p>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                {submitting ? 'Saving...' : <><Briefcase className="mr-2 size-5" /> Update Job</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
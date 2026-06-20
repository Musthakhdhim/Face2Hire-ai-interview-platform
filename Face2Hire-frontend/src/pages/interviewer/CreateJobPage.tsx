import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, Plus, X, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-toastify';
import { jobService, type JobRequest } from '../../services/jobService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

interface StageConfigDto {
    stageType: string;
    order: number;
    minimumScore: number;
    duration: number;
    questionCount: number;
    required: boolean;
    description: string;
}

export default function CreateJobPage(): JSX.Element {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'FULL_TIME' as JobType,
    salary: '',
    requiredExperience: 1,
    description: '',
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enableMultiRound, setEnableMultiRound] = useState(false);
  const [stages, setStages] = useState<StageConfigDto[]>([
    { stageType: 'TECHNICAL', order: 1, minimumScore: 70, duration: 45, questionCount: 10, required: true, description: 'Technical skills assessment' },
    { stageType: 'HR', order: 2, minimumScore: 65, duration: 30, questionCount: 8, required: true, description: 'Cultural fit and soft skills' },
    { stageType: 'BEHAVIORAL', order: 3, minimumScore: 70, duration: 30, questionCount: 8, required: true, description: 'Behavioral assessment' },
    { stageType: 'SALARY', order: 4, minimumScore: 60, duration: 20, questionCount: 5, required: false, description: 'Compensation discussion' },
  ]);

  const stageTypeOptions = ['TECHNICAL', 'HR', 'BEHAVIORAL', 'SALARY'];

  const handleAddStage = () => {
    const newStage: StageConfigDto = {
        stageType: 'BEHAVIORAL',
        order: stages.length + 1,
        minimumScore: 70,
        duration: 30,
        questionCount: 8,
        required: true,
        description: '',
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 1) {
        toast.error('At least one stage is required');
        return;
    }
    const newStages = stages.filter((_, i) => i !== index);
    const updatedStages = newStages.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(updatedStages);
  };

  const handleStageChange = (index: number, field: keyof StageConfigDto, value: any) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: value };
    setStages(updated);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const updatedStages = items.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(updatedStages);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
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
        hasMultiRound: enableMultiRound,
        workflowConfig: enableMultiRound ? { stages, enabled: true } : null,
      };
      await jobService.createJob(payload);
      toast.success('Job posted successfully!');
      navigate('/interviewer/jobs');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button variant="ghost" onClick={() => navigate('/interviewer')}>
          ← Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Post New Job</h1>
        <p className="text-gray-600">Create a new job listing with specific requirements</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="e.g. Senior Frontend Developer"
                />
              </div>
              <div>
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. TechCorp Inc."
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
                  placeholder="e.g. Remote or City"
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
                  placeholder="e.g. $100k - $130k"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role, responsibilities, and what you're looking for..."
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
            <div className="grid md:grid-cols-1 gap-4">
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

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Interview Workflow Configuration</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="multiRound" className="text-sm font-medium">
                  Enable Multi-Round
                </Label>
                <input
                  type="checkbox"
                  id="multiRound"
                  checked={enableMultiRound}
                  onChange={(e) => setEnableMultiRound(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {enableMultiRound ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Configure the interview rounds for this job. Candidates will progress through each round sequentially.
                </p>
                
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="stages">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {stages.map((stage, index) => (
                          <Draggable key={stage.order} draggableId={String(stage.order)} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50 hover:border-indigo-300 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div {...provided.dragHandleProps} className="cursor-move">
                                    <GripVertical className="size-5 text-gray-400" />
                                  </div>
                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                                    <div>
                                      <Label className="text-xs">Round {stage.order}</Label>
                                      <Select
                                        value={stage.stageType}
                                        onValueChange={(v) => handleStageChange(index, 'stageType', v)}
                                      >
                                        <SelectTrigger className="h-9">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {stageTypeOptions.map(type => (
                                            <SelectItem key={type} value={type}>
                                              {type.charAt(0) + type.slice(1).toLowerCase()}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Min Score</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={stage.minimumScore}
                                        onChange={(e) => handleStageChange(index, 'minimumScore', Number(e.target.value))}
                                        className="h-9"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Duration (min)</Label>
                                      <Input
                                        type="number"
                                        value={stage.duration}
                                        onChange={(e) => handleStageChange(index, 'duration', Number(e.target.value))}
                                        className="h-9"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Questions</Label>
                                      <Input
                                        type="number"
                                        value={stage.questionCount}
                                        onChange={(e) => handleStageChange(index, 'questionCount', Number(e.target.value))}
                                        className="h-9"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Required</Label>
                                      <div className="flex items-center mt-1">
                                        <input
                                          type="checkbox"
                                          checked={stage.required}
                                          onChange={(e) => handleStageChange(index, 'required', e.target.checked)}
                                          className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveStage(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </div>
                                <div className="mt-2 ml-12">
                                  <Input
                                    placeholder="Stage description (optional)"
                                    value={stage.description}
                                    onChange={(e) => handleStageChange(index, 'description', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                
                <Button variant="outline" onClick={handleAddStage} className="w-full">
                  <Plus className="mr-2 size-4" />
                  Add Round
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="size-12 mx-auto mb-3 text-gray-300" />
                <p>Single round interview (no workflow configuration needed)</p>
                <p className="text-sm mt-1">Enable multi-round to configure multiple interview stages</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Ready to post?</h3>
                <p className="text-sm text-gray-600">
                  {enableMultiRound 
                    ? `Your job will have ${stages.length} interview rounds` 
                    : 'Your job will have a single interview round'}
                </p>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                {submitting ? 'Posting...' : <><Briefcase className="mr-2 size-5" /> Post Job</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
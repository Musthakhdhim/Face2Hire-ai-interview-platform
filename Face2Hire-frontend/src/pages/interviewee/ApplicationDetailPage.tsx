import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  CheckCircle2, XCircle, Clock, 
  User, Mail, Calendar, FileText,
  ChevronRight, ChevronDown,
  Circle, Check, X
} from 'lucide-react';
import { applicationService, type ApplicationResponse } from '../../services/applicationService';
import { stagesService, type ApplicationStage, type StageStatus } from '../../services/stagesService';
import { interviewService, type OverallFeedbackDto } from '../../services/interviewService';
import { toast } from 'react-toastify';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationResponse | null>(null);
  const [stages, setStages] = useState<ApplicationStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStageId, setExpandedStageId] = useState<number | null>(null);
  const [stageFeedback, setStageFeedback] = useState<Record<number, OverallFeedbackDto | null>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const app = await applicationService.getApplicationById(Number(id));
        setApplication(app);

        if (app.isMultiRound) {
          const stagesData = await stagesService.getApplicationStages(Number(id));
          setStages(stagesData);

          for (const stage of stagesData) {
            if (stage.scheduledInterviewId && (stage.status === 'APPROVED' || stage.status === 'REJECTED')) {
              try {
                setLoadingFeedback(prev => ({ ...prev, [stage.id]: true }));
                const feedback = await interviewService.getOverallFeedbackByScheduledId(stage.scheduledInterviewId);
                if (feedback) {
                  setStageFeedback(prev => ({ ...prev, [stage.id]: feedback }));
                }
              } catch (error) {
                console.error(`Failed to fetch feedback for stage ${stage.id}:`, error);
              } finally {
                setLoadingFeedback(prev => ({ ...prev, [stage.id]: false }));
              }
            }
          }
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load application details');
        navigate('/interviewee/applications');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

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

  const getStageIcon = (status: StageStatus) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="size-5 text-red-600" />;
      case 'IN_PROGRESS':
        return <Clock className="size-5 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="size-5 text-gray-400" />;
    }
  };

  const getStageStatusBadge = (status: StageStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

  const getStageColor = (status: StageStatus) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  const getStageLifecycleIcon = (stage: ApplicationStage) => {
    switch (stage.status) {
      case 'APPROVED':
        return <Check className="size-5 text-green-600" />;
      case 'REJECTED':
        return <X className="size-5 text-red-600" />;
      case 'IN_PROGRESS':
        return <Clock className="size-5 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="size-5 text-gray-300" />;
    }
  };

  const getStageLifecycleColor = (stage: ApplicationStage) => {
    switch (stage.status) {
      case 'APPROVED':
        return 'border-green-500 bg-green-50';
      case 'REJECTED':
        return 'border-red-500 bg-red-50';
      case 'IN_PROGRESS':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const toggleStageExpand = (stageId: number) => {
    if (expandedStageId === stageId) {
      setExpandedStageId(null);
    } else {
      setExpandedStageId(stageId);
    }
  };

  const getStageProgress = () => {
    const total = stages.length;
    const completed = stages.filter(s => s.status === 'APPROVED' || s.status === 'SKIPPED').length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const renderFeedbackContent = (feedback: OverallFeedbackDto) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{feedback.communicationScore}%</div>
            <div className="text-xs text-gray-600">Communication</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{feedback.technicalScore}%</div>
            <div className="text-xs text-gray-600">Technical</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{feedback.confidenceScore}%</div>
            <div className="text-xs text-gray-600">Confidence</div>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-900 mb-2">Detailed Feedback</h5>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
            {feedback.detailedFeedback || 'No detailed feedback available.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Strengths
            </h5>
            <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg whitespace-pre-wrap">
              {feedback.strengths || 'No strengths recorded.'}
            </div>
          </div>
          <div>
            <h5 className="font-medium text-amber-700 mb-2 flex items-center gap-2">
              <XCircle className="size-4" />
              Areas for Improvement
            </h5>
            <div className="text-sm text-gray-700 bg-amber-50 p-3 rounded-lg whitespace-pre-wrap">
              {feedback.improvements || 'No areas for improvement recorded.'}
            </div>
          </div>
        </div>

        {feedback.suggestedResources && feedback.suggestedResources.length > 0 && (
          <div>
            <h5 className="font-medium text-purple-700 mb-2">Suggested Resources</h5>
            <div className="flex flex-wrap gap-2">
              {feedback.suggestedResources.map((resource, idx) => (
                <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700">
                  {resource}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!application) return null;

  const progress = getStageProgress();
  const isMultiRound = application.isMultiRound && stages.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/interviewee/applications')}>
        ← Back to Applications
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
        <p className="text-gray-600 mt-1">View your job application and status</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{application.jobTitle}</CardTitle>
            {getStatusBadge(application.status)}
          </div>
          <p className="text-gray-600">{application.company}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="size-4" />
              {application.userName}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="size-4" />
              {application.userEmail || 'Not provided'}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="size-4" />
              Applied on {new Date(application.appliedAt).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="size-4" />
              Score: {application.score || 'Not yet'}
            </div>
            {isMultiRound && (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="size-4" />
                <span>Total Stages: <span className="font-medium">{stages.length}</span></span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Cover Letter</h3>
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
              {application.coverLetter || 'No cover letter provided.'}
            </div>
          </div>
        </CardContent>
      </Card>

      {isMultiRound && (
        <>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Interview Progress
                  </h3>
                  <p className="text-gray-600">{application.jobTitle} at {application.company}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Progress</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {progress.completed}/{progress.total} Stages
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{progress.percentage}% Complete</span>
                  <span>
                    {application.overallResult === 'PASSED' ? '✅ All rounds passed' : 
                     application.overallResult === 'FAILED' ? '❌ Application declined' : 
                     '⏳ In progress'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Interview Rounds</h4>
              <div className="flex items-center justify-between relative">
                <div className="absolute left-8 right-8 top-5 h-0.5 bg-gray-200" />
                
                {stages.map((stage) => (
                  <div key={stage.id} className="flex flex-col items-center relative z-10">
                    <div className={`size-10 rounded-full border-2 flex items-center justify-center ${getStageLifecycleColor(stage)}`}>
                      {getStageLifecycleIcon(stage)}
                    </div>
                    <span className="text-xs font-medium mt-2 text-gray-700">
                      {stage.stageType}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {stage.status === 'APPROVED' ? '✅ Passed' :
                       stage.status === 'REJECTED' ? '❌ Failed' :
                       stage.status === 'IN_PROGRESS' ? '⏳ In Progress' :
                       '⏸ Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute left-5 top-8 h-full w-0.5 bg-gray-200" />
            
            {stages.map((stage, index) => {
              const isLast = index === stages.length - 1;
              const isExpanded = expandedStageId === stage.id;
              const feedback = stageFeedback[stage.id];
              const isLoadingFeedback = loadingFeedback[stage.id];

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-14 pb-8"
                >
                  <div className={`absolute left-0 top-1 size-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${getStageColor(stage.status)}`}>
                    {getStageIcon(stage.status)}
                  </div>

                  {!isLast && (
                    <div className={`absolute left-5 top-11 h-full w-0.5 ${stage.status === 'APPROVED' || stage.status === 'SKIPPED' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}

                  <Card className={`border-0 shadow-lg hover:shadow-xl transition-all ${stage.isLocked ? 'opacity-60' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              Round {stage.stageOrder}: {stage.stageType}
                            </h3>
                            {getStageStatusBadge(stage.status)}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Minimum Score:</span>{' '}
                              {stage.minimumScore !== null ? `${stage.minimumScore}%` : 'N/A'}
                            </div>
                            {stage.actualScore !== null && (
                              <div>
                                <span className="font-medium">Your Score:</span>{' '}
                                <span className={stage.actualScore >= (stage.minimumScore || 0) ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                  {stage.actualScore}%
                                </span>
                              </div>
                            )}
                            {stage.completedAt && (
                              <div>
                                <span className="font-medium">Completed:</span>{' '}
                                {new Date(stage.completedAt).toLocaleString()}
                              </div>
                            )}
                            {stage.scheduledInterviewId && (
                              <div>
                                <span className="font-medium">Interview ID:</span>{' '}
                                #{stage.scheduledInterviewId}
                              </div>
                            )}
                          </div>
                          {stage.feedback && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">{stage.feedback}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {(stage.status === 'APPROVED' || stage.status === 'REJECTED') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleStageExpand(stage.id)}
                              className={stage.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}
                            >
                              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                              Details
                            </Button>
                          )}
                          {stage.status === 'PENDING' && stage.isLocked && (
                            <Badge className="bg-gray-200 text-gray-600">
                              <Clock className="mr-1 size-3" />
                              Waiting
                            </Badge>
                          )}
                        </div>
                      </div>

                      {isExpanded && (stage.status === 'APPROVED' || stage.status === 'REJECTED') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200 space-y-3"
                        >
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Interview Details</h4>
                            <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="text-gray-600">Score</div>
                                <div className="text-2xl font-bold text-blue-600">{stage.actualScore}%</div>
                              </div>
                              <div className="p-3 bg-green-50 rounded-lg">
                                <div className="text-gray-600">Status</div>
                                <div className="text-lg font-bold text-green-600">{stage.status}</div>
                              </div>
                              <div className="p-3 bg-purple-50 rounded-lg">
                                <div className="text-gray-600">Completed</div>
                                <div className="text-sm font-medium">
                                  {stage.completedAt ? new Date(stage.completedAt).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                            </div>

                            {isLoadingFeedback ? (
                              <div className="text-center py-4 text-gray-500">Loading feedback...</div>
                            ) : feedback ? (
                              renderFeedbackContent(feedback)
                            ) : stage.status === 'APPROVED' || stage.status === 'REJECTED' ? (
                              <div className="text-center py-4 text-gray-500">
                                No detailed feedback available for this stage.
                              </div>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
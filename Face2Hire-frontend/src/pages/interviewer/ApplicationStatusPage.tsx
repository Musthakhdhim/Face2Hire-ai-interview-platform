import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { 
  Clock, 
  CheckCircle2, XCircle, 
  ChevronRight, ChevronDown, SkipForward, 
  PlayCircle, 
  Circle,
  Check,
  X
} from "lucide-react";
import { applicationService, type ApplicationResponse } from "../../services/applicationService";
import { stagesService, type ApplicationStage, type StageStatus } from "../../services/stagesService";
import { interviewService, type OverallFeedbackDto } from "../../services/interviewService";
import { toast } from "react-toastify";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface StageDecisionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (score?: number, feedback?: string) => void;
    title: string;
    description: string;
    showScore?: boolean;
    isApprove?: boolean;
    isSkip?: boolean;
    loading?: boolean;
}

function StageDecisionDialog({ 
    open, 
    onOpenChange, 
    onConfirm, 
    title, 
    description, 
    showScore = false,
    isApprove = true,
    isSkip = false,
    loading = false 
}: StageDecisionDialogProps) {
    const [score, setScore] = useState<number>(70);
    const [feedback, setFeedback] = useState('');

    const handleConfirm = () => {
        if (showScore && isApprove && !score) {
            toast.error('Please enter a score');
            return;
        }
        onConfirm(showScore ? score : undefined, feedback || undefined);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {showScore && isApprove && (
                        <div>
                            <Label htmlFor="score">Score (%)</Label>
                            <Input
                                id="score"
                                type="number"
                                min="0"
                                max="100"
                                value={score}
                                onChange={(e) => setScore(Number(e.target.value))}
                                placeholder="Enter score"
                            />
                        </div>
                    )}
                    <div>
                        <Label htmlFor="feedback">Feedback</Label>
                        <Textarea
                            id="feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Enter feedback (optional)"
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={loading}
                        className={isApprove ? "bg-green-600 hover:bg-green-700" : isSkip ? "bg-gray-600 hover:bg-gray-700" : "bg-red-600 hover:bg-red-700"}
                    >
                        {loading ? 'Processing...' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ApplicationStatusPage() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState<ApplicationResponse | null>(null);
    const [stages, setStages] = useState<ApplicationStage[]>([]);
    const [currentStage, setCurrentStage] = useState<ApplicationStage | null>(null);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'approve' | 'reject' | 'skip'>('approve');
    const [dialogLoading, setDialogLoading] = useState(false);
    const [expandedStageId, setExpandedStageId] = useState<number | null>(null);
    const [stageFeedback, setStageFeedback] = useState<Record<number, OverallFeedbackDto | null>>({});
    const [loadingFeedback, setLoadingFeedback] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const app = await applicationService.getApplicationById(Number(applicationId));
                setApplication(app);

                const stagesData = await stagesService.getApplicationStages(Number(applicationId));
                setStages(stagesData);

                const current = await stagesService.getCurrentStage(Number(applicationId));
                setCurrentStage(current);

                for (const stage of stagesData) {
                    if (stage.scheduledInterviewId && (stage.status === 'APPROVED' || stage.status === 'REJECTED')) {
                        try {
                            setLoadingFeedback(prev => ({ ...prev, [stage.id]: true }));
                            const feedback = await interviewService.getOverallFeedbackByScheduledId(stage.scheduledInterviewId);
                            if (feedback) {
                                setStageFeedback(prev => ({ ...prev, [stage.id]: feedback }));
                                console.log(`Feedback fetched for stage ${stage.id}:`, feedback);
                            }
                        } catch (error) {
                            console.error(`Failed to fetch feedback for stage ${stage.id}:`, error);
                        } finally {
                            setLoadingFeedback(prev => ({ ...prev, [stage.id]: false }));
                        }
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [applicationId]);

    const getStageIcon = (status: StageStatus) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle2 className="size-5 text-green-600" />;
            case 'REJECTED':
                return <XCircle className="size-5 text-red-600" />;
            case 'IN_PROGRESS':
                return <Clock className="size-5 text-blue-600 animate-pulse" />;
            case 'SKIPPED':
                return <SkipForward className="size-5 text-gray-500" />;
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
            case 'SKIPPED':
                return <Badge className="bg-gray-100 text-gray-700">Skipped</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
        }
    };

    const getStageColor = (status: StageStatus) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-500';
            case 'REJECTED': return 'bg-red-500';
            case 'IN_PROGRESS': return 'bg-blue-500';
            case 'SKIPPED': return 'bg-gray-400';
            default: return 'bg-gray-300';
        }
    };

    const handleStageAction = async (stageId: number, action: 'approve' | 'reject' | 'skip', score?: number, feedback?: string) => {
        setDialogLoading(true);
        try {
            if (action === 'approve') {
                 await stagesService.approveStage(stageId, Number(applicationId), score || 70, feedback);
                toast.success('Stage approved successfully!');
            } else if (action === 'reject') {
                 await stagesService.rejectStage(stageId, Number(applicationId), feedback);
                toast.success('Stage rejected');
            } else {
                await stagesService.skipStage(stageId, Number(applicationId), feedback);
                toast.success('Stage skipped');
            }
            
            const stagesData = await stagesService.getApplicationStages(Number(applicationId));
            setStages(stagesData);
            const current = await stagesService.getCurrentStage(Number(applicationId));
            setCurrentStage(current);
            const app = await applicationService.getApplicationById(Number(applicationId));
            setApplication(app);

            setDialogOpen(false);
        } catch (error) {
            toast.error('Failed to perform action');
        } finally {
            setDialogLoading(false);
        }
    };

    const openDialog = (type: 'approve' | 'reject' | 'skip') => {
        setDialogType(type);
        setDialogOpen(true);
    };

    const toggleStageExpand = (stageId: number) => {
        if (expandedStageId === stageId) {
            setExpandedStageId(null);
        } else {
            setExpandedStageId(stageId);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="size-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    const isStageActionable = (stage: ApplicationStage) => {
        return stage.status === 'PENDING' && stage.stageOrder === (currentStage?.stageOrder || 0);
    };

    const getStageProgress = () => {
        const total = stages.length;
        const completed = stages.filter(s => s.status === 'APPROVED' || s.status === 'SKIPPED').length;
        return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
    };

    const progress = getStageProgress();

    const getOverallResultDisplay = () => {
        const result = application?.overallResult;
        if (result === 'PASSED') return '✅ All rounds passed';
        if (result === 'FAILED') return '❌ Application declined';
        return '⏳ In progress';
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

    const allStagesCompleted = stages.every(s => s.status === 'APPROVED' || s.status === 'SKIPPED');
    const hasRejectedStage = stages.some(s => s.status === 'REJECTED');
    
    const isApplicationApproved = application?.status === 'APPROVED';
    const isApplicationRejected = application?.status === 'REJECTED';

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

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <Button variant="ghost" onClick={() => navigate("/interviewer/applications")} className="mb-2">
                    ← Back to Applications
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Application Progress</h1>
                <p className="text-gray-600 mt-1">Track candidate's interview journey</p>
            </div>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {application?.userName}'s Application
                            </h3>
                            <p className="text-gray-600">{application?.jobTitle} at {application?.company}</p>
                            {isApplicationApproved && (
                                <Badge className="mt-2 bg-green-100 text-green-700 text-sm">
                                    <CheckCircle2 className="size-4 mr-1" /> Final Decision: Approved
                                </Badge>
                            )}
                            {isApplicationRejected && (
                                <Badge className="mt-2 bg-red-100 text-red-700 text-sm">
                                    <XCircle className="size-4 mr-1" /> Final Decision: Rejected
                                </Badge>
                            )}
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
                            <span>{getOverallResultDisplay()}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Interview Rounds</h4>
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-8 right-8 top-5 h-0.5 bg-gray-200" />
                        
                        {stages.map((stage, _index) => (
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
                    const isActionable = isStageActionable(stage);
                    const isCurrent = stage.stageOrder === currentStage?.stageOrder;
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
                                                {isCurrent && stage.status === 'PENDING' && (
                                                    <Badge className="bg-blue-100 text-blue-700 animate-pulse">
                                                        Current
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                                                <div>
                                                    <span className="font-medium">Minimum Score:</span>{' '}
                                                    {stage.minimumScore !== null ? `${stage.minimumScore}%` : 'N/A'}
                                                </div>
                                                {stage.actualScore !== null && (
                                                    <div>
                                                        <span className="font-medium">Candidate Score:</span>{' '}
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
                                            {stage.status === 'PENDING' && isActionable && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => navigate(`/interviewer/schedule?intervieweeId=${application?.userId}&candidateName=${encodeURIComponent(application?.userName || '')}&applicationId=${applicationId}&stageId=${stage.id}`)}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        <PlayCircle className="mr-1 size-4" />
                                                        Start
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openDialog('skip')}
                                                        className="text-gray-600"
                                                    >
                                                        <SkipForward className="mr-1 size-4" />
                                                        Skip
                                                    </Button>
                                                </>
                                            )}
                                            {stage.status === 'IN_PROGRESS' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => navigate(`/interviewer/scheduled/${stage.scheduledInterviewId}`)}
                                                >
                                                    View Interview
                                                </Button>
                                            )}
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

                                    <AnimatePresence>
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
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {!isApplicationApproved && !isApplicationRejected && (
                <>
                    {allStagesCompleted && !hasRejectedStage ? (
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">All Rounds Completed!</h3>
                                        <p className="text-sm text-gray-600">
                                            Candidate has passed all interview rounds. You can now make the final decision.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button 
                                            onClick={() => {
                                                applicationService.updateApplicationStatus(Number(applicationId), 'APPROVED')
                                                    .then(() => {
                                                        toast.success('Application approved!');
                                                        navigate('/interviewer/applications');
                                                    })
                                                    .catch(() => toast.error('Failed to approve application'));
                                            }}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle2 className="mr-2 size-4" />
                                            Approve Candidate
                                        </Button>
                                        <Button 
                                            variant="destructive"
                                            onClick={() => {
                                                applicationService.updateApplicationStatus(Number(applicationId), 'REJECTED')
                                                    .then(() => {
                                                        toast.success('Application rejected');
                                                        navigate('/interviewer/applications');
                                                    })
                                                    .catch(() => toast.error('Failed to reject application'));
                                            }}
                                        >
                                            <XCircle className="mr-2 size-4" />
                                            Reject Candidate
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : hasRejectedStage ? (
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-rose-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Application Rejected</h3>
                                        <p className="text-sm text-gray-600">
                                            Candidate failed a round and cannot proceed further.
                                        </p>
                                    </div>
                                    <Button 
                                        variant="outline"
                                        onClick={() => navigate('/interviewer/applications')}
                                    >
                                        Back to Applications
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : currentStage && currentStage.status === 'PENDING' && !currentStage.isLocked && (
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Awaiting Action</h3>
                                        <p className="text-sm text-gray-600">
                                            You need to start the <strong>{currentStage.stageType}</strong> round for this candidate
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => navigate(`/interviewer/schedule?intervieweeId=${application?.userId}&candidateName=${encodeURIComponent(application?.userName || '')}&applicationId=${applicationId}&stageId=${currentStage.id}`)}
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600"
                                    >
                                        <PlayCircle className="mr-2 size-4" />
                                        Schedule {currentStage.stageType} Round
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {(isApplicationApproved || isApplicationRejected) && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    {isApplicationApproved ? '✅ Application Approved' : '❌ Application Rejected'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {isApplicationApproved 
                                        ? 'This application has been approved. No further action is required.' 
                                        : 'This application has been rejected.'}
                                </p>
                            </div>
                            <Button 
                                variant="outline"
                                onClick={() => navigate('/interviewer/applications')}
                            >
                                Back to Applications
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <StageDecisionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onConfirm={(score, feedback) => {
                    if (currentStage) {
                        handleStageAction(currentStage.id, dialogType, score, feedback);
                    }
                }}
                title={
                    dialogType === 'approve' ? 'Approve Candidate for Next Round' :
                    dialogType === 'reject' ? 'Reject Candidate' :
                    'Skip This Round'
                }
                description={
                    dialogType === 'approve' ? 'Confirm that this candidate has passed this stage.' :
                    dialogType === 'reject' ? 'Are you sure you want to reject this candidate?' :
                    'Are you sure you want to skip this round? This will move the candidate to the next stage.'
                }
                showScore={dialogType === 'approve'}
                isApprove={dialogType === 'approve'}
                isSkip={dialogType === 'skip'}
                loading={dialogLoading}
            />
        </div>
    );
}
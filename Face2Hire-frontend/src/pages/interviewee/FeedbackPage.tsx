import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { CheckCircle2, AlertCircle, Download, Share2, RotateCcw, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import confetti from "canvas-confetti";
import { interviewService } from "../../services/interviewService";
import type { OverallFeedbackDto } from "../../services/interviewService";
import { toast } from "react-toastify";

export default function FeedbackPage() {
  const { sessionId } = useParams();
  const [feedback, setFeedback] = useState<OverallFeedbackDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await interviewService.getOverallFeedback(Number(sessionId));
        setFeedback(data);
        if (data.overallScore >= 70) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } catch (error) {
        toast.error("Failed to load feedback");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId]);

  if (loading) return <div className="text-center py-12">Loading feedback...</div>;
  if (!feedback) return <div className="text-center py-12">No feedback found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/interviewee/history"><Button variant="ghost">← Back to History</Button></Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Interview Feedback</h1>
        <p className="text-gray-600">Detailed analysis of your performance</p>
      </motion.div>

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="p-12 text-center">
            <div className="size-40 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl">
              <span className="text-6xl font-bold text-white">{feedback.overallScore}%</span>
            </div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900">Great Job!</h2>
            <Badge className="bg-green-100 text-green-700 text-lg px-4 py-2 mb-4">Overall</Badge>
            <div className="flex justify-center gap-3 mt-8">
              <Button size="lg" variant="outline"><Download className="mr-2 size-5" />Download Report</Button>
              <Button size="lg" variant="outline"><Share2 className="mr-2 size-5" />Share</Button>
              <Link to="/interviewee/interview/setup"><Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600"><RotateCcw className="mr-2 size-5" />Practice Again</Button></Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg"><CardContent className="p-6"><div className="text-center"><div className="text-4xl font-bold text-blue-600 mb-2">{feedback.communicationScore}%</div><div className="text-sm text-gray-600 mb-4">Communication</div><Progress value={feedback.communicationScore} className="h-2" /></div></CardContent></Card>
        <Card className="border-0 shadow-lg"><CardContent className="p-6"><div className="text-center"><div className="text-4xl font-bold text-purple-600 mb-2">{feedback.technicalScore}%</div><div className="text-sm text-gray-600 mb-4">Technical Skills</div><Progress value={feedback.technicalScore} className="h-2" /></div></CardContent></Card>
        <Card className="border-0 shadow-lg"><CardContent className="p-6"><div className="text-center"><div className="text-4xl font-bold text-green-600 mb-2">{feedback.confidenceScore}%</div><div className="text-sm text-gray-600 mb-4">Confidence</div><Progress value={feedback.confidenceScore} className="h-2" /></div></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg border-l-4 border-l-green-500"><CardHeader><CardTitle className="flex items-center gap-2 text-green-700"><CheckCircle2 className="size-6" />Strengths</CardTitle></CardHeader><CardContent><ul className="space-y-3">{feedback.strengths.split('\n').map((s, i) => <li key={i} className="flex items-start gap-3"><TrendingUp className="size-5 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{s}</span></li>)}</ul></CardContent></Card>
        <Card className="border-0 shadow-lg border-l-4 border-l-amber-500"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-700"><AlertCircle className="size-6" />Areas for Improvement</CardTitle></CardHeader><CardContent><ul className="space-y-3">{feedback.improvements.split('\n').map((s, i) => <li key={i} className="flex items-start gap-3"><TrendingDown className="size-5 text-amber-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{s}</span></li>)}</ul></CardContent></Card>
      </div>

      <Card className="border-0 shadow-lg"><CardHeader><CardTitle>Detailed Feedback</CardTitle></CardHeader><CardContent><p className="text-gray-700 whitespace-pre-wrap">{feedback.detailedFeedback}</p></CardContent></Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50"><CardHeader><CardTitle>Recommended Resources</CardTitle></CardHeader><CardContent><div className="grid md:grid-cols-2 gap-4">{feedback.suggestedResources.map((resource, idx) => (<Card key={idx} className="border-0 shadow hover:shadow-lg transition-shadow cursor-pointer"><CardContent className="p-4 flex items-center justify-between"><div><h4 className="font-semibold text-gray-900">{resource}</h4><Badge variant="outline" className="mt-1">Resource</Badge></div><ExternalLink className="size-5 text-indigo-600" /></CardContent></Card>))}</div></CardContent></Card>
    </div>
  );
}
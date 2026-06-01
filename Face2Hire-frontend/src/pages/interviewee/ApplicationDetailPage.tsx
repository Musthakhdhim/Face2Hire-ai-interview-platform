import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CheckCircle2, XCircle, Clock, User, Mail, Calendar, FileText } from 'lucide-react';
import { applicationService, type ApplicationResponse } from '../../services/applicationService';
import { toast } from 'react-toastify';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await applicationService.getApplicationById(Number(id));
        setApplication(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load application details');
        navigate('/interviewee/applications');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!application) return null;

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
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Cover Letter</h3>
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
              {application.coverLetter || 'No cover letter provided.'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
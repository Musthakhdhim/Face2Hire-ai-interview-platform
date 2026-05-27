import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Download, FileText, Calendar, Briefcase, Award, Loader2 } from 'lucide-react';
import { profileService, type ResumeData } from '../../services/profileService';
import { toast } from 'react-toastify';

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
  return 'Failed to load resume data';
};

export default function ResumeTab() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const data = await profileService.getResumeData();
        setResumeData(data);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, []);

  const handleDownload = () => {
    if (resumeData?.fileUrl) {
      window.open(resumeData.fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!resumeData) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <FileText className="size-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Resume Uploaded</h3>
          <p className="text-gray-600 mb-4">Upload your CV from the Upload CV page to see your extracted information.</p>
          <Button onClick={() => window.location.href = '/interviewee/upload-cv'} className="bg-indigo-600">
            Upload CV
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5 text-indigo-600" />
            Uploaded Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="size-8 text-indigo-600" />
              <div>
                <div className="font-medium text-gray-900">{resumeData.fileName}</div>
                <div className="text-sm text-gray-500">Uploaded on {new Date(resumeData.uploadedAt).toLocaleString()}</div>
              </div>
            </div>
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="size-4" /> Download
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Extracted Name:</span> {resumeData.extractedFullName || '—'}</div>
            <div><span className="font-medium">Extracted Email:</span> {resumeData.extractedEmail || '—'}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5 text-indigo-600" />
            Extracted Skills
          </CardTitle>
          <CardDescription>Skills identified from your resume</CardDescription>
        </CardHeader>
        <CardContent>
          {resumeData.skills.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No skills detected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {resumeData.skills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                  {skill.name}
                  {skill.level && <span className="ml-1 text-xs opacity-70">({skill.level.toLowerCase()})</span>}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="size-5 text-indigo-600" />
            Work Experience
          </CardTitle>
          <CardDescription>Professional experience extracted from your resume</CardDescription>
        </CardHeader>
        <CardContent>
          {resumeData.experiences.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No work experience detected</p>
          ) : (
            <div className="space-y-4">
              {resumeData.experiences.map((exp, idx) => (
                <div key={idx} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="font-semibold text-gray-900">{exp.title} at {exp.company}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Calendar className="size-3" />
                    {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : '?'} – {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                  </div>
                  {exp.description && <p className="text-sm text-gray-700 mt-2">{exp.description}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
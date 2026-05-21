import { useState, type JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Upload, FileText, CheckCircle2, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { resumeService, type ResumeResponse, type SkillDto, type ExperienceDto } from '../../services/resumeService';

export default function UploadCVPage(): JSX.Element {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeResponse | null>(null);
  const [parsedData, setParsedData] = useState<{ fullName: string; email: string; skills: SkillDto[]; experiences: ExperienceDto[] } | null>(null);

  const parseParsedContent = (content: string | null) => {
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      handleUpload(selectedFile);
    }
  };

  const handleUpload = async (selectedFile: File) => {
    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const { presignedUrl, fileKey } = await resumeService.getUploadUrl({
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      });

      await fetch(presignedUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type },
      });

      const resume = await resumeService.confirmUpload(fileKey);
      setResumeData(resume);

      if (resume.status === 'COMPLETED') {
        const extracted = parseParsedContent(resume.parsedContent);
        if (extracted) {
          setParsedData({
            fullName: extracted.fullName || resume.extractedFullName || '',
            email: extracted.email || resume.extractedEmail || '',
            skills: extracted.skills || [],
            experiences: extracted.experiences || [],
          });
        } else if (resume.extractedFullName || resume.extractedEmail) {
          setParsedData({
            fullName: resume.extractedFullName || '',
            email: resume.extractedEmail || '',
            skills: [],
            experiences: [],
          });
        }
        toast.success('CV uploaded and analyzed successfully!');
      } else {
        toast.warning('CV uploaded but parsing failed. Please try again later.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      clearInterval(interval);
      setUploadProgress(100);
      setUploading(false);
    }
  };

  const handleConfirm = () => {
    toast.success('CV confirmed! You can now practice interviews based on your skills.');
    navigate('/interviewee');
  };

  const handleReset = () => {
    setFile(null);
    setResumeData(null);
    setParsedData(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload CV</h1>
        <p className="text-gray-600 mt-1">Upload your resume for personalized interview questions</p>
      </div>

      {!resumeData ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 transition-colors">
                <Upload className="size-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {file ? file.name : 'Upload Your Resume'}
                </h3>
                <p className="text-gray-600 mb-4">Drag and drop or click to browse</p>
                <Button disabled={uploading}>Browse Files</Button>
                <p className="text-sm text-gray-500 mt-4">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
              </div>
            </label>

            {uploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Uploading and analyzing...</span>
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-0 shadow-lg border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-6 text-green-600" />
                  CV Uploaded Successfully
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FileText className="size-8 text-indigo-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{file?.name}</div>
                  <div className="text-sm text-gray-500">
                    {((file?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="size-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Extracted Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Name</div>
                <div className="text-gray-900">{parsedData?.fullName || '—'}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Email</div>
                <div className="text-gray-900">{parsedData?.email || '—'}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Years of Experience</div>
                <div className="text-gray-900">
                  {parsedData?.experiences?.reduce((sum, exp) => {
                    if (exp.startDate && exp.endDate) {
                      const years = new Date(exp.endDate).getFullYear() - new Date(exp.startDate).getFullYear();
                      return sum + years;
                    }
                    return sum;
                  }, 0) || 0} years
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Skills Detected</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {parsedData?.skills?.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                  {(!parsedData?.skills || parsedData.skills.length === 0) && (
                    <span className="text-sm text-gray-500">No skills detected</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Work Experience</div>
                {parsedData?.experiences?.map((exp, idx) => (
                  <div key={idx} className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">{exp.title} at {exp.company}</div>
                    <div className="text-sm text-gray-600">
                      {exp.startDate} – {exp.endDate || 'Present'}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{exp.description}</div>
                  </div>
                ))}
                {(!parsedData?.experiences || parsedData.experiences.length === 0) && (
                  <span className="text-sm text-gray-500">No work experience detected</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Ready to confirm?</h3>
                  <p className="text-sm text-gray-600">
                    Your CV will be used to generate personalized interview questions
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleConfirm}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  Confirm & Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
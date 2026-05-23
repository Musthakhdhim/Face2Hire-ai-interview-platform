import axiosClient from './axiosClient';
import API from './endpoints';

export interface ResumeUploadRequest {
  fileName: string;
  fileType: string;
}

export interface ResumeUploadResponse {
  presignedUrl: string;
  fileKey: string;
}

export interface SkillDto {
  name: string;
  years: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  category: string;
}

export interface ExperienceDto {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

export interface ParsedResumeDto {
  fullName: string;
  email: string;
  skills: SkillDto[];
  experiences: ExperienceDto[];
}

export interface ResumeResponse {
  id: number;
  userId: number;
  fileKey: string;
  fileUrl: string | null;
  uploadedAt: string;
  parsedContent: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  isActive: boolean;
  versionNumber: number;
  extractedFullName: string | null;
  extractedEmail: string | null;
  parsedData?: ParsedResumeDto;
}

export const resumeService = {
  getUploadUrl: async (req: ResumeUploadRequest): Promise<ResumeUploadResponse> => {
    const response = await axiosClient.post(API.RESUME.UPLOAD_URL, req);
    return response.data.data;
  },

  confirmUpload: async (fileKey: string): Promise<ResumeResponse> => {
    const response = await axiosClient.post(API.RESUME.CONFIRM, { fileKey });
    return response.data.data;
  },

  getActiveResume: async (): Promise<ResumeResponse | null> => {
    const response = await axiosClient.get(API.RESUME.ACTIVE);
    return response.data.data;
  },

  getResumeDownloadUrlForUser: async (userId: number): Promise<string> => {
    const response = await axiosClient.get(`/resume/download/${userId}`);
    return response.data.data;
  },
};
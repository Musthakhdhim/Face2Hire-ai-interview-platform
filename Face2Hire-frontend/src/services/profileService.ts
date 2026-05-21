import axiosClient from './axiosClient';

export interface SkillInfo {
  name: string;
  years: number | null;
  level: string | null;
  category: string | null;
}

export interface ExperienceInfo {
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
}

export interface ResumeData {
  id: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  status: string;
  extractedFullName: string;
  extractedEmail: string;
  skills: SkillInfo[];
  experiences: ExperienceInfo[];
}

export const profileService = {
  getResumeData: async (): Promise<ResumeData | null> => {
    const response = await axiosClient.get('/profile/resume');
    return response.data.data;
  },
};
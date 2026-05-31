import axiosClient from './axiosClient';
import API from './endpoints';

export interface ApplicationRequest {
  jobId: number;
  coverLetter: string;
}

export interface ApplicationResponse {
  id: number;
  jobId: number;
  jobTitle: string;
  company: string;
  userId: number;
  userName: string;
  userEmail:string;
  coverLetter: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  score: number;
  appliedAt: string;
  updatedAt: string;
}

export interface ApplicationListResponse {
  id: number;
  jobId: number;
  jobTitle: string;
  userId: number;
  userName: string;
  userEmail: string;
  score: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
  hasScheduledInterview: boolean;
}

export interface PaginatedApplications<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const applicationService = {
  apply: async (data: ApplicationRequest): Promise<ApplicationResponse> => {
    const response = await axiosClient.post(API.APPLICATIONS.CREATE, data);
    return response.data.data;
  },

  getMyApplications: async (page = 0, size = 10, sortBy = 'appliedAt', direction: 'asc' | 'desc' = 'desc'): Promise<PaginatedApplications<ApplicationListResponse>> => {
    const response = await axiosClient.get(API.APPLICATIONS.MY_APPLICATIONS, {
      params: { page, size, sortBy, direction },
    });
    return response.data.data;
  },

  getApplicationsForJob: async (jobId: number, page = 0, size = 10): Promise<PaginatedApplications<ApplicationListResponse>> => {
    const response = await axiosClient.get(API.APPLICATIONS.FOR_JOB(jobId), {
      params: { page, size },
    });
    return response.data.data;
  },

  getApplicationsForInterviewer: async (page = 0, size = 10): Promise<PaginatedApplications<ApplicationListResponse>> => {
    const response = await axiosClient.get(API.APPLICATIONS.FOR_INTERVIEWER, {
      params: { page, size },
    });
    return response.data.data;
  },

  updateApplicationStatus: async (applicationId: number, status: 'APPROVED' | 'REJECTED'): Promise<ApplicationResponse> => {
    const response = await axiosClient.put(API.APPLICATIONS.UPDATE_STATUS(applicationId), { status });
    return response.data.data;
  },

  getApplicationById: async (id: number): Promise<ApplicationResponse> => {
  const response = await axiosClient.get(`/applications/${id}`);
  return response.data.data;
},

};
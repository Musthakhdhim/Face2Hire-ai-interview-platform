import axiosClient from './axiosClient';
import API from './endpoints';

export interface JobRequest {
  title: string;
  company: string;
  location?: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  salary?: string;
  requiredExperience?: number;
  description: string;
  skills: string[];
}

export interface JobResponse {
  id: number;
  title: string;
  company: string;
  location: string | null;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  salary: string | null;
  matchPercentage: number | null;
  requiredExperience: number | null;
  description: string;
  postedByUserId: number;
  postedByUserName?: string;
  applicantsCount: number;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  skills: string[];
}

export interface JobListResponse {
  id: number;
  title: string;
  company: string;
  location: string | null;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  salary: string | null;
  requiredExperience: number | null;
  applicantsCount: number;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  skills: string[];
  matchPercentage?: number | null; 
}

export interface PaginatedJobs<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const jobService = {
  createJob: async (data: JobRequest): Promise<JobResponse> => {
    const response = await axiosClient.post(API.JOBS.CREATE, data);
    return response.data.data;
  },

  getJobById: async (jobId: number): Promise<JobResponse> => {
    const response = await axiosClient.get(API.JOBS.GET_BY_ID(jobId));
    return response.data.data;
  },

  getMyJobs: async (page: number = 0, size: number = 10, sortBy: string = 'createdAt', direction: 'asc' | 'desc' = 'desc'): Promise<PaginatedJobs<JobListResponse>> => {
    const response = await axiosClient.get(API.JOBS.MY_JOBS, {
      params: { page, size, sortBy, direction }
    });
    return response.data.data;
  },

  getAllActiveJobs: async (page: number = 0, size: number = 10, search?: string, sortBy: string = 'createdAt', direction: 'asc' | 'desc' = 'desc'): Promise<PaginatedJobs<JobListResponse>> => {
    const params: any = { page, size, sortBy, direction };
    if (search) params.search = search;
    const response = await axiosClient.get(API.JOBS.ALL_ACTIVE, { params });
    return response.data.data;
  },

  updateJob: async (jobId: number, data: JobRequest): Promise<JobResponse> => {
    const response = await axiosClient.put(API.JOBS.UPDATE(jobId), data);
    return response.data.data;
  },

  deleteJob: async (jobId: number): Promise<void> => {
    await axiosClient.delete(API.JOBS.DELETE(jobId));
  },

  closeJob: async (jobId: number): Promise<JobResponse> => {
    const response = await axiosClient.patch(API.JOBS.CLOSE(jobId));
    return response.data.data;
  },
};
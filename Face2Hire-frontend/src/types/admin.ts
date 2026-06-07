export type InterviewType = 'technical' | 'hr' | 'behavioral' | 'salary';
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
export type JobStatus = 'ACTIVE' | 'CLOSED';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type ActivityAction = 
    'REGISTER' | 'LOGIN' | 'PROFILE_UPDATED' | 'RESUME_UPLOADED' |
    'JOB_APPLIED' | 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' |
    'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED' | 'INTERVIEW_ATTENDED' |
    'PASSWORD_CHANGED' | 'EMAIL_UPDATED';

export interface AdminInterviewResponse {
    id: number;
    userId: number;
    userName: string | null;
    userEmail: string | null;
    type: InterviewType;
    difficulty: 'beginner' | 'intermediate' | 'expert';
    duration: number;
    questionCount: number;
    status: SessionStatus;
    overallScore: number | null;
    communicationScore: number | null;
    technicalScore: number | null;
    confidenceScore: number | null;
    startedAt: string;
    completedAt: string | null;
    createdAt: string;
    isScheduled: boolean;
    scheduledInterviewId: number | null;
}

export interface AdminInterviewFilter {
    search?: string;
    type?: InterviewType;
    status?: SessionStatus;
    fromDate?: string; // YYYY-MM-DD
    toDate?: string;
    page?: number;
    size?: number;
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface AdminJobResponse {
    id: number;
    title: string;
    company: string;
    location: string | null;
    type: JobType;
    salary: string | null;
    requiredExperience: number | null;
    description: string;
    postedByUserId: number;
    postedByUserName: string | null;
    postedByUserEmail: string | null;
    applicantsCount: number;
    status: JobStatus;
    createdAt: string;
    updatedAt: string;
    skills: string[];
}

export interface AdminJobFilter {
    search?: string;
    type?: JobType;
    status?: JobStatus;
    postedByUserId?: number;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
}

export interface AdminUserDetailResponse {
    id: number;
    userName: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    profileImageUrl: string | null;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    resume: {
        resumeId: number;
        fileName: string;
        fileUrl: string;
        uploadedAt: string;
        status: string;
        extractedFullName: string | null;
        extractedEmail: string | null;
        skills: Array<{
            name: string;
            yearsOfExperience: number | null;
            proficiencyLevel: string | null;
            category: string | null;
        }>;
        experiences: Array<{
            companyName: string;
            jobTitle: string;
            startDate: string | null;
            endDate: string | null;
            description: string;
        }>;
    } | null;
    interviewStats: {
        totalCompletedInterviews: number;
        avgOverallScore: number;
        avgCommunicationScore: number;
        avgTechnicalScore: number;
        avgConfidenceScore: number;
    };

    
}

export interface AdminInterviewDetailResponse extends AdminInterviewResponse {
    questions: Array<{
        questionId: number;
        questionIndex: number;
        questionText: string;
        category: string;
        expectedKeywords: string[];
        responseId: number | null;
        audioUrl: string | null;
        transcribedText: string | null;
        responseDuration: number | null;
        confidenceScore: number | null;
        speakingRateWpm: number | null;
        fillerWordCount: number | null;
        sentimentScore: number | null;
        keywordsMatched: string[] | null;
        keywordsMissing: string[] | null;
        grammarIssues: string[] | null;
        score: number | null;
        feedbackText: string | null;
        strengths: string | null;
        improvements: string | null;
        suggestedAnswer: string | null;
    }>;
}

export interface AdminJobDetailResponse extends AdminJobResponse {
    applications: Array<{
        id: number;
        userId: number;
        userName: string;
        userEmail: string;
        status: string;
        score: number | null;
        appliedAt: string;
        hasScheduledInterview: boolean;
    }>;
}

export interface AdminReportsDto {
    userReport: {
        totalUsers: number;
        activeUsers: number;
        verifiedUsers: number;
        usersByRole: Record<string, number>;
        userGrowth: Array<{ month: string; count: number }>;
    };
    interviewReport: {
        totalInterviews: number;
        completedInterviews: number;
        abandonedInterviews: number;
        activeInterviews: number;
        interviewsByType: Record<string, number>;
        averageScoreByType: Record<string, number>;
        interviewVolume: Array<{ date: string; count: number }>;
    };
    jobReport: {
        totalJobs: number;
        activeJobs: number;
        closedJobs: number;
        jobsByType: Record<string, number>;
        jobPostings: Array<{ month: string; count: number }>;
    };
    applicationReport: {
        totalApplications: number;
        pendingApplications: number;
        approvedApplications: number;
        rejectedApplications: number;
        applicationsByStatus: Record<string, number>;
    };
}

export interface ActivityLog {
    id: number;
    userId: number;
    userEmail: string;
    userName: string;
    action: ActivityAction;
    description: string;
    createdAt: string;
}

export interface ActivityFilter {
    search?: string;
    action?: ActivityAction;
    page?: number;
    size?: number;
}
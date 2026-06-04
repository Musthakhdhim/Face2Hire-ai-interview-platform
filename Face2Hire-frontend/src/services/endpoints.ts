const API = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_FORGOT_OTP: '/auth/verify-forgot-password-otp',
    RESET_PASSWORD: '/auth/reset-password',
    RESEND_OTP: '/auth/resend-otp',
  },

  RESUME: {
    UPLOAD_URL: '/resume/upload-url',
    CONFIRM: '/resume/confirm',
    ACTIVE: '/resume/active',
  },

  JOBS: {
    CREATE: '/jobs',
    GET_BY_ID: (id: number) => `/jobs/${id}`,
    MY_JOBS: '/jobs/my-jobs',
    ALL_ACTIVE: '/jobs',
    UPDATE: (id: number) => `/jobs/${id}`,
    DELETE: (id: number) => `/jobs/${id}`,
    CLOSE: (id: number) => `/jobs/${id}/close`,
  },
  APPLICATIONS: {
    CREATE: '/applications',
    MY_APPLICATIONS: '/applications/my',
    FOR_JOB: (jobId: number) => `/applications/job/${jobId}`,
    FOR_INTERVIEWER: '/applications/interviewer',
    UPDATE_STATUS: (applicationId: number) => `/applications/${applicationId}/status`,
  },
  INTERVIEW: {
    START: '/interview/start',
    SUBMIT_ANSWER: '/interview/submit-answer',
    NEXT_QUESTION: (sessionId: number, currentQid: number) => `/interview/next-question/${sessionId}/${currentQid}`,
    END: (sessionId: number) => `/interview/end/${sessionId}`,
    FEEDBACK: (sessionId: number) => `/interview/feedback/${sessionId}`,
    MY_SESSIONS: '/interview/my-sessions',
  },
  SCHEDULED_INTERVIEWS: {
    CREATE: '/scheduled-interviews',
    MY: '/scheduled-interviews/my',
    FOR_INTERVIEWER: '/scheduled-interviews/for-interviewer',
  },
  AUDIO: {
    UPLOAD_URL: '/audio/upload-url',
    CONFIRM: '/audio/confirm',
    TTS: '/audio/tts',
  },
  ADMIN: {
    INTERVIEWS_LIST: '/admin/interviews/list',
    JOBS_LIST: '/admin/jobs/list', 
    USER_DETAIL: (userId: number) => `/admin/users/${userId}/detail`,
    INTERVIEW_DETAIL: (id: number) => `/admin/interviews/${id}`,
    JOB_DETAIL: (id: number) => `/admin/jobs/${id}`,
    REPORTS: '/admin/reports',
  },
  
};

export default API;
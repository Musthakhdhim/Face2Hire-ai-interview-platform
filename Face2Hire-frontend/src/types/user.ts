export interface UserListResponseDto {
  id: number;
  userName: string;
  fullName: string | null;
  email: string;
  role: 'INTERVIEWEE' | 'INTERVIEWER' | 'ADMIN';
  isActive: boolean;
  isVerified: boolean;
  profileImageUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserFilterRequest {
  search?: string;
  role?: string;
  isActive?: boolean | null;
  page: number;   
  size: number;
}
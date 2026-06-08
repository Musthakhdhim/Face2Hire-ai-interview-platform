export interface Badge {
    id: number;
    name: string;
    description: string;
    iconUrl: string | null;
    type: 'INTERVIEWEE' | 'INTERVIEWER' | 'GENERAL';
    requirement: string | null;
    createdAt: string;
}
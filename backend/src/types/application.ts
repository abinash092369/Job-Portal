export type ApplicationStatus = 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'hired';

export interface ScreeningAnswer {
  question: string;
  answer: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  resumeUrl: string;
  coverLetter: string;
  screeningAnswers?: ScreeningAnswer[];
  status: ApplicationStatus;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
  candidateName?: string;
  candidateEmail?: string;
  candidateSkills?: string[];
  candidatePhotoUrl?: string;
}

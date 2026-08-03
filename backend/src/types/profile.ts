export interface CandidateProfile {
  name: string;
  headline?: string;
  skills: string[];
  experience: any[];
  education: any[];
  resumeUrl?: string;
  profilePhotoUrl?: string;
  location?: string;
  phone?: string;
}

export interface EmployerProfile {
  companyName: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  isVerified: boolean;
}

import { jobService } from './job.service';
import { bookmarkService } from './bookmark.service';
import { applicationRepository } from '../repositories/in-memory/application.repository.impl';
import { profileRepository } from '../repositories/in-memory/profile.repository.impl';
import { EmployerDashboard, CandidateDashboard } from '../types/dashboard';

class DashboardService {
  async getEmployerDashboard(employerId: string): Promise<EmployerDashboard> {
    // 1. Fetch employer's jobs
    const employerJobs = await jobService.getJobsByEmployer(employerId);
    
    // 2. Count active jobs
    const activeJobsCount = employerJobs.filter((j) => j.status === 'active').length;

    // 3. Count applicants per job and aggregate applications
    let totalApplicants = 0;
    const applicantsPerJob: { jobId: string; jobTitle: string; applicantCount: number }[] = [];
    const allAppsList: any[] = [];

    for (const job of employerJobs) {
      const apps = await applicationRepository.findByJobId(job.id);
      totalApplicants += apps.length;
      applicantsPerJob.push({
        jobId: job.id,
        jobTitle: job.title,
        applicantCount: apps.length,
      });
      
      for (const app of apps) {
        allAppsList.push({
          app,
          jobTitle: job.title,
        });
      }
    }

    // 4. Calculate recent activity (sorted by application date descending)
    allAppsList.sort((a, b) => b.app.createdAt.getTime() - a.app.createdAt.getTime());
    
    const recentAppsSliced = allAppsList.slice(0, 5);
    const recentActivity = [];
    
    for (const entry of recentAppsSliced) {
      const profile = await profileRepository.getCandidateProfile(entry.app.candidateId);
      recentActivity.push({
        id: entry.app.id,
        jobId: entry.app.jobId,
        jobTitle: entry.jobTitle,
        candidateName: profile ? profile.name : 'Unknown Candidate',
        status: entry.app.status,
        createdAt: entry.app.createdAt,
      });
    }

    return {
      activeJobsCount,
      totalApplicants,
      applicantsPerJob,
      recentActivity,
    };
  }

  async getCandidateDashboard(candidateId: string): Promise<CandidateDashboard> {
    // 1. Fetch applied jobs list
    const apps = await applicationRepository.findByCandidate(candidateId);
    const appliedJobs = [];
    
    for (const app of apps) {
      try {
        const job = await jobService.getJobById(app.jobId);
        const employerProfile = await profileRepository.getEmployerProfile(job.employerId);
        appliedJobs.push({
          id: app.id,
          jobId: app.jobId,
          jobTitle: job.title,
          companyName: employerProfile ? employerProfile.companyName : 'Unknown Company',
          status: app.status,
          appliedAt: app.createdAt,
        });
      } catch (error) {
        // Ignore deleted/missing jobs
      }
    }

    // 2. Fetch saved/bookmarked jobs
    const savedJobs = await bookmarkService.getSavedJobs(candidateId);

    // 3. Compute profile completeness percentage dynamically
    const profile = await profileRepository.getCandidateProfile(candidateId);
    let profileCompleteness = 0;
    
    if (profile) {
      if (profile.name && profile.name.trim().length > 0) profileCompleteness += 15;
      if (profile.headline && profile.headline.trim().length > 0) profileCompleteness += 15;
      if (profile.skills && profile.skills.length > 0) profileCompleteness += 20;
      if (profile.experience && profile.experience.length > 0) profileCompleteness += 15;
      if (profile.education && profile.education.length > 0) profileCompleteness += 15;
      if (profile.resumeUrl && profile.resumeUrl.trim().length > 0) profileCompleteness += 10;
      if (profile.location && profile.location.trim().length > 0) profileCompleteness += 5;
      if (profile.phone && profile.phone.trim().length > 0) profileCompleteness += 5;
    }

    return {
      appliedJobs,
      savedJobs,
      profileCompleteness,
    };
  }
}

export const dashboardService = new DashboardService();

import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { CandidateProfile } from '../models/CandidateProfile';
import { EmployerProfile } from '../models/EmployerProfile';
import { BookmarkRepository } from '../repositories/bookmarkRepository';
import { JobRepository } from '../repositories/jobRepository';
import { Types } from 'mongoose';

export class DashboardService {
  private bookmarkRepo: BookmarkRepository;
  private jobRepo: JobRepository;

  constructor() {
    this.bookmarkRepo = new BookmarkRepository();
    this.jobRepo = new JobRepository();
  }

  async getEmployerDashboard(employerId: string) {
    const empObjectId = new Types.ObjectId(employerId);

    // Fetch employer's jobs
    const jobs = await Job.find({ employerId: empObjectId }).lean();
    const jobIds = jobs.map((j) => j._id);
    const activeJobsCount = jobs.filter((j) => j.status === 'active').length;

    // Fetch applications for all employer's jobs
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .sort({ createdAt: -1 })
      .lean();

    const totalApplicants = applications.length;

    // Calculate applicants per job
    const appCountMap = new Map<string, number>();
    applications.forEach((app) => {
      const jId = app.jobId.toString();
      appCountMap.set(jId, (appCountMap.get(jId) || 0) + 1);
    });

    const applicantsPerJob = jobs.map((job) => ({
      jobId: job._id.toString(),
      jobTitle: job.title,
      applicantCount: appCountMap.get(job._id.toString()) || 0,
    }));

    // Generate recent activity (recent 5 applications)
    const recentApps = applications.slice(0, 5);
    const candidateIds = [...new Set(recentApps.map((a) => a.candidateId.toString()))];
    const candidateProfiles = await CandidateProfile.find({
      userId: { $in: candidateIds },
    }).lean();

    const profileMap = new Map<string, any>();
    candidateProfiles.forEach((cp) => profileMap.set(cp.userId.toString(), cp));

    const jobMap = new Map<string, any>();
    jobs.forEach((j) => jobMap.set(j._id.toString(), j));

    const recentActivity = recentApps.map((app) => {
      const job = jobMap.get(app.jobId.toString());
      const candidateProf = profileMap.get(app.candidateId.toString());
      return {
        id: app._id.toString(),
        jobId: app.jobId.toString(),
        jobTitle: job ? job.title : 'Job Listing',
        candidateName: candidateProf ? candidateProf.name : 'Candidate',
        status: app.status,
        createdAt: app.createdAt.toISOString(),
      };
    });

    return {
      activeJobsCount,
      totalApplicants,
      applicantsPerJob,
      recentActivity,
    };
  }

  async getCandidateDashboard(candidateId: string) {
    const candObjectId = new Types.ObjectId(candidateId);

    // 1. Fetch applied jobs
    const applications = await Application.find({ candidateId: candObjectId })
      .sort({ createdAt: -1 })
      .lean();

    const jobIds = [...new Set(applications.map((a) => a.jobId.toString()))];
    const rawJobs = await Job.find({ _id: { $in: jobIds } }).lean();

    const employerIds = [...new Set(rawJobs.map((j) => j.employerId.toString()))];
    const employerProfiles = await EmployerProfile.find({
      userId: { $in: employerIds },
    }).lean();

    const empMap = new Map<string, any>();
    employerProfiles.forEach((ep) => empMap.set(ep.userId.toString(), ep));

    const jobMap = new Map<string, any>();
    rawJobs.forEach((j) => jobMap.set(j._id.toString(), j));

    const appliedJobs = applications.map((app) => {
      const job = jobMap.get(app.jobId.toString());
      const empProfile = job ? empMap.get(job.employerId.toString()) : null;

      return {
        id: app._id.toString(),
        jobId: app.jobId.toString(),
        jobTitle: job ? job.title : 'Position',
        companyName: empProfile ? empProfile.companyName : '',
        status: app.status,
        appliedAt: app.createdAt.toISOString(),
      };
    });

    // 2. Fetch saved jobs (bare array of Job objects)
    const savedJobs = await this.bookmarkRepo.getSavedJobsForCandidate(candidateId);

    // 3. Calculate profile completeness (0-100)
    const profile = await CandidateProfile.findOne({ userId: candObjectId }).lean();
    let score = 0;
    const totalCriteria = 9;

    if (profile) {
      if (profile.name && profile.name.trim()) score++;
      if (profile.headline && profile.headline.trim()) score++;
      if (profile.skills && profile.skills.length > 0) score++;
      if (profile.experience && profile.experience.length > 0) score++;
      if (profile.education && profile.education.length > 0) score++;
      if (profile.resumeUrl && profile.resumeUrl.trim()) score++;
      if (profile.profilePhotoUrl && profile.profilePhotoUrl.trim()) score++;
      if (profile.location && profile.location.trim()) score++;
      if (profile.phone && profile.phone.trim()) score++;
    }

    const profileCompleteness = Math.round((score / totalCriteria) * 100);

    return {
      appliedJobs,
      savedJobs,
      profileCompleteness,
    };
  }
}

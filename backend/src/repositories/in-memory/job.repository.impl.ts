import { Job, JobSearchParams } from '../../types/job';
import { JobRepository } from '../job.repository';
import { JobModel, IJobDocument } from '../../models/job.model';
import { ApplicationModel } from '../../models/application.model';
import { EmployerProfileModel } from '../../models/profile.model';
import mongoose from 'mongoose';

/**
 * Parses salary range string like "$80k - $120k" or "$80,000 - $120,000" into numeric min and max values.
 */
function parseSalaryRange(salaryStr: string): { salaryMin: number; salaryMax: number } {
  const cleanStr = salaryStr.toLowerCase().replace(/,/g, '');
  const numbers = cleanStr.match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return { salaryMin: 0, salaryMax: 0 };
  }

  const parseVal = (numStr: string): number => {
    let val = parseFloat(numStr);
    const index = cleanStr.indexOf(numStr);
    const sub = cleanStr.substring(index);
    if (sub.includes('k') && (sub.indexOf('k') < sub.indexOf('m') || !sub.includes('m'))) {
      val *= 1000;
    } else if (sub.includes('m')) {
      val *= 1000000;
    } else if (cleanStr.includes('k') && !cleanStr.includes('m')) {
      val *= 1000;
    }
    return val;
  };

  if (numbers.length === 1) {
    const val = parseVal(numbers[0]);
    return { salaryMin: val, salaryMax: val };
  } else {
    const minVal = parseVal(numbers[0]);
    const maxVal = parseVal(numbers[1]);
    return { salaryMin: minVal, salaryMax: maxVal };
  }
}

function mapJob(doc: IJobDocument): Job {
  return {
    id: doc._id.toString(),
    employerId: doc.employerId.toString(),
    title: doc.title,
    description: doc.description,
    responsibilities: doc.responsibilities,
    requirements: doc.requirements,
    skills: doc.skills || [],
    salaryRange: doc.salaryRange,
    jobType: doc.jobType,
    location: doc.location,
    experienceLevel: doc.experienceLevel,
    applicationDeadline: doc.applicationDeadline,
    status: doc.status,
    views: doc.views || 0,
    screeningQuestions: doc.screeningQuestions || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function enrichJob(job: Job): Promise<Job> {
  try {
    const profile = await EmployerProfileModel.findOne({ userId: job.employerId });
    if (profile) {
      job.companyName = profile.companyName;
      job.logoUrl = profile.logoUrl;
      job.companyVerified = profile.isVerified;
    } else {
      job.companyName = 'Unknown Company';
      job.logoUrl = '';
      job.companyVerified = false;
    }
  } catch (error) {
    job.companyName = 'Unknown Company';
    job.logoUrl = '';
    job.companyVerified = false;
  }
  return job;
}

async function enrichJobs(jobs: Job[]): Promise<Job[]> {
  await Promise.all(jobs.map(enrichJob));
  return jobs;
}

export class MongooseJobRepository implements JobRepository {
  async findById(id: string): Promise<Job | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const job = await JobModel.findById(id);
    return job ? enrichJob(mapJob(job)) : null;
  }

  async findByEmployerId(employerId: string): Promise<Job[]> {
    if (!mongoose.Types.ObjectId.isValid(employerId)) return [];
    const jobs = await JobModel.find({ employerId }).sort({ createdAt: -1 });
    return enrichJobs(jobs.map(mapJob));
  }

  async findAllActive(): Promise<Job[]> {
    const jobs = await JobModel.find({ status: 'active' }).sort({ createdAt: -1 });
    return enrichJobs(jobs.map(mapJob));
  }

  async incrementViews(id: string): Promise<Job | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const job = await JobModel.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
    return job ? enrichJob(mapJob(job)) : null;
  }

  async searchActiveJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    const query: any = { status: 'active' };

    // Filter by employerId (public company profile listings)
    if (params.employerId) {
      query.employerId = params.employerId;
    }

    // Filter by location (case-insensitive regex match)
    if (params.location) {
      query.location = { $regex: new RegExp(params.location, 'i') };
    }

    // Filter by jobType
    if (params.jobType) {
      query.jobType = params.jobType.toLowerCase();
    }

    // Filter by experienceLevel
    if (params.experienceLevel) {
      query.experienceLevel = params.experienceLevel.toLowerCase();
    }

    // Filter by remote
    if (params.remote !== undefined) {
      if (params.remote) {
        query.$or = [
          { jobType: 'remote' },
          { location: { $regex: /remote/i } },
        ];
      } else {
        query.jobType = { $ne: 'remote' };
        query.location = { $not: /remote/i };
      }
    }

    // Filter by skills (must match all requested skills)
    if (params.skills && params.skills.length > 0) {
      // In MongoDB: match jobs where skills array contains all searched skills (case-insensitive regex)
      query.skills = {
        $all: params.skills.map((s) => new RegExp('^' + s.trim() + '$', 'i')),
      };
    }

    // Filter by salaryMin (checks that maximum salary is >= requested minimum)
    if (params.salaryMin) {
      query.salaryMax = { $gte: params.salaryMin };
    }

    // Text search query
    if (params.search) {
      query.$text = { $search: params.search };
    }

    // Determine Sort Options
    let sort: any = { createdAt: -1 }; // Default: Newest first
    const projectScore = params.search && params.sortBy === 'relevance';

    if (params.sortBy) {
      if (params.sortBy === 'newest') {
        sort = { createdAt: -1 };
      } else if (params.sortBy === 'salary-high') {
        sort = { salaryMax: -1 };
      } else if (params.sortBy === 'salary-low') {
        sort = { salaryMin: 1 };
      } else if (params.sortBy === 'relevance' && params.search) {
        sort = { score: { $meta: 'textScore' } };
      }
    }

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const total = await JobModel.countDocuments(query);
    
    let jobsQuery = JobModel.find(query);
    if (projectScore) {
      jobsQuery = jobsQuery.select({ score: { $meta: 'textScore' } });
    }
    
    const docs = await jobsQuery.sort(sort).skip(skip).limit(limit);
    const jobs = await enrichJobs(docs.map(mapJob));
    return {
      jobs,
      total,
    };
  }

  async create(jobData: Omit<Job, 'id' | 'views' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    const { salaryMin, salaryMax } = parseSalaryRange(jobData.salaryRange);

    const job = new JobModel({
      ...jobData,
      salaryMin,
      salaryMax,
      views: 0,
    });
    await job.save();

    return enrichJob(mapJob(job));
  }

  async update(
    id: string,
    updates: Partial<Omit<Job, 'id' | 'views' | 'createdAt' | 'updatedAt'>>
  ): Promise<Job | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const finalUpdates: any = { ...updates };
    if (updates.salaryRange) {
      const { salaryMin, salaryMax } = parseSalaryRange(updates.salaryRange);
      finalUpdates.salaryMin = salaryMin;
      finalUpdates.salaryMax = salaryMax;
    }

    const job = await JobModel.findByIdAndUpdate(
      id,
      { $set: finalUpdates },
      { new: true }
    );
    return job ? enrichJob(mapJob(job)) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;

    const result = await JobModel.deleteOne({ _id: id });
    const deleted = (result.deletedCount || 0) > 0;
    
    if (deleted) {
      // Cascade delete applications for this job posting
      await ApplicationModel.deleteMany({ jobId: id });
    }

    return deleted;
  }

  async findAll(): Promise<Job[]> {
    const jobs = await JobModel.find().sort({ createdAt: -1 });
    return enrichJobs(jobs.map(mapJob));
  }
}

export const jobRepository = new MongooseJobRepository();

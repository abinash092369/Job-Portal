import { Job, IJob } from '../models/Job';
import { EmployerProfile } from '../models/EmployerProfile';
import { Application } from '../models/Application';
import { Bookmark } from '../models/Bookmark';
import { Types } from 'mongoose';

export interface JobFilterParams {
  search?: string;
  location?: string;
  jobType?: string | string[];
  experienceLevel?: string;
  remote?: boolean;
  skills?: string;
  salaryMin?: string | number;
  employerId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

export class JobRepository {
  async create(data: Partial<IJob>): Promise<IJob> {
    const job = new Job(data);
    return job.save();
  }

  async findById(id: string): Promise<IJob | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Job.findById(id);
  }

  async incrementViews(id: string): Promise<IJob | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Job.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
  }

  async update(id: string, data: Partial<IJob>): Promise<IJob | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Job.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteAndCascade(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const jobId = new Types.ObjectId(id);
    
    // Delete Job
    const deleted = await Job.findByIdAndDelete(jobId);
    if (!deleted) return false;

    // Cascade delete to Applications and Bookmarks
    await Application.deleteMany({ jobId });
    await Bookmark.deleteMany({ jobId });

    return true;
  }

  async findJobs(params: JobFilterParams): Promise<{ jobs: any[]; total: number }> {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 9;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (params.employerId) {
      if (Types.ObjectId.isValid(params.employerId)) {
        filter.employerId = new Types.ObjectId(params.employerId);
      }
    }

    if (params.search) {
      filter.$or = [
        { title: { $regex: params.search, $options: 'i' } },
        { description: { $regex: params.search, $options: 'i' } },
        { skills: { $in: [new RegExp(params.search, 'i')] } },
      ];
    }

    if (params.location) {
      filter.location = { $regex: params.location, $options: 'i' };
    }

    if (params.remote !== undefined && params.remote !== null) {
      if (params.remote === true || String(params.remote).toLowerCase() === 'true') {
        filter.jobType = 'remote';
      }
    } else if (params.jobType) {
      if (Array.isArray(params.jobType)) {
        filter.jobType = { $in: params.jobType };
      } else {
        filter.jobType = params.jobType;
      }
    }

    if (params.experienceLevel) {
      filter.experienceLevel = params.experienceLevel;
    }

    if (params.skills) {
      const skillList = String(params.skills)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillList.length > 0) {
        filter.skills = { $in: skillList.map((s) => new RegExp(s, 'i')) };
      }
    }

    // Default status active if searching public listings without explicit employerId filter
    if (!params.employerId) {
      filter.status = 'active';
    }

    let sortOption: any = { createdAt: -1 };
    if (params.sortBy) {
      if (params.sortBy === 'createdAt_asc') sortOption = { createdAt: 1 };
      else if (params.sortBy === 'views_desc') sortOption = { views: -1 };
    }

    const total = await Job.countDocuments(filter);
    const rawJobs = await Job.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const jobs = await this.flattenCompanyDetails(rawJobs);

    return { jobs, total };
  }

  async findByEmployerId(employerId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(employerId)) return [];
    const rawJobs = await Job.find({ employerId: new Types.ObjectId(employerId) })
      .sort({ createdAt: -1 })
      .lean();
    return this.flattenCompanyDetails(rawJobs);
  }

  async flattenCompanyDetails(jobs: any[]): Promise<any[]> {
    if (!jobs || jobs.length === 0) return [];

    const employerIds = [...new Set(jobs.map((j) => j.employerId.toString()))];
    const employerProfiles = await EmployerProfile.find({
      userId: { $in: employerIds },
    }).lean();

    const profileMap = new Map<string, any>();
    employerProfiles.forEach((ep) => {
      profileMap.set(ep.userId.toString(), ep);
    });

    return jobs.map((job) => {
      const empProfile = profileMap.get(job.employerId.toString());
      return {
        id: job._id.toString(),
        employerId: job.employerId.toString(),
        title: job.title,
        description: job.description,
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        skills: job.skills,
        salaryRange: job.salaryRange,
        jobType: job.jobType,
        location: job.location,
        experienceLevel: job.experienceLevel,
        applicationDeadline: job.applicationDeadline,
        status: job.status,
        views: job.views,
        screeningQuestions: job.screeningQuestions || [],
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        companyName: empProfile ? empProfile.companyName : '',
        logoUrl: empProfile ? empProfile.logoUrl : '',
        companyVerified: empProfile ? empProfile.isVerified : false,
      };
    });
  }
}

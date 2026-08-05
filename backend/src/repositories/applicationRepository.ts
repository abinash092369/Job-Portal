import { Application, IApplication } from '../models/Application';
import { User } from '../models/User';
import { CandidateProfile } from '../models/CandidateProfile';
import { Types } from 'mongoose';

export class ApplicationRepository {
  async create(data: Partial<IApplication>): Promise<IApplication> {
    const application = new Application(data);
    return application.save();
  }

  async findByJobAndCandidate(
    jobId: string,
    candidateId: string
  ): Promise<IApplication | null> {
    return Application.findOne({
      jobId: new Types.ObjectId(jobId),
      candidateId: new Types.ObjectId(candidateId),
    });
  }

  async getApplicationsForJob(jobId: string): Promise<any[]> {
    const rawApps = await Application.find({
      jobId: new Types.ObjectId(jobId),
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!rawApps || rawApps.length === 0) return [];

    const candidateIds = [...new Set(rawApps.map((a) => a.candidateId.toString()))];

    const users = await User.find({ _id: { $in: candidateIds } }).lean();
    const profiles = await CandidateProfile.find({
      userId: { $in: candidateIds },
    }).lean();

    const userMap = new Map<string, any>();
    users.forEach((u) => userMap.set(u._id.toString(), u));

    const profileMap = new Map<string, any>();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    return rawApps.map((app) => {
      const candidateUser = userMap.get(app.candidateId.toString());
      const candidateProf = profileMap.get(app.candidateId.toString());

      return {
        id: app._id.toString(),
        jobId: app.jobId.toString(),
        candidateId: app.candidateId.toString(),
        resumeUrl: app.resumeUrl,
        coverLetter: app.coverLetter,
        screeningAnswers: app.screeningAnswers || [],
        status: app.status,
        notes: app.notes || [],
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        candidateName: candidateProf ? candidateProf.name : 'Candidate',
        candidateEmail: candidateUser ? candidateUser.email : '',
        candidateSkills: candidateProf ? candidateProf.skills : [],
        candidatePhotoUrl: candidateProf ? candidateProf.profilePhotoUrl : '',
      };
    });
  }
}

import { Application } from '../../types/application';
import { ApplicationRepository } from '../application.repository';
import { ApplicationModel, IApplicationDocument } from '../../models/application.model';
import { UserModel } from '../../models/user.model';
import { CandidateProfileModel } from '../../models/profile.model';
import mongoose from 'mongoose';


function mapApplication(doc: IApplicationDocument): Application {
  return {
    id: doc._id.toString(),
    jobId: doc.jobId.toString(),
    candidateId: doc.candidateId.toString(),
    resumeUrl: doc.resumeUrl,
    coverLetter: doc.coverLetter || '',
    screeningAnswers: doc.screeningAnswers || [],
    status: doc.status,
    notes: doc.notes || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function enrichApplication(app: Application): Promise<Application> {
  try {
    const user = await UserModel.findById(app.candidateId);
    if (user) {
      app.candidateEmail = user.email;
    }
    const profile = await CandidateProfileModel.findOne({ userId: app.candidateId });
    if (profile) {
      app.candidateName = profile.name;
      app.candidateSkills = profile.skills || [];
      app.candidatePhotoUrl = profile.profilePhotoUrl || '';
    } else {
      app.candidateName = app.candidateEmail ? app.candidateEmail.split('@')[0] : 'Candidate';
      app.candidateSkills = [];
      app.candidatePhotoUrl = '';
    }
  } catch (error) {
    app.candidateName = 'Candidate';
    app.candidateSkills = [];
    app.candidatePhotoUrl = '';
  }
  return app;
}

async function enrichApplications(apps: Application[]): Promise<Application[]> {
  await Promise.all(apps.map(enrichApplication));
  return apps;
}

export class MongooseApplicationRepository implements ApplicationRepository {
  async findById(id: string): Promise<Application | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const app = await ApplicationModel.findById(id);
    return app ? enrichApplication(mapApplication(app)) : null;
  }

  async findByJobId(jobId: string): Promise<Application[]> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) return [];
    const apps = await ApplicationModel.find({ jobId }).sort({ createdAt: -1 });
    return enrichApplications(apps.map(mapApplication));
  }

  async findByCandidateAndJob(candidateId: string, jobId: string): Promise<Application | null> {
    if (!mongoose.Types.ObjectId.isValid(candidateId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return null;
    }
    const app = await ApplicationModel.findOne({ candidateId, jobId });
    return app ? enrichApplication(mapApplication(app)) : null;
  }

  async findByCandidate(candidateId: string): Promise<Application[]> {
    if (!mongoose.Types.ObjectId.isValid(candidateId)) return [];
    const apps = await ApplicationModel.find({ candidateId }).sort({ createdAt: -1 });
    return enrichApplications(apps.map(mapApplication));
  }

  async create(applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
    const app = new ApplicationModel({
      ...applicationData,
      statusHistory: [
        {
          status: applicationData.status || 'applied',
          changedAt: new Date(),
        },
      ],
    });
    await app.save();

    return enrichApplication(mapApplication(app));
  }


  async update(
    id: string,
    updates: Partial<Omit<Application, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Application | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const currentApp = await ApplicationModel.findById(id);
    if (!currentApp) return null;

    const finalUpdates: any = { ...updates };


    const updateQuery: any = { $set: finalUpdates };

    // If status is updated and it is different from the current status, append to statusHistory
    if (updates.status && updates.status !== currentApp.status) {
      updateQuery.$push = {
        statusHistory: {
          status: updates.status,
          changedAt: new Date(),
        },
      };
    }

    const app = await ApplicationModel.findByIdAndUpdate(id, updateQuery, { new: true });
    return app ? enrichApplication(mapApplication(app)) : null;
  }

  async findAll(): Promise<Application[]> {
    const apps = await ApplicationModel.find().sort({ createdAt: -1 });
    return enrichApplications(apps.map(mapApplication));
  }
}

export const applicationRepository = new MongooseApplicationRepository();

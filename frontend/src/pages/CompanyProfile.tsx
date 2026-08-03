import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { EmployerProfile, Job } from '../types';
import { Globe, Building, Users, ShieldCheck, ArrowLeft, MapPin } from 'lucide-react';
import { JobCardSkeleton } from '../components/Skeletons';

export const CompanyProfile: React.FC = () => {
  const { id: userId } = useParams<{ id: string }>();

  // Fetch company profile publicly
  const { data: profile, isLoading: loadingProfile, error: profileError } = useQuery<EmployerProfile>({
    queryKey: ['publicCompanyProfile', userId],
    queryFn: async () => {
      const res = await api.get(`/profile/employer/${userId}`);
      return res.data.data;
    },
    enabled: !!userId,
  });

  // Fetch open jobs posted by this company
  const { data: jobsData, isLoading: loadingJobs } = useQuery<{ jobs: Job[] }>({
    queryKey: ['companyJobs', userId],
    queryFn: async () => {
      const res = await api.get('/jobs', { params: { employerId: userId, limit: 10 } });
      return res.data.data;
    },
    enabled: !!userId,
  });

  const jobs = jobsData?.jobs || [];

  if (loadingProfile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 animate-pulse space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 h-40"></div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 h-64"></div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4 min-h-[70vh] flex flex-col justify-center">
        <h2 className="text-xl font-bold text-slate-800">Company profile not found</h2>
        <p className="text-sm text-slate-500">The organization details you are looking for do not exist.</p>
        <Link to="/jobs" className="text-sm font-semibold text-primary hover:underline">
          Back to job directory
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-8">
      
      {/* Back button */}
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to listings
      </Link>

      {/* Hero Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-premium space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={profile.companyName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain border border-slate-100 bg-slate-50 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-50 text-primary font-bold flex items-center justify-center text-2xl shrink-0">
                {profile.companyName.substring(0, 2).toUpperCase()}
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-none">{profile.companyName}</h1>
                {profile.isVerified && (
                  <span title="Verified employer"><ShieldCheck className="w-5 h-5 text-success fill-success/10 shrink-0" /></span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                {profile.industry && (
                  <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {profile.industry}</span>
                )}
                {profile.companySize && (
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {profile.companySize}</span>
                )}
              </div>
            </div>
          </div>

          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 shrink-0"
            >
              <Globe className="w-4 h-4" />
              Visit Website
            </a>
          )}
        </div>

        {/* Company Description */}
        {profile.description && (
          <div className="space-y-2 border-t border-slate-50 pt-6">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">About the Company</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{profile.description}</p>
          </div>
        )}
      </div>

      {/* Open Positions Grid */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-800 pl-1">Open Positions ({jobs.length})</h2>

        {loadingJobs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-12 text-center text-slate-500 text-xs">
            There are currently no active job listings for this company.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex flex-col justify-between hover-lift relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-indigo-50 text-primary">
                      {job.jobType}
                    </span>
                    <span className="text-[10px] text-slate-400">{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>

                  <Link to={`/jobs/${job.id}`} className="block group">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {job.description}
                    </p>
                  </Link>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {job.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-50 px-2 py-0.5 rounded-md text-slate-500 font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location}</span>
                  </div>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

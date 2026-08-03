import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { CandidateDashboard, Job } from '../../types';
import { useToastStore } from '../../context/toastStore';
import { Briefcase, Bookmark, Award, FileText, Eye, Trash2, ArrowRight } from 'lucide-react';
import { DashboardSkeleton } from '../../components/Skeletons';
import { ApplicationStatusBadge } from '../../components/ApplicationStatusBadge';

export const CandidateDashboardPage: React.FC = () => {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  // Fetch Candidate Dashboard Details
  const { data, isLoading } = useQuery<CandidateDashboard>({
    queryKey: ['candidateDashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/candidate');
      return res.data.data;
    },
  });

  // Fetch Candidate Profile (to get skills for recommendations)
  const { data: profile } = useQuery({
    queryKey: ['candidateProfile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data.data;
    },
  });

  // Fetch Recommended Jobs (active jobs matching skills)
  const { data: recommendedData, isLoading: loadingRecs } = useQuery<{ jobs: Job[] }>({
    queryKey: ['recommendedJobs', profile?.skills],
    queryFn: async () => {
      const skills = profile?.skills || [];
      const params: any = { limit: 3 };
      if (skills.length > 0) {
        params.search = skills[0]; // Query matching first skill
      }
      const res = await api.get('/jobs', { params });
      return res.data.data;
    },
    enabled: !!profile,
  });

  const unsaveMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await api.post(`/jobs/${jobId}/unsave`);
    },
    onSuccess: () => {
      addToast('Job removed from saved list', 'success');
      queryClient.invalidateQueries({ queryKey: ['candidateDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
    onError: () => {
      addToast('Failed to unsave job', 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background">
        <DashboardSkeleton />
      </div>
    );
  }

  const appliedJobs = data?.appliedJobs || [];
  const savedJobs = data?.savedJobs || [];
  const completeness = data?.profileCompleteness || 0;
  const recommendedJobs = recommendedData?.jobs || [];



  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-8 animate-fade-in">
      
      {/* 1. Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 sm:p-8 rounded-2xl text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25"></div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Candidate Dashboard</h1>
          <p className="text-slate-400 text-xs font-medium">Monitor your applications, manage saved jobs, and look for roles matching your stack.</p>
        </div>
        <Link
          to="/candidate/profile"
          className="relative z-10 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-all hover-lift shrink-0"
        >
          Edit Profile Summary
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2/3: Applications & Bookmarks */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Applications list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Live Job Applications ({appliedJobs.length})
              </h2>
              <Link to="/candidate/applications" className="text-xs font-semibold text-primary hover:underline">
                View detailed list
              </Link>
            </div>

            {appliedJobs.length === 0 ? (
              <div className="border border-dashed border-slate-200 p-12 text-center rounded-xl space-y-3">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">You haven't submitted any job applications yet.</p>
                <Link to="/jobs" className="inline-block text-xs font-bold text-primary hover:underline">
                  Browse open positions
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {appliedJobs.slice(0, 4).map((app) => (
                  <div key={app.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                    <div className="space-y-1 pr-4">
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{app.jobTitle}</h3>
                      <p className="text-xs text-slate-400 font-medium">{app.companyName}</p>
                      <span className="text-[10px] text-slate-400 block">Applied on {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                    
                    <ApplicationStatusBadge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookmarked / Saved Jobs */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-primary" />
                Saved Positions ({savedJobs.length})
              </h2>
              <Link to="/candidate/saved" className="text-xs font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>

            {savedJobs.length === 0 ? (
              <div className="border border-dashed border-slate-200 p-12 text-center rounded-xl space-y-3">
                <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">You haven't bookmarked any jobs yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {savedJobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                    <div className="space-y-1 pr-4">
                      <Link to={`/jobs/${job.id}`} className="text-sm font-bold text-slate-800 hover:text-primary transition-colors line-clamp-1 block">
                        {job.title}
                      </Link>
                      <p className="text-xs text-slate-400 font-medium">{job.companyName}</p>
                      <span className="text-xs font-bold text-slate-600 block mt-1">{job.salaryRange}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="p-2 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => unsaveMutation.mutate(job.id)}
                        className="p-2 border border-slate-200 text-error rounded-xl hover:bg-rose-50 hover:border-error/20 transition-colors"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1/3: Profile Completeness Meter & Recommendations */}
        <div className="space-y-8">
          
          {/* ProfileCompleteness Meter */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800">Profile Completeness</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Setup Progress</span>
                <span>{completeness}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-primary rounded-full h-3 transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                ></div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Completing your profile adds details like resumes, headline parameters, phone numbers, and experience histories, increasing response rates by 3x.
            </p>

            <Link
              to="/candidate/profile"
              className="w-full py-2.5 text-center bg-indigo-50/50 hover:bg-indigo-50 border border-primary/20 text-primary font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              Complete Profile Settings
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Recommendations List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary animate-pulse" />
              Recommended Roles
            </h2>

            {loadingRecs ? (
              <div className="space-y-4">
                <div className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                <div className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
              </div>
            ) : recommendedJobs.length === 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                Add skills in Profile settings to view customized matches.
              </p>
            ) : (
              <div className="space-y-4">
                {recommendedJobs.map((rec) => (
                  <div key={rec.id} className="p-3 border border-slate-100 rounded-xl shadow-sm space-y-2">
                    <span className="text-[10px] font-semibold text-slate-400 block">{rec.companyName}</span>
                    <Link
                      to={`/jobs/${rec.id}`}
                      className="text-xs font-bold text-slate-800 hover:text-primary transition-colors block line-clamp-1"
                    >
                      {rec.title}
                    </Link>
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>{rec.location}</span>
                      <span className="font-semibold text-primary">{rec.salaryRange}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

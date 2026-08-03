import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Job } from '../../types';
import { useToastStore } from '../../context/toastStore';
import { Bookmark, ArrowLeft, Eye, Trash2, ShieldCheck } from 'lucide-react';
import { JobCardSkeleton } from '../../components/Skeletons';

export const SavedJobs: React.FC = () => {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  // Fetch Saved Jobs
  const { data: savedJobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['savedJobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/saved');
      return res.data.data;
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await api.post(`/jobs/${jobId}/unsave`);
    },
    onSuccess: () => {
      addToast('Job removed from saved list', 'success');
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['candidateDashboard'] });
    },
    onError: () => {
      addToast('Failed to unsave job', 'error');
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-6 animate-fade-in">
      
      {/* Back button */}
      <Link to="/candidate/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="border-b border-slate-100 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">Saved Jobs</h1>
        <p className="text-slate-500 text-xs mt-1">Keep track of positions you want to apply to later.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-16 text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-primary mx-auto">
            <Bookmark className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No saved jobs</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            You haven't bookmarked any positions yet. Look through our job board to save jobs you like!
          </p>
          <Link
            to="/jobs"
            className="inline-block text-xs font-bold text-white bg-primary px-4 py-2 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex flex-col justify-between hover-lift relative"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-indigo-50 text-primary">
                      {job.jobType}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="p-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => unsaveMutation.mutate(job.id)}
                      className="p-1.5 border border-slate-200 text-error rounded-lg hover:bg-rose-50 hover:border-error/20 transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <Link to={`/jobs/${job.id}`} className="block group">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-slate-600 font-semibold">{job.companyName}</span>
                    {job.companyVerified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-success fill-success/10" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {job.description}
                  </p>
                </Link>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{job.salaryRange}</span>
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                >
                  Apply Now &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

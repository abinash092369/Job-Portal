import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Job, EmployerDashboard } from '../../types';
import { useToastStore } from '../../context/toastStore';
import { Edit, Trash2, Ban, CheckCircle, ArrowLeft, PlusCircle, Users, Briefcase } from 'lucide-react';
import { JobCardSkeleton } from '../../components/Skeletons';

export const ManageJobs: React.FC = () => {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  // Fetch employer's own jobs
  const { data: jobs = [], isLoading: loadingJobs } = useQuery<Job[]>({
    queryKey: ['myJobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/my-jobs');
      return res.data.data;
    },
  });

  // Fetch dashboard stats (to map applicant counts per job)
  const { data: dashboard } = useQuery<EmployerDashboard>({
    queryKey: ['employerDashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/employer');
      return res.data.data;
    },
  });

  const applicantCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (dashboard?.applicantsPerJob) {
      dashboard.applicantsPerJob.forEach((item) => {
        map[item.jobId] = item.applicantCount;
      });
    }
    return map;
  }, [dashboard]);

  // Publish Job Mutation
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/jobs/${id}/publish`);
    },
    onSuccess: () => {
      addToast('Job posting published and live!', 'success');
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['employerDashboard'] });
    },
    onError: () => addToast('Failed to publish job', 'error'),
  });

  // Unpublish (save as draft) Mutation
  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/jobs/${id}/unpublish`);
    },
    onSuccess: () => {
      addToast('Job reverted to draft status', 'info');
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['employerDashboard'] });
    },
    onError: () => addToast('Failed to unpublish job', 'error'),
  });

  // Close Job Mutation
  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/jobs/${id}`, { status: 'closed' });
    },
    onSuccess: () => {
      addToast('Job posting closed for applications', 'info');
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['employerDashboard'] });
    },
    onError: () => addToast('Failed to close job', 'error'),
  });

  // Delete Job Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/${id}`);
    },
    onSuccess: () => {
      addToast('Job posting deleted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['employerDashboard'] });
    },
    onError: () => addToast('Failed to delete job', 'error'),
  });

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this job posting? This action cannot be undone and will delete all applicants associated with it.')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-success border-emerald-100';
      case 'draft':
        return 'bg-slate-50 text-slate-600 border-slate-100';
      case 'closed':
        return 'bg-rose-50 text-error border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-6 animate-fade-in">
      
      {/* Back to dashboard */}
      <Link to="/employer/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">Manage Listings</h1>
          <p className="text-slate-500 text-xs mt-1">Review active, draft, and closed positions posted by your organization.</p>
        </div>

        <Link
          to="/employer/jobs/new"
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-all hover-lift flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Post a Job opening
        </Link>
      </div>

      {loadingJobs ? (
        <div className="space-y-4">
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-16 text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-primary mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No job postings created</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            You haven't posted any jobs yet. Create a listing to start accepting developer resumes!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase">
                  <th className="px-6 py-4 font-semibold">Job Title</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Views</th>
                  <th className="px-6 py-4 font-semibold">Applicants</th>
                  <th className="px-6 py-4 font-semibold">Expiry Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {jobs.map((job) => {
                  const applicantCount = applicantCounts[job.id] || 0;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/30 group">
                      <td className="px-6 py-4.5 font-bold text-slate-800">
                        <Link to={`/jobs/${job.id}`} className="hover:text-primary transition-colors">
                          {job.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`text-[9px] font-bold border px-2.5 py-0.5 rounded-full uppercase ${getStatusStyle(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-slate-500 font-medium">{job.views}</td>
                      <td className="px-6 py-4.5">
                        <Link
                          to={`/employer/jobs/${job.id}/applications`}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-primary transition-colors font-bold"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {applicantCount} candidates
                        </Link>
                      </td>
                      <td className="px-6 py-4.5 text-slate-400">
                        {new Date(job.applicationDeadline).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-1.5">
                        {/* Status Controls */}
                        {job.status === 'draft' && (
                          <button
                            onClick={() => publishMutation.mutate(job.id)}
                            className="p-1.5 border border-slate-200 rounded-lg text-success hover:bg-emerald-50 transition-colors inline-flex"
                            title="Publish job live"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {job.status === 'active' && (
                          <button
                            onClick={() => unpublishMutation.mutate(job.id)}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors inline-flex"
                            title="Revert to Draft"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {job.status !== 'closed' && (
                          <button
                            onClick={() => closeMutation.mutate(job.id)}
                            className="p-1.5 border border-slate-200 rounded-lg text-error hover:bg-rose-50 transition-colors inline-flex"
                            title="Close applications"
                          >
                            <Ban className="w-4 h-4 text-error" />
                          </button>
                        )}

                        {/* Edit Control */}
                        <Link
                          to={`/employer/jobs/edit/${job.id}`}
                          className="p-1.5 border border-slate-200 rounded-lg text-primary hover:bg-indigo-50 transition-colors inline-flex"
                          title="Edit job info"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Delete Control */}
                        <button
                          onClick={() => handleDeleteClick(job.id)}
                          className="p-1.5 border border-slate-200 rounded-lg text-error hover:bg-rose-50 hover:border-error/25 transition-colors inline-flex"
                          title="Delete job post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

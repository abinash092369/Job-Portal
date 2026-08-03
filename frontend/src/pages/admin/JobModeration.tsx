import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToastStore } from '../../context/toastStore';
import type { Job } from '../../types';
import { Search, Ban, CheckCircle, Trash2, ArrowLeft, ChevronLeft, ChevronRight, Eye, RefreshCw, Briefcase } from 'lucide-react';
import { JobCardSkeleton } from '../../components/Skeletons';

export const JobModeration: React.FC = () => {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all jobs for moderation (admin endpoint)
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['adminJobs'],
    queryFn: async () => {
      const res = await api.get('/admin/jobs');
      return res.data.data;
    },
  });

  // Moderate job status mutation
  const moderateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'active' | 'closed' }) => {
      const res = await api.patch(`/admin/jobs/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: (data) => {
      addToast(`Job posting status updated to ${data.status}!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update job status';
      addToast(msg, 'error');
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/jobs/${id}`);
      return id;
    },
    onSuccess: () => {
      addToast('Job posting deleted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to delete job posting';
      addToast(msg, 'error');
    },
  });

  const handleModerateClick = (job: Job, newStatus: 'draft' | 'active' | 'closed') => {
    if (window.confirm(`Are you sure you want to change job status to "${newStatus}" for "${job.title}"?`)) {
      moderateStatusMutation.mutate({ id: job.id, status: newStatus });
    }
  };

  const handleDeleteClick = (job: Job) => {
    if (window.confirm(`Are you sure you want to permanently delete job posting "${job.title}"? This action cannot be undone and will delete all applicants associated with it.`)) {
      deleteJobMutation.mutate(job.id);
    }
  };

  // Filtered jobs calculation
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (job.companyName && job.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, selectedStatus]);

  // Paginated jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredJobs, currentPage]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

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
      
      {/* Back button */}
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">Job Listing Moderation</h1>
          <p className="text-slate-500 text-xs mt-1">Review active openings, closed listings, and draft postings. Set status to approve, flag, or delete posts.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <input
            type="text"
            placeholder="Search by job title or employer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white input-focus"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-40 py-2.5 px-3 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-600 focus:bg-white input-focus focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-16 text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-primary mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No job postings found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Try adjusting your search query or status filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase">
                  <th className="px-6 py-4 font-semibold">Job Title</th>
                  <th className="px-6 py-4 font-semibold">Employer / Company</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Posted Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/30 group">
                    <td className="px-6 py-4.5 font-bold text-slate-800">
                      <Link to={`/jobs/${job.id}`} className="hover:text-primary transition-colors inline-flex items-center gap-1">
                        {job.title}
                        <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors ml-1 opacity-0 group-hover:opacity-100" />
                      </Link>
                    </td>

                    <td className="px-6 py-4.5 text-slate-600 font-medium">
                      {job.companyName || 'Unknown Company'}
                    </td>
                    
                    <td className="px-6 py-4.5">
                      <span className={`text-[9px] font-bold border px-2.5 py-0.5 rounded-full uppercase ${getStatusStyle(job.status)}`}>
                        {job.status}
                      </span>
                    </td>

                    <td className="px-6 py-4.5 text-slate-500 font-medium">
                      {new Date(job.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-6 py-4.5 text-right space-x-1.5 shrink-0">
                      {/* Moderate status buttons */}
                      {job.status !== 'active' && (
                        <button
                          onClick={() => handleModerateClick(job, 'active')}
                          className="p-1.5 border border-slate-200 rounded-lg text-success hover:bg-emerald-50 transition-colors inline-flex"
                          title="Approve & Publish Live"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {job.status === 'active' && (
                        <button
                          onClick={() => handleModerateClick(job, 'closed')}
                          className="p-1.5 border border-slate-200 rounded-lg text-error hover:bg-rose-50 transition-colors inline-flex"
                          title="Flag & Close Posting"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      {job.status === 'closed' && (
                        <button
                          onClick={() => handleModerateClick(job, 'draft')}
                          className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors inline-flex"
                          title="Revert to Draft"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}

                      {/* Hard delete action */}
                      <button
                        onClick={() => handleDeleteClick(job)}
                        className="p-1.5 border border-slate-200 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors inline-flex"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <span className="text-xs text-slate-500">
                Showing Page <span className="font-bold text-slate-700">{currentPage}</span> of <span className="font-bold text-slate-700">{totalPages}</span> ({filteredJobs.length} total jobs)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

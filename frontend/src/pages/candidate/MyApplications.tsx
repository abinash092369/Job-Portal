import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { CandidateDashboard } from '../../types';
import { FileText, ArrowLeft } from 'lucide-react';
import { JobCardSkeleton } from '../../components/Skeletons';
import { ApplicationStatusBadge } from '../../components/ApplicationStatusBadge';

export const MyApplications: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch candidate dashboard to get applications list
  const { data, isLoading } = useQuery<CandidateDashboard>({
    queryKey: ['candidateDashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/candidate');
      return res.data.data;
    },
  });

  const appliedJobs = data?.appliedJobs || [];

  const filteredJobs = appliedJobs.filter((app) => {
    if (filterStatus === 'all') return true;
    return app.status.toLowerCase() === filterStatus.toLowerCase();
  });



  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-6 animate-fade-in">
      
      {/* Back button */}
      <Link to="/candidate/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">My Applications</h1>
          <p className="text-slate-500 text-xs mt-1">Track the live progress of all jobs you have applied to.</p>
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2 input-focus cursor-pointer shrink-0"
        >
          <option value="all">Filter by: All Statuses</option>
          <option value="applied">Applied</option>
          <option value="reviewed">Reviewed</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interviewing</option>
          <option value="rejected">Rejected</option>
          <option value="hired">Hired</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-16 text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-primary mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No applications found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            There are no applications matching the selected status. Browse jobs and start applying!
          </p>
          <Link
            to="/jobs"
            className="inline-block text-xs font-bold text-white bg-primary px-4 py-2 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Find Jobs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((app) => (
            <div
              key={app.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-premium hover-lift flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="space-y-1">
                <Link
                  to={`/jobs/${app.jobId}`}
                  className="text-sm font-bold text-slate-800 hover:text-primary transition-colors leading-tight"
                >
                  {app.jobTitle}
                </Link>
                <p className="text-xs text-slate-400 font-semibold">{app.companyName}</p>
                <p className="text-[10px] text-slate-400 font-normal">
                  Applied on {new Date(app.appliedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                <ApplicationStatusBadge status={app.status} />
                <Link
                  to={`/jobs/${app.jobId}`}
                  className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                >
                  View Job Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { EmployerDashboard } from '../../types';
import { Briefcase, Users, PlusCircle, FileText, UserCheck, Calendar } from 'lucide-react';
import { DashboardSkeleton } from '../../components/Skeletons';
import { ApplicationStatusBadge } from '../../components/ApplicationStatusBadge';

export const EmployerDashboardPage: React.FC = () => {
  // Fetch Employer Dashboard details
  const { data, isLoading } = useQuery<EmployerDashboard>({
    queryKey: ['employerDashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/employer');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background">
        <DashboardSkeleton />
      </div>
    );
  }

  const activeJobs = data?.activeJobsCount || 0;
  const totalApps = data?.totalApplicants || 0;
  const activity = data?.recentActivity || [];
  const distribution = data?.applicantsPerJob || [];



  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-8 animate-fade-in">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 sm:p-8 rounded-2xl text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25"></div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Employer Hub</h1>
          <p className="text-slate-400 text-xs font-medium">Manage your company listings, trace candidate updates, and review profiles.</p>
        </div>
        <Link
          to="/employer/jobs/new"
          className="relative z-10 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-all hover-lift flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Post a Job opening
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Job Posts</span>
            <p className="text-3xl font-extrabold text-slate-800">{activeJobs}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-primary rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Applicants</span>
            <p className="text-3xl font-extrabold text-slate-800">{totalApps}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-success rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Application Rate</span>
            <p className="text-3xl font-extrabold text-slate-800">
              {activeJobs > 0 ? (totalApps / activeJobs).toFixed(1) : 0}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-accent rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Activity (Table/list) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Application Activity
              </h2>
            </div>

            {activity.length === 0 ? (
              <div className="border border-dashed border-slate-200 p-12 text-center rounded-xl text-slate-500 text-xs">
                No recent applicant activity found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                      <th className="pb-3 font-semibold">Candidate</th>
                      <th className="pb-3 font-semibold">Job Title</th>
                      <th className="pb-3 font-semibold">Stage</th>
                      <th className="pb-3 font-semibold">Applied Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {activity.map((act) => (
                      <tr key={act.id} className="group hover:bg-slate-50/50">
                        <td className="py-3.5 font-bold text-slate-800">{act.candidateName}</td>
                        <td className="py-3.5 text-slate-600">
                          <Link to={`/employer/jobs/${act.jobId}/applications`} className="hover:text-primary transition-colors hover:underline">
                            {act.jobTitle}
                          </Link>
                        </td>
                        <td className="py-3.5">
                          <ApplicationStatusBadge status={act.status} />
                        </td>
                        <td className="py-3.5 text-slate-400">
                          {new Date(act.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Applicants per Job distribution */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Applicants distribution
            </h2>

            {distribution.length === 0 ? (
              <p className="text-xs text-slate-400">No postings created yet.</p>
            ) : (
              <div className="space-y-4">
                {distribution.map((dist) => (
                  <div key={dist.jobId} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <Link
                        to={`/employer/jobs/${dist.jobId}/applications`}
                        className="font-bold text-slate-700 hover:text-primary transition-all truncate max-w-[170px]"
                      >
                        {dist.jobTitle}
                      </Link>
                      <span className="font-semibold text-slate-500 shrink-0">{dist.applicantCount} applicants</span>
                    </div>
                    {/* Visual Bar representation */}
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{
                          width: `${totalApps > 0 ? (dist.applicantCount / totalApps) * 100 : 0}%`,
                        }}
                      ></div>
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

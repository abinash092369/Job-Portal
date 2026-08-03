import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Briefcase, Users, FileText, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { DashboardSkeleton } from '../../components/Skeletons';

interface PlatformStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  breakdownByRole: {
    candidate: number;
    employer: number;
    admin: number;
  };
}

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
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

  const totalUsers = stats?.totalUsers || 0;
  const totalJobs = stats?.totalJobs || 0;
  const totalApplications = stats?.totalApplications || 0;
  const breakdown = stats?.breakdownByRole || { candidate: 0, employer: 0, admin: 0 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-8 animate-fade-in">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 sm:p-8 rounded-2xl text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25"></div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Control Center</h1>
          <p className="text-slate-400 text-xs font-medium">Monitor system statistics, moderate jobs, manage user accounts, and enforce guidelines.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registered Users</span>
            <p className="text-3xl font-extrabold text-slate-800">{totalUsers}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-primary rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Job Openings</span>
            <p className="text-3xl font-extrabold text-slate-800">{totalJobs}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-success rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Submitted Applications</span>
            <p className="text-3xl font-extrabold text-slate-800">{totalApplications}</p>
          </div>
          <div className="p-3 bg-amber-50 text-accent rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick moderation tools */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-800">Quick Moderation Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                to="/admin/users" 
                className="flex items-start gap-4 p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all hover-lift group"
              >
                <div className="p-2.5 bg-indigo-50 text-primary rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">Manage Platform Users</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Suspend accounts, verify employer companies, search registrations, and filter by user roles.</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary pt-2 group-hover:gap-2 transition-all">
                    Go to Users <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>

              <Link 
                to="/admin/jobs" 
                className="flex items-start gap-4 p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all hover-lift group"
              >
                <div className="p-2.5 bg-emerald-50 text-success rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-success transition-colors">Moderate Job Listings</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Review active job posts, drafts, and closed positions. Approve status, flag posts, or perform administrative deletions.</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success pt-2 group-hover:gap-2 transition-all">
                    Go to Jobs <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* User Breakdown Stats Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-800">User Role Distribution</h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Candidates</span>
                  <span className="text-slate-800">{breakdown.candidate} ({totalUsers > 0 ? ((breakdown.candidate / totalUsers) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-500" 
                    style={{ width: `${totalUsers > 0 ? (breakdown.candidate / totalUsers) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Employers</span>
                  <span className="text-slate-800">{breakdown.employer} ({totalUsers > 0 ? ((breakdown.employer / totalUsers) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${totalUsers > 0 ? (breakdown.employer / totalUsers) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Administrators</span>
                  <span className="text-slate-800">{breakdown.admin} ({totalUsers > 0 ? ((breakdown.admin / totalUsers) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${totalUsers > 0 ? (breakdown.admin / totalUsers) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-primary uppercase">
                {breakdown.candidate} Candidate{breakdown.candidate !== 1 && 's'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                {breakdown.employer} Employer{breakdown.employer !== 1 && 's'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 uppercase">
                {breakdown.admin} Admin{breakdown.admin !== 1 && 's'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

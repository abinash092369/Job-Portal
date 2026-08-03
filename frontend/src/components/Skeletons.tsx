import React from 'react';

export const JobCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium animate-pulse space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-slate-200 rounded-lg w-2/3"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-1/3"></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <div className="h-6 bg-slate-200 rounded-lg w-20"></div>
        <div className="h-6 bg-slate-200 rounded-lg w-24"></div>
        <div className="h-6 bg-slate-200 rounded-lg w-16"></div>
      </div>
      <div className="border-t border-slate-50 pt-4 flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded-lg w-24"></div>
        <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
      </div>
    </div>
  );
};

export const JobDetailSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-premium space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl"></div>
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-slate-200 rounded-lg w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded-lg w-1/4"></div>
          </div>
        </div>
        <div className="flex gap-3 border-y border-slate-100 py-4">
          <div className="h-6 bg-slate-200 rounded-lg w-24"></div>
          <div className="h-6 bg-slate-200 rounded-lg w-24"></div>
          <div className="h-6 bg-slate-200 rounded-lg w-24"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 rounded-lg w-full"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-5/6"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-2/3"></div>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-premium space-y-4">
        <div className="h-5 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded-lg w-full"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-full"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-4/5"></div>
        </div>
      </div>
    </div>
  );
};

export const CandidateCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-premium animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded-lg w-20"></div>
        <div className="h-4 bg-slate-200 rounded-lg w-12"></div>
      </div>
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded-lg w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded-lg w-1/2"></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        <div className="h-5 bg-slate-200 rounded-lg w-12"></div>
        <div className="h-5 bg-slate-200 rounded-lg w-14"></div>
        <div className="h-5 bg-slate-200 rounded-lg w-16"></div>
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium h-32"></div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium h-32"></div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium h-32"></div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium h-64"></div>
    </div>
  );
};

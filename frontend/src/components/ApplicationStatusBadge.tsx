import React from 'react';
import type { ApplicationStatus } from '../types';


interface ApplicationStatusBadgeProps {
  status: ApplicationStatus | string;
}

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({ status }) => {
  const getStatusBadgeStyle = (statusStr: string) => {
    switch (statusStr.toLowerCase()) {
      case 'applied':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'reviewed':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'shortlisted':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'interview':
        return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'rejected':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'hired':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <span
      data-testid="status-badge"
      className={`text-[10px] font-bold border px-2.5 py-1 rounded-full uppercase shrink-0 ${getStatusBadgeStyle(
        status
      )}`}
    >
      {status}
    </span>
  );
};

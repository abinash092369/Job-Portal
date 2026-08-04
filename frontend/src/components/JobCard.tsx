import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import type { Job } from '../types';
import { getMediaUrl } from '../utils/url';

interface JobCardProps {
  job: Job;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  return (
    <div
      data-testid={`job-card-${job.id}`}
      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex flex-col justify-between hover-lift relative"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {job.logoUrl ? (
              <img
                src={getMediaUrl(job.logoUrl)}
                alt={job.companyName || 'Company logo'}
                className="w-10 h-10 rounded-xl object-contain border border-slate-100 bg-slate-50 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-primary font-bold flex items-center justify-center shrink-0">
                {(job.companyName || 'CO').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <Link
                  to={`/company/${job.employerId}`}
                  className="text-xs font-semibold text-slate-700 hover:text-primary hover:underline transition-all"
                >
                  {job.companyName || 'Unknown Company'}
                </Link>
                {job.companyVerified && (
                  <span title="Verified employer" data-testid="verified-badge">
                    <ShieldCheck className="w-3.5 h-3.5 text-success fill-success/10 shrink-0" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">{job.location}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize bg-indigo-50 text-primary shrink-0">
            {job.jobType}
          </span>
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
          {job.skills.slice(0, 4).map((skill, idx) => (
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
        <span className="text-xs font-bold text-slate-700">{job.salaryRange}</span>
        <Link
          to={`/jobs/${job.id}`}
          className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
        >
          Apply Now &rarr;
        </Link>
      </div>
    </div>
  );
};

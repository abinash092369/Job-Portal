import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-premium">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Job<span className="text-primary-light text-primary">Portal</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              Connecting exceptional developers with matching employers. Find remote, full-time, or contract positions at top technology startups globally.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="GitHub">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Find Opportunities</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/jobs?jobType=remote" className="text-xs hover:text-white transition-colors">Remote Jobs</Link>
              </li>
              <li>
                <Link to="/jobs?jobType=full-time" className="text-xs hover:text-white transition-colors">Full-time Jobs</Link>
              </li>
              <li>
                <Link to="/jobs?experienceLevel=entry" className="text-xs hover:text-white transition-colors">Entry Level Jobs</Link>
              </li>
              <li>
                <Link to="/jobs" className="text-xs hover:text-white transition-colors">All job categories</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">For Employers</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/employer/jobs/new" className="text-xs hover:text-white transition-colors">Post a Job opening</Link>
              </li>
              <li>
                <Link to="/employer/dashboard" className="text-xs hover:text-white transition-colors">Employer Hub</Link>
              </li>
              <li>
                <Link to="/login" className="text-xs hover:text-white transition-colors">Pricing & Billing</Link>
              </li>
              <li>
                <Link to="/jobs" className="text-xs hover:text-white transition-colors">Talent Acquisition</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Resources</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className="text-xs hover:text-white transition-colors">Blog & Career advice</a>
              </li>
              <li>
                <a href="#" className="text-xs hover:text-white transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-xs hover:text-white transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-xs hover:text-white transition-colors">Support Center</a>
              </li>
            </ul>
          </div>

        </div>
        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} JobPortal Inc. All rights reserved.
          </p>
          <p className="text-[10px] text-slate-600">
            Built using React, TypeScript, TanStack Query, and Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
};

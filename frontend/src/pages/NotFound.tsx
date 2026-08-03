import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-6 text-center animate-fade-in">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-primary mx-auto">
          <Briefcase className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold text-primary">404</h1>
          <h2 className="text-2xl font-bold text-slate-800">Page not found</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex justify-center items-center gap-2 py-2.5 px-6 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-all hover-lift shadow-premium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

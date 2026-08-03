import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Job } from '../types';
import { Search, MapPin, Briefcase, ArrowRight, Star, TrendingUp, Users, Building } from 'lucide-react';

import { JobCardSkeleton } from '../components/Skeletons';
import { JobCard } from '../components/JobCard';

const categories = [
  { name: 'Software Engineering', count: '14,230', skills: 'React, Node.js' },
  { name: 'Data Science', count: '8,450', skills: 'Python, SQL' },
  { name: 'Product Management', count: '3,120', skills: 'Agile, Roadmap' },
  { name: 'Product Design', count: '4,560', skills: 'Figma, UI/UX' },
  { name: 'Marketing', count: '5,890', skills: 'SEO, Google Analytics' },
  { name: 'Sales', count: '7,110', skills: 'CRM, Negotiation' },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  // Fetch active jobs (page 1, limit 6 for homepage)
  const { data, isLoading } = useQuery<{ jobs: Job[]; total: number }>({
    queryKey: ['activeJobsHome'],
    queryFn: async () => {
      const res = await api.get('/jobs', { params: { page: 1, limit: 6 } });
      return res.data.data;
    },
  });

  const featuredJobs = data?.jobs || [];
  const totalJobsCount = data?.total || 24;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (locationQuery.trim()) params.append('location', locationQuery.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="space-y-20 pb-20 bg-background">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-20 lg:py-28 text-white">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 text-center max-w-4xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-light text-primary border border-primary/30">
            <TrendingUp className="w-3.5 h-3.5" />
            Discover your next career jump
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white font-sans leading-none">
            Find the perfect <span className="text-primary-light text-indigo-400">developer job</span> for your skills
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400 font-medium">
            Explore thousands of remote, full-time, and contract opportunities at startups, Fortune 500s, and high-growth technology companies.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto max-w-3xl bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 text-slate-800 border border-slate-100"
          >
            <div className="flex-1 flex items-center gap-2 px-3 border-b md:border-b-0 md:border-r border-slate-100 pb-2 md:pb-0">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Job title, keywords, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm outline-none bg-transparent py-2 placeholder-slate-400"
              />
            </div>
            
            <div className="flex-1 flex items-center gap-2 px-3 py-2 md:py-0">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Location (e.g. Remote, San Francisco)..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full text-sm outline-none bg-transparent py-2 placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-all hover-lift shrink-0"
            >
              Search Jobs
            </button>
          </form>

          {/* Core Stats */}
          <div className="pt-4 flex flex-wrap justify-center gap-8 text-xs text-slate-400 font-medium">
            <span>Popular: <span className="text-white">React</span>, <span className="text-white">Node.js</span>, <span className="text-white">Next.js</span>, <span className="text-white">TypeScript</span></span>
          </div>
        </div>
      </section>

      {/* 2. Platform Stats */}
      <section className="-mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-premium grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-center gap-y-6 md:gap-y-0">
          <div className="md:px-4 py-2">
            <div className="flex justify-center text-primary mb-2">
              <Briefcase className="w-8 h-8" />
            </div>
            <p className="text-3xl font-extrabold text-slate-800">{totalJobsCount * 12}+</p>
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mt-1">Active Job Listings</p>
          </div>
          <div className="md:px-4 py-2">
            <div className="flex justify-center text-primary mb-2">
              <Building className="w-8 h-8" />
            </div>
            <p className="text-3xl font-extrabold text-slate-800">120+</p>
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mt-1">Verified Companies</p>
          </div>
          <div className="md:px-4 py-2">
            <div className="flex justify-center text-primary mb-2">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-3xl font-extrabold text-slate-800">4,500+</p>
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mt-1">Successful Matches</p>
          </div>
        </div>
      </section>

      {/* 3. Job Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Explore by Category</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">Explore high-paying roles categorized by functional technology domains.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              to={`/jobs?search=${encodeURIComponent(cat.name)}`}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium hover:border-primary/20 hover-lift flex flex-col justify-between h-40"
            >
              <div>
                <span className="text-sm font-bold text-slate-800 leading-tight block">{cat.name}</span>
                <span className="text-xs text-slate-400 mt-1 block">Skills: {cat.skills}</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-bold text-primary bg-indigo-50/50 px-2.5 py-1 rounded-lg">{cat.count} openings</span>
                <span className="text-slate-400 group-hover:text-primary transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Featured / Recent Jobs Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">Featured Job Openings</h2>
            <p className="text-slate-500 text-sm">Apply now to recently posted positions from vetted startups.</p>
          </div>
          <Link
            to="/jobs"
            className="text-sm font-semibold text-primary hover:text-primary-dark inline-flex items-center gap-1 hover:translate-x-0.5 transition-transform"
          >
            Browse all jobs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        ) : featuredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-premium">
            <p className="text-sm text-slate-500">No active job openings found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* 5. How It Works Section */}
      <section className="bg-slate-50 py-16 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">How JobPortal Works</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Get hired or find qualified builders in four simple steps.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
              <span className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto">1</span>
              <h3 className="text-sm font-bold text-slate-800">Create Account</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Register as a Candidate looking for jobs, or an Employer trying to recruit talent.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
              <span className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto">2</span>
              <h3 className="text-sm font-bold text-slate-800">Build Profile</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Upload your resume, add your skills, education history, and write a summary.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
              <span className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto">3</span>
              <h3 className="text-sm font-bold text-slate-800">Apply to Jobs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Filter opportunities based on your stack, answer screening questions, and submit cover letters.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
              <span className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto">4</span>
              <h3 className="text-sm font-bold text-slate-800">Get Hired</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Track application status live in your workspace and receive verified interview offers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">What Our Community Says</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">Hear from engineers who found remote careers via our portal.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium space-y-4">
            <div className="flex gap-1 text-accent">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              "Finding remote work was extremely hard until I discovered JobPortal. The stack-based filtering allowed me to match exactly with React roles, and I signed my offer in less than 2 weeks."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-indigo-50 rounded-full text-xs font-bold text-primary flex items-center justify-center shrink-0">JD</div>
              <div>
                <p className="text-xs font-bold text-slate-800">John Doe</p>
                <p className="text-[10px] text-slate-400">React Architect at CloudScale</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium space-y-4">
            <div className="flex gap-1 text-accent">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              "As an employer, managing applicants was previously a chaotic mess of emails. The Kanban tracking board allows us to slide candidates between interview stages seamlessly and trigger automatic notes."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-indigo-50 rounded-full text-xs font-bold text-primary flex items-center justify-center shrink-0">SC</div>
              <div>
                <p className="text-xs font-bold text-slate-800">Sarah Connor</p>
                <p className="text-[10px] text-slate-400">Head of Talent at InnovateTech</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium space-y-4">
            <div className="flex gap-1 text-accent">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              "The token-refresh mechanics make the platform extremely robust. I never have to re-authenticate when applying to multiple listings. Highly optimized design!"
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-indigo-50 rounded-full text-xs font-bold text-primary flex items-center justify-center shrink-0">AB</div>
              <div>
                <p className="text-xs font-bold text-slate-800">Alex Brown</p>
                <p className="text-[10px] text-slate-400">Fullstack Dev at DesignLab</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

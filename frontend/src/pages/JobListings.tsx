import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Job } from '../types';
import { Filter, Search, Briefcase, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { JobCardSkeleton } from '../components/Skeletons';
import { JobCard } from '../components/JobCard';
import { FilterSidebar } from '../components/FilterSidebar';

export const JobListings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Local Filter States initialized from URL search params
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [locationVal, setLocationVal] = useState(searchParams.get('location') || '');
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
    searchParams.getAll('jobType')
  );
  const [selectedExp, setSelectedExp] = useState(searchParams.get('experienceLevel') || '');
  const [remoteOnly, setRemoteOnly] = useState(searchParams.get('remote') === 'true');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    searchParams.get('skills')?.split(',').filter(Boolean) || []
  );
  const [salaryMin, setSalaryMin] = useState(searchParams.get('salaryMin') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const [debouncedSearch, setDebouncedSearch] = useState(searchVal);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Synchronize local states to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (locationVal) params.set('location', locationVal);
    selectedJobTypes.forEach((t) => params.append('jobType', t));
    if (selectedExp) params.set('experienceLevel', selectedExp);
    if (remoteOnly) params.set('remote', 'true');
    if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','));
    if (salaryMin) params.set('salaryMin', salaryMin);
    if (sortBy) params.set('sortBy', sortBy);
    params.set('page', String(page));

    setSearchParams(params);
  }, [debouncedSearch, locationVal, selectedJobTypes, selectedExp, remoteOnly, selectedSkills, salaryMin, sortBy, page, setSearchParams]);

  // Reset pagination on filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, locationVal, selectedJobTypes, selectedExp, remoteOnly, selectedSkills, salaryMin, sortBy]);

  // Fetch jobs using React Query
  const { data, isLoading } = useQuery<{ jobs: Job[]; total: number }>({
    queryKey: ['activeJobs', debouncedSearch, locationVal, selectedJobTypes, selectedExp, remoteOnly, selectedSkills, salaryMin, sortBy, page],
    queryFn: async () => {
      const params: any = { page, limit: 9 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (locationVal) params.location = locationVal;
      // Note: Backend might expect comma-separated skills or array. Our validator middleware parses string/comma
      if (selectedSkills.length > 0) params.skills = selectedSkills.join(',');
      if (selectedExp) params.experienceLevel = selectedExp;
      if (remoteOnly) params.remote = true;
      if (salaryMin) params.salaryMin = Number(salaryMin);
      if (sortBy) params.sortBy = sortBy;
      
      // If single jobType is selected, send it. For multiple, we query the first or map.
      // Let's send the first selected jobType since the backend filters by jobType parameter.
      if (selectedJobTypes.length > 0) {
        params.jobType = selectedJobTypes[0];
      }

      const res = await api.get('/jobs', { params });
      return res.data.data;
    },
  });

  const jobs = data?.jobs || [];
  const totalJobs = data?.total || 0;
  const totalPages = Math.ceil(totalJobs / 9);

  const toggleJobType = (typeId: string) => {
    setSelectedJobTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearchVal('');
    setLocationVal('');
    setSelectedJobTypes([]);
    setSelectedExp('');
    setRemoteOnly(false);
    setSelectedSkills([]);
    setSalaryMin('');
    setSortBy('newest');
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-6">
      
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">Search Job Openings</h1>
          <p className="text-slate-500 text-xs mt-1">Discover engineering and startup roles matching your stack.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sorting Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2 bg-transparent input-focus cursor-pointer"
          >
            <option value="newest">Sort by: Newest First</option>
            <option value="salary-high">Sort by: Highest Salary</option>
            <option value="salary-low">Sort by: Lowest Salary</option>
            <option value="relevance">Sort by: Relevance</option>
          </select>
          {/* Mobile Filter Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex md:hidden items-center justify-center gap-2 text-xs font-semibold border border-slate-200 px-4 py-2 bg-white rounded-xl text-slate-700"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 2. Desktop Filters Sidebar */}
        <aside className="hidden lg:block space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Filters</span>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Clear all
            </button>
          </div>

          <FilterSidebar
            locationVal={locationVal}
            setLocationVal={setLocationVal}
            selectedJobTypes={selectedJobTypes}
            toggleJobType={toggleJobType}
            remoteOnly={remoteOnly}
            setRemoteOnly={setRemoteOnly}
            salaryMin={salaryMin}
            setSalaryMin={setSalaryMin}
            selectedExp={selectedExp}
            setSelectedExp={setSelectedExp}
            selectedSkills={selectedSkills}
            toggleSkill={toggleSkill}
          />
        </aside>

        {/* 3. Job Listings Grid */}
        <main className="lg:col-span-3 space-y-6">
          {/* Quick text search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs by title, description, or requirements..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-2xl shadow-sm focus:bg-white input-focus"
            />
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            {searchVal && (
              <button
                onClick={() => setSearchVal('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {isLoading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : jobs.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-16 text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-primary mx-auto">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No jobs match your search</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Try adjustment filters, changing location parameters, or resetting keywords query.
              </p>
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-white bg-primary px-4 py-2 rounded-xl hover:bg-primary-dark transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Grid and cards list */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-6">
                  <span className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-800">{jobs.length}</span> of{' '}
                    <span className="font-semibold text-slate-800">{totalJobs}</span> positions
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const curr = idx + 1;
                      return (
                        <button
                          key={curr}
                          onClick={() => setPage(curr)}
                          className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${
                            page === curr
                              ? 'bg-primary text-white shadow-premium'
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {curr}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 4. Mobile Drawer Filters Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 px-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-slate-800">Filters</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex p-2 rounded-xl text-slate-500 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Render Sidebar filters inline */}
            <FilterSidebar
              className="space-y-6 pt-4"
              locationVal={locationVal}
              setLocationVal={setLocationVal}
              selectedJobTypes={selectedJobTypes}
              toggleJobType={toggleJobType}
              remoteOnly={remoteOnly}
              setRemoteOnly={setRemoteOnly}
              salaryMin={salaryMin}
              setSalaryMin={setSalaryMin}
              selectedExp={selectedExp}
              setSelectedExp={setSelectedExp}
              selectedSkills={selectedSkills}
              toggleSkill={toggleSkill}
            />

            <div className="mt-8 border-t border-slate-100 pt-4 flex gap-3">
              <button
                onClick={() => {
                  clearFilters();
                  setSidebarOpen(false);
                }}
                className="flex-1 text-center py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex-1 text-center py-2 text-xs font-bold text-white bg-primary rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

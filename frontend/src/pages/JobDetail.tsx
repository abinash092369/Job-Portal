import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Job } from '../types';
import { useAuthStore } from '../context/authStore';
import { useToastStore } from '../context/toastStore';
import { Calendar, MapPin, DollarSign, Briefcase, Eye, Bookmark, Share2, ShieldCheck, ArrowLeft, Loader2, FileText, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { JobDetailSkeleton } from '../components/Skeletons';

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [useProfileResume, setUseProfileResume] = useState(true);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [submittingApp, setSubmittingApp] = useState(false);

  // 1. Fetch Job Details (increments views automatically)
  const { data: job, isLoading, error } = useQuery<Job>({
    queryKey: ['jobDetail', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // 2. Fetch similar jobs (querying by first skill)
  const { data: similarData } = useQuery<{ jobs: Job[] }>({
    queryKey: ['similarJobs', job?.skills],
    queryFn: async () => {
      const skill = job?.skills?.[0] || '';
      const res = await api.get('/jobs', { params: { search: skill, limit: 3 } });
      return res.data.data;
    },
    enabled: !!job?.skills,
  });

  // 3. Fetch user's saved jobs list to check if this job is bookmarked
  const { data: savedJobs = [] } = useQuery<Job[]>({
    queryKey: ['savedJobs'],
    queryFn: async () => {
      if (user?.role !== 'candidate') return [];
      const res = await api.get('/jobs/saved');
      return res.data.data;
    },
    enabled: user?.role === 'candidate',
  });

  // 4. Fetch candidate dashboard to see if already applied
  const { data: candidateDashboard } = useQuery({
    queryKey: ['candidateDashboard'],
    queryFn: async () => {
      if (user?.role !== 'candidate') return null;
      const res = await api.get('/dashboard/candidate');
      return res.data.data;
    },
    enabled: user?.role === 'candidate',
  });

  const isSaved = savedJobs.some((j) => j.id === id);
  
  const hasApplied = candidateDashboard?.appliedJobs?.some(
    (app: any) => app.jobId === id
  );

  // Toggle save mutation with Optimistic UI updates
  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await api.post(`/jobs/${id}/unsave`);
      } else {
        await api.post(`/jobs/${id}/save`);
      }
    },
    onMutate: async () => {
      // Cancel refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['savedJobs'] });

      // Snapshot previous value
      const previousSaved = queryClient.getQueryData<Job[]>(['savedJobs']);

      // Optimistically update list
      if (previousSaved) {
        let newSaved = [...previousSaved];
        if (isSaved) {
          newSaved = newSaved.filter((j) => j.id !== id);
        } else if (job) {
          newSaved.push(job);
        }
        queryClient.setQueryData(['savedJobs'], newSaved);
      }

      return { previousSaved };
    },
    onError: (_err, _variables, context) => {
      // Rollback on failure
      if (context?.previousSaved) {
        queryClient.setQueryData(['savedJobs'], context.previousSaved);
      }
      addToast('Failed to update saved jobs list', 'error');
    },
    onSuccess: () => {
      addToast(isSaved ? 'Job unsaved successfully' : 'Job bookmarked successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('Job link copied to clipboard!', 'success');
  };

  const handleApplyClick = () => {
    if (!user) {
      addToast('Please login to apply for this job.', 'info');
      navigate('/login', { state: { from: { pathname: `/jobs/${id}` } } });
      return;
    }
    if (user.role !== 'candidate') {
      addToast('Only candidates can apply to job openings.', 'error');
      return;
    }
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    if (!useProfileResume && !resumeFile) {
      addToast('Please upload a resume file.', 'error');
      return;
    }

    setSubmittingApp(true);
    try {
      const formData = new FormData();
      formData.append('coverLetter', coverLetter);
      
      if (!useProfileResume && resumeFile) {
        formData.append('resume', resumeFile);
      }

      // Map screening answers to matches configured on the job
      const answersPayload = (job.screeningQuestions || []).map((q) => ({
        question: q,
        answer: screeningAnswers[q] || '',
      }));
      formData.append('screeningAnswers', JSON.stringify(answersPayload));

      await api.post(`/jobs/${id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast('Application submitted successfully!', 'success');
      setApplyModalOpen(false);
      
      // Invalidate queries to refresh application states
      queryClient.invalidateQueries({ queryKey: ['candidateDashboard'] });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to submit application.';
      addToast(msg, 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 bg-background">
        <JobDetailSkeleton />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4 min-h-screen flex flex-col justify-center">
        <h2 className="text-xl font-bold text-slate-800">Job posting not found</h2>
        <p className="text-sm text-slate-500">The job you are looking for does not exist or has been deleted.</p>
        <Link to="/jobs" className="text-sm font-semibold text-primary hover:underline">
          Back to job directory
        </Link>
      </div>
    );
  }

  const similarJobs = (similarData?.jobs || []).filter((j) => j.id !== id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-8">
      
      {/* Back Button */}
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Title Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-premium space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                {job.logoUrl ? (
                  <img
                    src={job.logoUrl}
                    alt={job.companyName || 'Company logo'}
                    className="w-16 h-16 rounded-2xl object-contain border border-slate-100 bg-slate-50 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-primary font-bold flex items-center justify-center text-xl shrink-0">
                    {(job.companyName || 'CO').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">{job.title}</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Link
                      to={`/company/${job.employerId}`}
                      className="text-sm font-semibold text-slate-600 hover:text-primary hover:underline"
                    >
                      {job.companyName || 'Unknown Company'}
                    </Link>
                    {job.companyVerified && (
                      <span title="Verified employer"><ShieldCheck className="w-4 h-4 text-success fill-success/10 shrink-0" /></span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Post Date: {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => toggleSaveMutation.mutate()}
                  disabled={user?.role === 'employer'}
                  className={`flex-1 sm:flex-initial flex items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors ${
                    isSaved ? 'text-amber-500 border-amber-200 bg-amber-50/20 hover:bg-amber-50/30' : 'text-slate-500'
                  }`}
                  title={isSaved ? 'Unsave job' : 'Save job'}
                >
                  <Bookmark className="w-5 h-5 fill-current" />
                </button>
                <button
                  onClick={handleShareClick}
                  className="flex-1 sm:flex-initial flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                  title="Share job"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Metadata badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-slate-100 py-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Salary Range</span>
                <span className="text-sm font-bold text-slate-800 block flex items-center"><DollarSign className="w-4 h-4 text-slate-500" /> {job.salaryRange}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Job Type</span>
                <span className="text-sm font-bold text-slate-800 block capitalize flex items-center gap-1"><Briefcase className="w-4 h-4 text-slate-500" /> {job.jobType}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Experience Level</span>
                <span className="text-sm font-bold text-slate-800 block">{job.experienceLevel}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Views</span>
                <span className="text-sm font-bold text-slate-800 block flex items-center gap-1.5"><Eye className="w-4 h-4 text-slate-500" /> {job.views}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-800">Job Description</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {/* Responsibilities */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-800">Responsibilities</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.responsibilities}</p>
            </div>

            {/* Requirements */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-800">Requirements</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.requirements}</p>
            </div>

            {/* Required Skills tags */}
            <div className="space-y-3 border-t border-slate-50 pt-6">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Required Skills Stack</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-slate-50 border border-slate-200/55 px-3 py-1 rounded-lg text-slate-600 font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Apply Banner */}
          <div className="bg-slate-900 p-6 rounded-2xl shadow-premium text-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-sm font-bold text-white">Interested in this position?</h3>
              <p className="text-xs text-slate-400">Applications close on {new Date(job.applicationDeadline).toLocaleDateString()}</p>
            </div>
            {hasApplied ? (
              <button
                disabled
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-700 cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Already Applied
              </button>
            ) : (
              <button
                onClick={handleApplyClick}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-slate-900 bg-accent hover:bg-accent-dark transition-all hover-lift"
              >
                Apply Now
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Company info and similar jobs */}
        <div className="space-y-6">
          
          {/* Company Mini Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">About the Company</h2>
            <div className="flex items-center gap-3">
              {job.logoUrl ? (
                <img
                  src={job.logoUrl}
                  alt={job.companyName || 'Company logo'}
                  className="w-12 h-12 rounded-xl object-contain border border-slate-100 bg-slate-50 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-primary font-bold flex items-center justify-center shrink-0">
                  {(job.companyName || 'CO').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight block">{job.companyName || 'Unknown Company'}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Technology sector</span>
              </div>
            </div>
            
            {/* Website & Description links */}
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">
              Explore open listings and full portfolio detail parameters from our verified organization.
            </p>

            <div className="pt-2">
              <Link
                to={`/company/${job.employerId}`}
                className="text-xs font-bold text-primary hover:text-primary-dark inline-flex items-center gap-1"
              >
                View company profile
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Similar Jobs */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">Similar Openings</h2>
            {similarJobs.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center py-8 text-xs text-slate-400 shadow-sm">
                No similar jobs found.
              </div>
            ) : (
              similarJobs.map((simJob) => (
                <Link
                  key={simJob.id}
                  to={`/jobs/${simJob.id}`}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium hover:border-primary/20 block hover-lift transition-all space-y-2"
                >
                  <span className="text-[10px] font-semibold text-slate-400 block">{simJob.companyName}</span>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{simJob.title}</h4>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-slate-500">{simJob.location}</span>
                    <span className="text-[10px] font-bold text-primary">{simJob.salaryRange}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

        </div>

      </div>

      {/* 5. Job Application Modal */}
      {applyModalOpen && job && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="text-base font-bold text-slate-800">Apply to {job.companyName}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Position: {job.title}</p>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleApplySubmit} className="p-5 space-y-5 flex-1">
              
              {/* Cover Letter */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Cover Letter
                </label>
                <textarea
                  required
                  placeholder="Introduce yourself and explain why you're a good fit for this role..."
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:bg-white input-focus"
                />
              </div>

              {/* Resume selector */}
              <div className="space-y-2 border-t border-slate-50 pt-4">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Resume
                </label>
                
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
                    <input
                      type="radio"
                      checked={useProfileResume}
                      onChange={() => setUseProfileResume(true)}
                      className="text-primary w-4 h-4 cursor-pointer"
                    />
                    Use resume uploaded in my Profile Settings
                  </label>
                  
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
                    <input
                      type="radio"
                      checked={!useProfileResume}
                      onChange={() => setUseProfileResume(false)}
                      className="text-primary w-4 h-4 cursor-pointer"
                    />
                    Upload a new resume file (.pdf, .doc, .docx)
                  </label>
                </div>

                {!useProfileResume && (
                  <div className="relative mt-2 p-4 border border-dashed border-slate-200 rounded-xl text-center hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1.5">
                      <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-[11px] font-semibold text-slate-600">
                        {resumeFile ? resumeFile.name : 'Click or drag file here to upload'}
                      </p>
                      <p className="text-[10px] text-slate-400">PDF, DOC, DOCX up to 5MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Screening Questions (Dynamic) */}
              {job.screeningQuestions && job.screeningQuestions.length > 0 && (
                <div className="space-y-3 border-t border-slate-50 pt-4">
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Screening Questions
                  </label>
                  
                  {job.screeningQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="block text-xs font-medium text-slate-600">
                        {q}
                      </label>
                      <input
                        type="text"
                        required
                        value={screeningAnswers[q] || ''}
                        onChange={(e) =>
                          setScreeningAnswers((prev) => ({
                            ...prev,
                            [q]: e.target.value,
                          }))
                        }
                        placeholder="Type your answer here..."
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:bg-white input-focus"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Footer */}
              <div className="border-t border-slate-100 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="flex-1 text-center py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl flex items-center justify-center gap-1.5 hover-lift disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submittingApp ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

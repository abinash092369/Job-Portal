import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Job } from '../../types';
import { useToastStore } from '../../context/toastStore';
import { Loader2, ArrowLeft, ArrowRight, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { jobSchema } from '../../utils/validationSchemas';

type JobFormValues = z.infer<typeof jobSchema>;

export const PostJobWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // If id exists, we are editing
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  const [questionInput, setQuestionInput] = useState('');

  // Fetch job details if editing
  const { data: existingJob, isLoading: loadingJob } = useQuery<Job>({
    queryKey: ['jobDetailEdit', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const {
    register,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      responsibilities: '',
      requirements: '',
      skills: [],
      salaryRange: '',
      jobType: 'full-time',
      location: '',
      experienceLevel: 'Mid Level',
      applicationDeadline: '',
      screeningQuestions: [],
    },
  });

  // Load existing values when editing
  useEffect(() => {
    if (existingJob) {
      // Format deadline date to YYYY-MM-DD
      const dateStr = new Date(existingJob.applicationDeadline).toISOString().split('T')[0];
      reset({
        title: existingJob.title,
        description: existingJob.description,
        responsibilities: existingJob.responsibilities,
        requirements: existingJob.requirements,
        skills: existingJob.skills || [],
        salaryRange: existingJob.salaryRange,
        jobType: existingJob.jobType,
        location: existingJob.location,
        experienceLevel: existingJob.experienceLevel,
        applicationDeadline: dateStr,
        screeningQuestions: existingJob.screeningQuestions || [],
      });
    }
  }, [existingJob, reset]);

  const skillsList = watch('skills') || [];
  const questionsList = watch('screeningQuestions') || [];

  const handleAddSkill = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const clean = skillInput.trim();
    if (clean && !skillsList.includes(clean)) {
      setValue('skills', [...skillsList, clean], { shouldValidate: true });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setValue(
      'skills',
      skillsList.filter((s) => s !== skill),
      { shouldValidate: true }
    );
  };

  const handleAddQuestion = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const clean = questionInput.trim();
    if (clean && !questionsList.includes(clean)) {
      setValue('screeningQuestions', [...questionsList, clean]);
      setQuestionInput('');
    }
  };

  const handleRemoveQuestion = (idx: number) => {
    setValue(
      'screeningQuestions',
      questionsList.filter((_, i) => i !== idx)
    );
  };

  // Move between wizard steps after validating current step inputs
  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      fieldsToValidate = ['title', 'description', 'location', 'salaryRange', 'jobType', 'experienceLevel'];
    } else if (step === 2) {
      fieldsToValidate = ['requirements', 'responsibilities', 'skills', 'applicationDeadline'];
    } else if (step === 3) {
      fieldsToValidate = ['screeningQuestions'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const saveJobMutation = useMutation({
    mutationFn: async ({ values, asDraft }: { values: JobFormValues; asDraft: boolean }) => {
      // 1. Create or update job posting
      let jobResponse;
      if (id) {
        jobResponse = await api.put(`/jobs/${id}`, values);
      } else {
        jobResponse = await api.post('/jobs', values);
      }

      const jobData = jobResponse.data.data;

      // 2. Publish or unpublish depending on action
      if (!asDraft) {
        await api.patch(`/jobs/${jobData.id}/publish`);
      } else {
        await api.patch(`/jobs/${jobData.id}/unpublish`);
      }
    },
    onSuccess: () => {
      addToast(
        id ? 'Job posting updated successfully!' : 'Job posting created successfully!',
        'success'
      );
      queryClient.invalidateQueries({ queryKey: ['employerDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      navigate('/employer/jobs');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to save job posting.';
      addToast(msg, 'error');
    },
  });

  const onFinalSubmit = (asDraft: boolean) => {
    const values = watch();
    saveJobMutation.mutate({ values, asDraft });
  };

  if (id && loadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-8 animate-fade-in">
      
      {/* Back button */}
      <Link to="/employer/jobs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">
          {id ? 'Edit Job Posting' : 'Post a Job Opening'}
        </h1>
        <p className="text-slate-500 text-xs mt-1">Provide clear expectations and candidate requirements.</p>
      </div>

      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-100 shadow-premium">
        {[
          { label: 'Basic Info', num: 1 },
          { label: 'Requirements', num: 2 },
          { label: 'Screening', num: 3 },
          { label: 'Review', num: 4 },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s.num ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {s.num}
              </span>
              <span
                className={`hidden sm:inline text-xs font-bold ${
                  step >= s.num ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < 3 && <ChevronRight className="w-4 h-4 text-slate-200 hidden sm:block" />}
          </React.Fragment>
        ))}
      </div>

      {/* Wizard Form Wrapper */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-premium">
        
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Step 1: Basic Information</h2>
            
            {/* Title */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-500">Job Title</label>
              <input
                type="text"
                placeholder="e.g. Senior React Developer"
                {...register('title')}
                className={`w-full text-xs px-3 py-2 border rounded-xl input-focus ${
                  errors.title ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                }`}
              />
              {errors.title && <p className="text-[10px] font-semibold text-error">{errors.title.message}</p>}
            </div>

            {/* Location & Salary grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-500">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Remote, San Francisco"
                  {...register('location')}
                  className={`w-full text-xs px-3 py-2 border rounded-xl input-focus ${
                    errors.location ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                  }`}
                />
                {errors.location && <p className="text-[10px] font-semibold text-error">{errors.location.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-500">Salary Range</label>
                <input
                  type="text"
                  placeholder="e.g. $80k - $120k"
                  {...register('salaryRange')}
                  className={`w-full text-xs px-3 py-2 border rounded-xl input-focus ${
                    errors.salaryRange ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                  }`}
                />
                {errors.salaryRange && <p className="text-[10px] font-semibold text-error">{errors.salaryRange.message}</p>}
              </div>
            </div>

            {/* Job Type & Experience level */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-500">Job Type</label>
                <select
                  {...register('jobType')}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 input-focus"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-500">Experience Level</label>
                <select
                  {...register('experienceLevel')}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 input-focus"
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Lead/Manager">Lead/Manager</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-500">Job Description Summary</label>
              <textarea
                rows={5}
                placeholder="Describe the role in details..."
                {...register('description')}
                className={`w-full text-xs p-3 border rounded-xl input-focus ${
                  errors.description ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                }`}
              />
              {errors.description && <p className="text-[10px] font-semibold text-error">{errors.description.message}</p>}
            </div>

          </div>
        )}

        {/* Step 2: Requirements & Skills */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Step 2: Requirements & Details</h2>
            
            {/* Responsibilities */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-500">Responsibilities</label>
              <textarea
                rows={3}
                placeholder="Key daily duties..."
                {...register('responsibilities')}
                className={`w-full text-xs p-3 border rounded-xl input-focus ${
                  errors.responsibilities ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                }`}
              />
              {errors.responsibilities && <p className="text-[10px] font-semibold text-error">{errors.responsibilities.message}</p>}
            </div>

            {/* Requirements */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-500">Candidate Requirements</label>
              <textarea
                rows={3}
                placeholder="Background, qualifications, stack constraints..."
                {...register('requirements')}
                className={`w-full text-xs p-3 border rounded-xl input-focus ${
                  errors.requirements ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                }`}
              />
              {errors.requirements && <p className="text-[10px] font-semibold text-error">{errors.requirements.message}</p>}
            </div>

            {/* Application Deadline */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-500">Application Deadline</label>
              <input
                type="date"
                {...register('applicationDeadline')}
                className={`w-full text-xs px-3 py-2 border rounded-xl bg-slate-50/30 input-focus ${
                  errors.applicationDeadline ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                }`}
              />
              {errors.applicationDeadline && <p className="text-[10px] font-semibold text-error">{errors.applicationDeadline.message}</p>}
            </div>

            {/* Skills tag array */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">Key Tech Stack Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. React (press Enter)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSkill(e);
                  }}
                  className="flex-grow text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/30 input-focus"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 font-semibold"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-slate-600 font-bold ml-1 text-xs"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              {errors.skills && <p className="text-[10px] font-semibold text-error">{errors.skills.message}</p>}
            </div>

          </div>
        )}

        {/* Step 3: Screening Questions */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-50 pb-2">
              <h2 className="text-sm font-bold text-slate-800">Step 3: Screening Questions (Optional)</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Candidates must fill out answers to these questions when submitting their applications.</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom question (e.g. What is your years of experience in React?)"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddQuestion(e);
                  }}
                  className="flex-grow text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/30 input-focus"
                />
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2.5 pt-4">
                {questionsList.length === 0 ? (
                  <p className="text-xs text-slate-400">No screening questions configured.</p>
                ) : (
                  questionsList.map((q, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-xs text-slate-700 leading-relaxed font-medium">{q}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-slate-400 hover:text-error transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* Step 4: Review & Publish */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Step 4: Review Posting Summary</h2>
            
            <div className="space-y-4 border border-slate-100 p-5 rounded-2xl bg-slate-50/10">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Title</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{watch('title')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Location</span>
                  <p className="text-xs text-slate-700 mt-0.5">{watch('location')}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Salary</span>
                  <p className="text-xs text-slate-700 mt-0.5">{watch('salaryRange')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Job Type</span>
                  <p className="text-xs text-slate-700 capitalize mt-0.5">{watch('jobType')}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Deadline</span>
                  <p className="text-xs text-slate-700 mt-0.5">{watch('applicationDeadline')}</p>
                </div>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Tech Stack</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {skillsList.map((skill) => (
                    <span key={skill} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">{skill}</span>
                  ))}
                </div>
              </div>
              {questionsList.length > 0 && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Screening questions ({questionsList.length})</span>
                  <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1 mt-1">
                    {questionsList.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upon publishing, this post immediately becomes visible on the public listings board. If saved as draft, you can customize or publish it anytime from the listings manager.
            </p>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="border-t border-slate-100 pt-6 mt-6 flex justify-between items-center gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div></div> // Spacer
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover-lift"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onFinalSubmit(true)} // Save as Draft
                disabled={saveJobMutation.isPending}
                className="flex-1 sm:flex-initial px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                {saveJobMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Save as Draft'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => onFinalSubmit(false)} // Publish Now
                disabled={saveJobMutation.isPending}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover-lift shadow-premium"
              >
                {saveJobMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Publish Now
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

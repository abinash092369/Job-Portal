import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { CandidateProfile } from '../../types';
import { useToastStore } from '../../context/toastStore';
import { Loader2, Save, FileText, Plus, Trash2, Camera, Download, UploadCloud } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  headline: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      company: z.string().min(1, 'Company is required'),
      role: z.string().min(1, 'Role is required'),
      duration: z.string().min(1, 'Duration is required'),
      description: z.string().optional(),
    })
  ),
  education: z.array(
    z.object({
      school: z.string().min(1, 'School is required'),
      degree: z.string().min(1, 'Degree is required'),
      fieldOfStudy: z.string().min(1, 'Field of study is required'),
      year: z.number().int().min(1950, 'Invalid year'),
    })
  ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const CandidateProfilePage: React.FC = () => {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [skillInput, setSkillInput] = useState('');

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Fetch Candidate Profile
  const { data: profile, isLoading } = useQuery<CandidateProfile>({
    queryKey: ['candidateProfile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      headline: '',
      location: '',
      phone: '',
      skills: [],
      experience: [],
      education: [],
    },
  });

  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp,
  } = useFieldArray({
    control,
    name: 'experience',
  });

  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({
    control,
    name: 'education',
  });

  // Load profile values into form on fetch
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        headline: profile.headline || '',
        location: profile.location || '',
        phone: profile.phone || '',
        skills: profile.skills || [],
        experience: profile.experience || [],
        education: profile.education || [],
      });
    }
  }, [profile, reset]);

  const skillsList = watch('skills') || [];

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    e.preventDefault();
    const clean = skillInput.trim();
    if (clean && !skillsList.includes(clean)) {
      setValue('skills', [...skillsList, clean], { shouldDirty: true });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setValue(
      'skills',
      skillsList.filter((s) => s !== skill),
      { shouldDirty: true }
    );
  };

  // Submit profile details
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      await api.put('/profile', values);
    },
    onSuccess: () => {
      addToast('Profile updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      queryClient.invalidateQueries({ queryKey: ['candidateDashboard'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update profile settings.';
      addToast(msg, 'error');
    },
  });

  const onProfileSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  // Photo upload trigger
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Profile photo updated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to upload photo.';
      addToast(msg, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Resume upload trigger
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      await api.post('/profile/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Resume file updated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to upload resume.';
      addToast(msg, 'error');
    } finally {
      setUploadingResume(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6 animate-pulse">
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const staticApiUrl = 'http://localhost:5000'; // Prefix relative uploads URLs

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-8 animate-fade-in">
      
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">Profile Settings</h1>
        <p className="text-slate-500 text-xs mt-1">Manage your summary, skills list, work history, and resume attachments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Photos and Resumes */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Profile Photo */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium text-center space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Profile Photo</h2>
            
            <div className="relative inline-block mx-auto">
              {profile?.profilePhotoUrl ? (
                <img
                  src={profile.profilePhotoUrl.startsWith('http') ? profile.profilePhotoUrl : `${staticApiUrl}${profile.profilePhotoUrl}`}
                  alt="Profile photo"
                  className="w-24 h-24 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-50 text-primary font-bold text-2xl flex items-center justify-center border-2 border-slate-100">
                  {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'ME'}
                </div>
              )}
              
              <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary-dark transition-colors shadow hover-lift">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            {uploadingPhoto && (
              <span className="text-[10px] text-primary font-semibold flex items-center justify-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
              </span>
            )}
            <p className="text-[10px] text-slate-400">JPG or PNG. Max 5MB.</p>
          </div>

          {/* Resume Upload */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium text-center space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Resume Attachment</h2>
            
            <div className="border border-dashed border-slate-200 rounded-xl p-4 relative hover:bg-slate-50 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingResume}
              />
              <div className="space-y-2">
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-[10px] font-semibold text-slate-600">
                  {profile?.resumeUrl ? 'Update resume file' : 'Upload resume file'}
                </p>
              </div>
            </div>

            {uploadingResume && (
              <span className="text-[10px] text-primary font-semibold flex items-center justify-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
              </span>
            )}

            {profile?.resumeUrl && (
              <div className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-left">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-700 truncate block">My Resume</span>
                  <a
                    href={profile.resumeUrl.startsWith('http') ? profile.resumeUrl : `${staticApiUrl}${profile.resumeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-semibold text-primary hover:underline flex items-center gap-0.5 mt-0.5"
                  >
                    <Download className="w-3 h-3" />
                    Download File
                  </a>
                </div>
              </div>
            )}
            <p className="text-[10px] text-slate-400">PDF, DOC, or DOCX. Max 5MB.</p>
          </div>

        </div>

        {/* Right Column: Profile details form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit(onProfileSubmit)} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-premium space-y-6">
            
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Basic Information</h2>
              
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-500">Name</label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full text-xs px-3 py-2 border rounded-xl input-focus ${
                    errors.name ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                  }`}
                />
                {errors.name && <p className="text-[10px] font-semibold text-error">{errors.name.message}</p>}
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-500">Professional Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Developer"
                  {...register('headline')}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/30 input-focus"
                />
              </div>

              {/* Location & Phone grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, TX"
                    {...register('location')}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/30 input-focus"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555-1234"
                    {...register('phone')}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/30 input-focus"
                  />
                </div>
              </div>
            </div>

            {/* Skills tag input */}
            <div className="space-y-4 border-t border-slate-50 pt-6">
              <h2 className="text-sm font-bold text-slate-800">Skills Tags</h2>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type skill and press Add (e.g. React)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSkill(e);
                    }}
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/30 input-focus"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {skillsList.length === 0 ? (
                    <span className="text-xs text-slate-400">No skills added yet.</span>
                  ) : (
                    skillsList.map((skill) => (
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
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Experience array */}
            <div className="space-y-4 border-t border-slate-50 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">Work Experience</h2>
                <button
                  type="button"
                  onClick={() => appendExp({ company: '', role: '', duration: '', description: '' })}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline focus:outline-none"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Experience
                </button>
              </div>

              {expFields.length === 0 ? (
                <p className="text-xs text-slate-400">Add work history here.</p>
              ) : (
                <div className="space-y-4">
                  {expFields.map((field, idx) => (
                    <div key={field.id} className="p-4 border border-slate-100 rounded-xl space-y-3 relative bg-slate-50/10">
                      <button
                        type="button"
                        onClick={() => removeExp(idx)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-error transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Company</label>
                          <input
                            type="text"
                            {...register(`experience.${idx}.company` as const)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white input-focus"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Role</label>
                          <input
                            type="text"
                            {...register(`experience.${idx}.role` as const)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white input-focus"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Duration (e.g. 2 yrs)</label>
                          <input
                            type="text"
                            {...register(`experience.${idx}.duration` as const)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white input-focus"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Description</label>
                          <textarea
                            rows={2}
                            {...register(`experience.${idx}.description` as const)}
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white input-focus"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education array */}
            <div className="space-y-4 border-t border-slate-50 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">Education</h2>
                <button
                  type="button"
                  onClick={() => appendEdu({ school: '', degree: '', fieldOfStudy: '', year: new Date().getFullYear() })}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline focus:outline-none"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Education
                </button>
              </div>

              {eduFields.length === 0 ? (
                <p className="text-xs text-slate-400">Add academic records here.</p>
              ) : (
                <div className="space-y-4">
                  {eduFields.map((field, idx) => (
                    <div key={field.id} className="p-4 border border-slate-100 rounded-xl space-y-3 relative bg-slate-50/10">
                      <button
                        type="button"
                        onClick={() => removeEdu(idx)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-error transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">School</label>
                          <input
                            type="text"
                            {...register(`education.${idx}.school` as const)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white input-focus"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Degree</label>
                          <input
                            type="text"
                            {...register(`education.${idx}.degree` as const)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white input-focus"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Field of Study</label>
                          <input
                            type="text"
                            {...register(`education.${idx}.fieldOfStudy` as const)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white input-focus"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Graduation Year</label>
                          <input
                            type="number"
                            {...register(`education.${idx}.year` as const, { valueAsNumber: true })}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white input-focus"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Buttons */}
            <div className="border-t border-slate-100 pt-6 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-all hover-lift flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Profile Details
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};

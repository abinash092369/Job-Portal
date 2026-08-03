import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { EmployerProfile } from '../../types';
import { useToastStore } from '../../context/toastStore';
import { Loader2, Save, ArrowLeft, Camera, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const companySchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  website: z.string().url('Please enter a valid website URL').or(z.literal('')),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().min(1, 'Company size is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export const EmployerProfilePage: React.FC = () => {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Fetch Employer Profile
  const { data: profile, isLoading } = useQuery<EmployerProfile>({
    queryKey: ['employerProfile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: '',
      website: '',
      industry: '',
      companySize: '',
      description: '',
    },
  });

  // Load profile values into form on fetch
  useEffect(() => {
    if (profile) {
      reset({
        companyName: profile.companyName || '',
        website: profile.website || '',
        industry: profile.industry || '',
        companySize: profile.companySize || '',
        description: profile.description || '',
      });
    }
  }, [profile, reset]);

  // Update company profile details mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      await api.put('/profile', values);
    },
    onSuccess: () => {
      addToast('Company profile settings saved!', 'success');
      queryClient.invalidateQueries({ queryKey: ['employerProfile'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update company settings.';
      addToast(msg, 'error');
    },
  });

  const onProfileSubmit = (values: CompanyFormValues) => {
    updateProfileMutation.mutate(values);
  };

  // Logo upload trigger
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      await api.post('/profile/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Company logo updated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['employerProfile'] });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to upload logo.';
      addToast(msg, 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const staticApiUrl = apiBaseUrl.replace('/api/v1', ''); // Prefix relative uploads URLs

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-8 animate-fade-in">
      
      {/* Back button */}
      <Link to="/employer/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">Company Settings</h1>
        <p className="text-slate-500 text-xs mt-1">Configure company profiles, logo branding, and organization stats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Logo upload */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium text-center space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Company Logo</h2>
            
            <div className="relative inline-block mx-auto">
              {profile?.logoUrl ? (
                <img
                  src={profile.logoUrl.startsWith('http') ? profile.logoUrl : `${staticApiUrl}${profile.logoUrl}`}
                  alt="Company logo"
                  className="w-24 h-24 rounded-2xl object-contain border-2 border-slate-100 shadow-sm p-1 bg-slate-50"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-indigo-50 text-primary font-bold text-2xl flex items-center justify-center border-2 border-slate-100">
                  {profile?.companyName ? profile.companyName.substring(0, 2).toUpperCase() : 'CO'}
                </div>
              )}
              
              <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary-dark transition-colors shadow hover-lift">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
            </div>
            
            {uploadingLogo && (
              <span className="text-[10px] text-primary font-semibold flex items-center justify-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
              </span>
            )}
            <p className="text-[10px] text-slate-400">JPG or PNG. Max 5MB.</p>
          </div>
        </div>

        {/* Right Column: Company settings form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit(onProfileSubmit)} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-premium space-y-6">
            
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Company Information</h2>
              
              {/* Company Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-500">Company Name</label>
                <input
                  type="text"
                  {...register('companyName')}
                  className={`w-full text-xs px-3 py-2 border rounded-xl input-focus ${
                    errors.companyName ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                  }`}
                />
                {errors.companyName && <p className="text-[10px] font-semibold text-error">{errors.companyName.message}</p>}
              </div>

              {/* Website */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-500">Website URL</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://company.com"
                    {...register('website')}
                    className={`w-full pl-8 pr-4 py-2 border rounded-xl text-sm input-focus ${
                      errors.website ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                    }`}
                  />
                  <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                </div>
                {errors.website && <p className="text-[10px] font-semibold text-error">{errors.website.message}</p>}
              </div>

              {/* Industry & Size grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500">Industry</label>
                  <input
                    type="text"
                    placeholder="e.g. Technology, Finance"
                    {...register('industry')}
                    className={`w-full text-xs px-3 py-2 border rounded-xl input-focus ${
                      errors.industry ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                    }`}
                  />
                  {errors.industry && <p className="text-[10px] font-semibold text-error">{errors.industry.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500">Company Size</label>
                  <select
                    {...register('companySize')}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 input-focus"
                  >
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-500 employees">201-500 employees</option>
                    <option value="501-1000 employees">501-1000 employees</option>
                    <option value="1000+ employees">1000+ employees</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-500">About the Company</label>
                <textarea
                  rows={5}
                  placeholder="Describe your company, mission, values, and products..."
                  {...register('description')}
                  className={`w-full text-xs p-3 border rounded-xl input-focus ${
                    errors.description ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                  }`}
                />
                {errors.description && <p className="text-[10px] font-semibold text-error">{errors.description.message}</p>}
              </div>

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
                    <Save className="w-4 h-4" /> Save Company Details
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

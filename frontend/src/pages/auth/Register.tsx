import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useToastStore } from '../../context/toastStore';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, User as UserIcon, Building2 } from 'lucide-react';
import api from '../../services/api';
import { registerSchema } from '../../utils/validationSchemas';

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'candidate',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    setSubmitting(true);
    try {
      const { email, password, role } = data;
      await api.post('/auth/register', { email, password, role });
      addToast('Registration successful! Please log in.', 'success');
      navigate('/login');
    } catch (error: any) {
      const serverMessage = error.response?.data?.message || 'Registration failed. Email may already be in use.';
      addToast(serverMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-premium">
        
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-light transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            
            {/* Role Picker */}
            <div>
              <span className="block text-xs font-semibold uppercase text-slate-500 mb-2">
                I want to join as a
              </span>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setValue('role', 'candidate')}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all gap-2 text-center focus:outline-none ${
                    selectedRole === 'candidate'
                      ? 'border-primary bg-indigo-50/20 text-primary ring-2 ring-primary/20'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <UserIcon className="h-6 w-6" />
                  <span className="text-xs font-bold">Candidate</span>
                  <span className="text-[10px] text-slate-400 font-normal">Apply for jobs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', 'employer')}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all gap-2 text-center focus:outline-none ${
                    selectedRole === 'employer'
                      ? 'border-primary bg-indigo-50/20 text-primary ring-2 ring-primary/20'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="h-6 w-6" />
                  <span className="text-xs font-bold">Employer</span>
                  <span className="text-[10px] text-slate-400 font-normal">Post jobs & hire</span>
                </button>
              </div>
              {errors.role && (
                <p className="mt-1 text-xs font-medium text-error">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm input-focus ${
                    errors.email ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                  }`}
                />
                <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-10 py-2 border rounded-xl text-sm input-focus ${
                    errors.password ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                  }`}
                />
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={`w-full pl-10 pr-10 py-2 border rounded-xl text-sm input-focus ${
                    errors.confirmPassword ? 'border-error/50 bg-rose-50/10' : 'border-slate-200 bg-slate-50/30'
                  }`}
                />
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs font-medium text-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark hover-lift transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Register
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

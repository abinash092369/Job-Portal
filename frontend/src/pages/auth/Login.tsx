import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import { useToastStore } from '../../context/toastStore';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldAlert, Send } from 'lucide-react';
import api from '../../services/api';
import { loginSchema } from '../../utils/validationSchemas';

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { loginUser } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Retrieve redirects redirect location from Router state
  const from = (location.state as any)?.from?.pathname || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      addToast('Fresh verification email sent! Please check your inbox.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to resend verification email.';
      addToast(msg, 'error');
    } finally {
      setResending(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitting(true);
    setUnverifiedEmail(null);
    try {
      const res = await api.post('/auth/login', data);
      const { user, accessToken } = res.data.data;
      
      loginUser(user, accessToken);
      addToast('Welcome back! Login successful.', 'success');
      
      // Determine redirection path
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'employer') {
          navigate('/employer/dashboard', { replace: true });
        } else if (user.role === 'candidate') {
          navigate('/candidate/dashboard', { replace: true });
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (error: any) {
      const serverMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      if (serverMessage.toLowerCase().includes('verify') || serverMessage.toLowerCase().includes('unverified')) {
        setUnverifiedEmail(data.email);
      }
      addToast(serverMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-premium">
        
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Or{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-light transition-colors">
              create a new account for free
            </Link>
          </p>
        </div>

        {unverifiedEmail && (
          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-3 text-left animate-fade-in">
            <div className="flex items-start gap-2.5 text-amber-900">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold">Email Verification Required</h4>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Your account ({unverifiedEmail}) is not verified yet. Please check your email or click below to receive a fresh verification link.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Resend Verification Email
                </>
              )}
            </button>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            
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
                <p className="mt-1 text-xs font-medium text-error leading-relaxed">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-semibold uppercase text-slate-500">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:text-primary-light transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
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
                <p className="mt-1 text-xs font-medium text-error leading-relaxed">
                  {errors.password.message}
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
                  Sign in
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

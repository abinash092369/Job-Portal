import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useToastStore } from '../../context/toastStore';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import api from '../../services/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const { addToast } = useToastStore();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSuccess(true);
      addToast('Password reset link sent to your email!', 'success');
    } catch (error: any) {
      const serverMessage = error.response?.data?.message || 'Failed to send reset link. Please verify your email.';
      addToast(serverMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-premium animate-fade-in">
        
        {/* Back Link */}
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>

        {success ? (
          <div className="text-center space-y-4 pt-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-success">
              <Send className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Check your email</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              We have sent a password reset link to your email address. Please follow the link in the message to reset your password.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Reset your password
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Enter your email address and we'll send you a secure link to reset your password.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark hover-lift transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

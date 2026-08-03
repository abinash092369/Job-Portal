import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useToastStore } from '../../context/toastStore';
import { ShieldCheck, ShieldAlert, Mail, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { addToast } = useToastStore();

  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(token ? 'pending' : 'error');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      setVerifying(true);
      setStatus('pending');
      try {
        await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        addToast('Email verified successfully! You can now log in.', 'success');
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.response?.data?.message || 'Verification token is invalid or has expired.');
        addToast('Verification failed.', 'error');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, addToast]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-premium text-center animate-fade-in">
        {token ? (
          /* Auto verification state */
          <div className="space-y-6">
            {verifying && (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                <h2 className="text-2xl font-bold text-slate-800">Verifying your email</h2>
                <p className="text-sm text-slate-500">Checking verification code. Please wait a moment...</p>
              </div>
            )}

            {!verifying && status === 'success' && (
              <div className="space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-success">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 font-sans">Verification Successful!</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Thank you! Your email has been verified. Your account is now fully active.
                </p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-flex justify-center items-center gap-2 py-2 px-6 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-all hover-lift"
                  >
                    Go to Login
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {!verifying && status === 'error' && (
              <div className="space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-error">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Verification Failed</h2>
                <p className="text-sm text-error/90 font-medium bg-rose-50/50 p-3 rounded-xl border border-rose-100 max-w-sm mx-auto leading-relaxed">
                  {errorMessage}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Please make sure you copied the link correctly or try requesting a new link.
                </p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    Back to login
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* General email sent notification state */
          <div className="space-y-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-primary">
              <Mail className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Verify your email</h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              We've sent a verification link to your email address. Please click on the link inside the email to activate your account.
            </p>
            <div className="border-t border-slate-100 pt-6">
              <p className="text-xs text-slate-400">
                Didn't receive the email? Check your spam folder or{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  click here to login
                </Link>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage('Missing email verification token.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setSuccess(true);
        setMessage(response.data?.message || 'Email verified successfully!');
      } catch (error: any) {
        setSuccess(false);
        setMessage(
          error.response?.data?.message || 'Invalid or expired email verification token.'
        );
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-premium text-center">
        {loading ? (
          <div className="py-8 space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">Verifying Email...</h2>
            <p className="text-sm text-slate-500">Please wait while we confirm your email verification link.</p>
          </div>
        ) : success ? (
          <div className="py-6 space-y-4">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">Email Verified!</h2>
            <p className="text-sm text-slate-600">{message}</p>
            <Link
              to="/login"
              className="mt-4 inline-flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors gap-2"
            >
              Proceed to Login <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">Verification Failed</h2>
            <p className="text-sm text-slate-600">{message}</p>
            <Link
              to="/login"
              className="mt-4 inline-flex items-center justify-center w-full py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

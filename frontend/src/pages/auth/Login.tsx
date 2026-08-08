import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import { useToastStore } from '../../context/toastStore';
import {
  Phone,
  ArrowRight,
  Loader2,
  User as UserIcon,
  Building2,
  ShieldCheck,
  Smartphone,
  Globe,
  Mail,
  Lock,
  UserPlus,
  LogIn,
} from 'lucide-react';
import api from '../../services/api';
import type { UserRole } from '../../types';
import { auth, googleProvider } from '../../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
} from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';

type AuthMethod = 'email-login' | 'email-signup' | 'google' | 'phone';

export const Login: React.FC = () => {
  const { loginUser } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '';

  const [authMethod, setAuthMethod] = useState<AuthMethod>('email-login');
  const [role, setRole] = useState<UserRole>('candidate');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Phone OTP Flow States
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset phone confirmation state if method changes
    if (authMethod !== 'phone') {
      setOtpSent(false);
      setConfirmationResult(null);
    }
  }, [authMethod]);

  const handleRedirect = (user: any) => {
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
  };

  const authenticateWithBackend = async (idToken: string, displayName?: string, userEmail?: string) => {
    try {
      const res = await api.post('/auth/firebase', {
        idToken,
        role,
        name: displayName || name.trim() || undefined,
        email: userEmail || email.trim() || undefined,
      });
      const { user, accessToken } = res.data.data;
      loginUser(user, accessToken);
      addToast(`Welcome back, ${user.name || 'User'}! Authentication successful.`, 'success');
      handleRedirect(user);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to authenticate session with backend';
      addToast(msg, 'error');
    }
  };

  // 1. EMAIL + PASSWORD LOGIN
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      addToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken();
      await authenticateWithBackend(idToken, userCredential.user.displayName || undefined, email.trim());
    } catch (err: any) {
      const msg = err.message?.replace('Firebase: ', '') || 'Email login failed';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. EMAIL + PASSWORD SIGNUP
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      addToast('Please enter both email and password', 'error');
      return;
    }
    if (password.length < 6) {
      addToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(userCredential.user, { displayName: name.trim() });
      }
      const idToken = await userCredential.user.getIdToken();
      await authenticateWithBackend(idToken, name.trim(), email.trim());
    } catch (err: any) {
      const msg = err.message?.replace('Firebase: ', '') || 'Signup failed';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. GOOGLE SIGN-IN
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();
      await authenticateWithBackend(
        idToken,
        userCredential.user.displayName || undefined,
        userCredential.user.email || undefined
      );
    } catch (err: any) {
      const msg = err.message?.replace('Firebase: ', '') || 'Google authentication failed';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. PHONE OTP - SEND CODE
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      addToast('Please enter a valid phone number with country code (e.g. +919876543210)', 'error');
      return;
    }

    setLoading(true);
    try {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          // ignore cleanup error
        }
        (window as any).recaptchaVerifier = null;
      }
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }

      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      (window as any).recaptchaVerifier = recaptchaVerifier;

      const confirmation = await signInWithPhoneNumber(auth, phone.trim(), recaptchaVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      addToast('Verification code sent via SMS!', 'success');
    } catch (err: any) {
      const msg = err.message?.replace('Firebase: ', '') || 'Failed to send OTP to phone number';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. PHONE OTP - VERIFY CODE
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !confirmationResult) {
      addToast('Please enter the 6-digit verification code', 'error');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(code.trim());
      const idToken = await userCredential.user.getIdToken();
      await authenticateWithBackend(idToken);
    } catch (err: any) {
      const msg = err.message?.replace('Firebase: ', '') || 'Invalid or expired OTP code';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div id="recaptcha-container"></div>
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-premium">
        {/* Title Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Sign in to Job Portal
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Firebase Authentication for Email, Google, & Phone OTP
          </p>
        </div>

        {/* Role Selector */}
        <div>
          <span className="block text-xs font-semibold uppercase text-slate-500 mb-2">
            I am joining as a
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`flex items-center justify-center gap-2 p-3 border rounded-xl font-semibold text-xs transition-all ${
                role === 'candidate'
                  ? 'border-primary bg-indigo-50/30 text-primary ring-2 ring-primary/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`flex items-center justify-center gap-2 p-3 border rounded-xl font-semibold text-xs transition-all ${
                role === 'employer'
                  ? 'border-primary bg-indigo-50/30 text-primary ring-2 ring-primary/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Employer
            </button>
          </div>
        </div>

        {/* Method Toggle Tabs */}
        <div className="flex border-b border-slate-200 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setAuthMethod('email-login')}
            className={`flex-1 py-2.5 border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              authMethod === 'email-login'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Log In
          </button>

          <button
            type="button"
            onClick={() => setAuthMethod('email-signup')}
            className={`flex-1 py-2.5 border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              authMethod === 'email-signup'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up
          </button>

          <button
            type="button"
            onClick={() => setAuthMethod('google')}
            className={`flex-1 py-2.5 border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              authMethod === 'google'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Google
          </button>

          <button
            type="button"
            onClick={() => setAuthMethod('phone')}
            className={`flex-1 py-2.5 border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              authMethod === 'phone'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Phone
          </button>
        </div>

        {/* METHOD 1: EMAIL LOGIN */}
        {authMethod === 'email-login' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm border-slate-200 bg-slate-50/30 input-focus"
                />
                <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm border-slate-200 bg-slate-50/30 input-focus"
                />
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In with Password'}
            </button>
          </form>
        )}

        {/* METHOD 2: EMAIL SIGNUP */}
        {authMethod === 'email-signup' && (
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm border-slate-200 bg-slate-50/30 input-focus"
                />
                <UserIcon className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm border-slate-200 bg-slate-50/30 input-focus"
                />
                <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters..."
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm border-slate-200 bg-slate-50/30 input-focus"
                />
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account & Sign In'}
            </button>
          </form>
        )}

        {/* METHOD 3: GOOGLE AUTH */}
        {authMethod === 'google' && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Sign in or create an account instantly using your verified Google Account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.1 0-5.74-2.09-6.68-4.91H1.36v3.15C3.37 21.36 7.42 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.56H1.36C.49 8.29 0 10.09 0 12s.49 3.71 1.36 5.44l3.96-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.42 0 3.37 2.64 1.36 6.56l3.96 3.15c.94-2.82 3.58-4.91 6.68-4.91z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>
        )}

        {/* METHOD 4: PHONE OTP AUTH */}
        {authMethod === 'phone' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm border-slate-200 bg-slate-50/30 input-focus"
                    />
                    <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Include country code (e.g., +91 for India, +1 for US)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send Firebase SMS Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    Code sent to <strong className="text-slate-800">{phone}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-primary font-semibold hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label htmlFor="name" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Full Name (Optional for new users)
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border rounded-xl text-sm border-slate-200 bg-slate-50/30 input-focus"
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    6-Digit OTP Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-2 border rounded-xl text-base tracking-widest text-center border-slate-200 bg-slate-50/30 input-focus font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Verify Code & Sign In
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

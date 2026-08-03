import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { useToastStore } from '../context/toastStore';
import { Search, Bell, Menu, X, LogOut, Briefcase, User, Settings, FileText, Bookmark, Check } from 'lucide-react';
import api from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '../types';

export const Header: React.FC = () => {
  const { user, logoutUser } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [searchVal, setSearchVal] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!user) return [];
      const res = await api.get('/notifications');
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15 seconds for new notifications
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark all read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark single read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchVal.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    addToast('Logged out successfully', 'success');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-premium">
              <Briefcase className="h-5.5 w-5.5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              Job<span className="text-primary">Portal</span>
            </span>
          </Link>

          {/* Global Search inside Header (Desktop) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex relative max-w-xs w-64">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white input-focus"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </form>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link
            to="/jobs"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/jobs' ? 'text-primary' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Find Jobs
          </Link>

          {user?.role === 'candidate' && (
            <>
              <Link
                to="/candidate/dashboard"
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/candidate') ? 'text-primary' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/candidate/applications"
                className="text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Applications
              </Link>
            </>
          )}

          {user?.role === 'employer' && (
            <>
              <Link
                to="/employer/dashboard"
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/employer') ? 'text-primary' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Employer Hub
              </Link>
              <Link
                to="/employer/jobs"
                className="text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Manage Jobs
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin/dashboard"
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/admin/dashboard') ? 'text-primary' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/users"
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/admin/users') ? 'text-primary' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Users
              </Link>
              <Link
                to="/admin/jobs"
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/admin/jobs') ? 'text-primary' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Jobs
              </Link>
            </>
          )}
        </nav>

        {/* Auth / Action buttons */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-100 bg-white py-2 shadow-premium animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-2 pt-1">
                      <span className="text-sm font-semibold text-slate-800">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto px-1 py-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex flex-col gap-1 rounded-xl p-3 text-xs transition-colors hover:bg-slate-50 relative group ${
                              !notif.isRead ? 'bg-slate-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-800 leading-tight">
                                {notif.title}
                              </span>
                              {!notif.isRead && (
                                <button
                                  onClick={() => markReadMutation.mutate(notif.id)}
                                  className="text-primary hover:text-primary-dark p-0.5 rounded transition-colors shrink-0"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <span className="text-slate-500 leading-relaxed">
                              {notif.message}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1">
                              {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-primary font-bold text-sm">
                    {user.email.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user.email}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white py-2 shadow-premium animate-fade-in">
                    <div className="border-b border-slate-100 px-4 py-2">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="truncate text-sm font-semibold text-slate-800">{user.email}</p>
                      <span className="inline-block mt-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                        {user.role}
                      </span>
                    </div>
                    
                    <div className="px-1 py-1">
                      {user.role === 'candidate' && (
                        <>
                          <Link
                            to="/candidate/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <User className="h-4 w-4" />
                            Dashboard
                          </Link>
                          <Link
                            to="/candidate/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            My Profile
                          </Link>
                          <Link
                            to="/candidate/applications"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            Applications
                          </Link>
                          <Link
                            to="/candidate/saved"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Bookmark className="h-4 w-4" />
                            Saved Jobs
                          </Link>
                        </>
                      )}

                      {user.role === 'employer' && (
                        <>
                          <Link
                            to="/employer/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <User className="h-4 w-4" />
                            Employer Hub
                          </Link>
                          <Link
                            to="/employer/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            Company settings
                          </Link>
                          <Link
                            to="/employer/jobs/new"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Briefcase className="h-4 w-4" />
                            Post a Job
                          </Link>
                        </>
                      )}

                      {user.role === 'admin' && (
                        <>
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <User className="h-4 w-4" />
                            Dashboard
                          </Link>
                          <Link
                            to="/admin/users"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            Users Management
                          </Link>
                          <Link
                            to="/admin/jobs"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Briefcase className="h-4 w-4" />
                            Job Moderation
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-100 px-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden lg:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-2 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark shadow-premium hover-lift"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex p-2 rounded-xl text-slate-500 hover:bg-slate-50 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-4 shadow-lg animate-fade-in">
          
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white input-focus"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </form>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <Link
              to="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block border-b border-slate-50"
            >
              Find Jobs
            </Link>

            {user?.role === 'candidate' && (
              <>
                <Link
                  to="/candidate/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block border-b border-slate-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/candidate/applications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block border-b border-slate-50"
                >
                  My Applications
                </Link>
                <Link
                  to="/candidate/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block border-b border-slate-50"
                >
                  Saved Jobs
                </Link>
                <Link
                  to="/candidate/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block"
                >
                  Profile settings
                </Link>
              </>
            )}

            {user?.role === 'employer' && (
              <>
                <Link
                  to="/employer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block border-b border-slate-50"
                >
                  Employer Hub
                </Link>
                <Link
                  to="/employer/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block border-b border-slate-50"
                >
                  Manage Jobs
                </Link>
                <Link
                  to="/employer/jobs/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block border-b border-slate-50"
                >
                  Post a Job
                </Link>
                <Link
                  to="/employer/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block"
                >
                  Company settings
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block border-b border-slate-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block border-b border-slate-50"
                >
                  Users
                </Link>
                <Link
                  to="/admin/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary py-2 block"
                >
                  Jobs
                </Link>
              </>
            )}
          </div>

          {!user && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark shadow transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
          {user && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-center py-2 text-sm font-semibold text-white bg-error rounded-xl hover:bg-red-600 shadow transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

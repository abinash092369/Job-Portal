import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToastStore } from '../../context/toastStore';
import type { User } from '../../types';
import { Search, Ban, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight, UserPlus, UserMinus } from 'lucide-react';
import { JobCardSkeleton } from '../../components/Skeletons';

export const UserManagement: React.FC = () => {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data.data;
    },
  });

  // Toggle user suspension mutation
  const toggleSuspensionMutation = useMutation({
    mutationFn: async ({ id, isSuspended }: { id: string; isSuspended: boolean }) => {
      const res = await api.patch(`/admin/users/${id}/suspend`, { isSuspended });
      return res.data.data;
    },
    onSuccess: (data) => {
      const action = data.isSuspended ? 'suspended' : 'unsuspended';
      addToast(`User successfully ${action}!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update user status';
      addToast(msg, 'error');
    },
  });

  const handleSuspendClick = (user: User) => {
    const isSuspended = !user.isSuspended;
    const actionText = isSuspended ? 'suspend' : 'unsuspend';
    if (window.confirm(`Are you sure you want to ${actionText} user: ${user.email || user.phone || user.name}?`)) {
      toggleSuspensionMutation.mutate({ id: user.id, isSuspended });
    }
  };

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const identifier = `${user.email || ''} ${user.phone || ''} ${user.name || ''}`;
      const matchesSearch = identifier.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      
      let matchesStatus = true;
      if (selectedStatus === 'suspended') {
        matchesStatus = !!user.isSuspended;
      } else if (selectedStatus === 'active') {
        matchesStatus = !user.isSuspended;
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'employer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'candidate':
        return 'bg-indigo-50 text-primary border-indigo-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-6 animate-fade-in">
      
      {/* Back button */}
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">User Management</h1>
          <p className="text-slate-500 text-xs mt-1">Suspend, unsuspend, verify employers, or inspect role designations for all registered users.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <input
            type="text"
            placeholder="Search by user email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white input-focus"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
        </div>

        {/* Role Filter */}
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-40 py-2.5 px-3 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-600 focus:bg-white input-focus focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="candidate">Candidate</option>
            <option value="employer">Employer</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-40 py-2.5 px-3 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-600 focus:bg-white input-focus focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-16 text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-primary mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No users found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Try adjusting your search query or filters to find standard registrations.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase">
                  <th className="px-6 py-4 font-semibold">User Details</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Auth Provider</th>
                  <th className="px-6 py-4 font-semibold">Suspended status</th>
                  <th className="px-6 py-4 font-semibold">Registration Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/30 group">
                    <td className="px-6 py-4.5 font-bold text-slate-800">{user.email || user.phone || user.name || user.id}</td>
                    
                    <td className="px-6 py-4.5">
                      <span className={`text-[9px] font-bold border px-2.5 py-0.5 rounded-full uppercase ${getRoleBadgeStyle(user.role)}`}>
                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-4.5">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold border border-slate-100 bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-full uppercase">
                        {user.provider}
                      </span>
                    </td>

                    <td className="px-6 py-4.5">
                      {user.isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold border border-rose-100 bg-rose-50 text-error px-2.5 py-0.5 rounded-full uppercase">
                          <Ban className="w-3.5 h-3.5" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold border border-emerald-100 bg-emerald-50 text-success px-2.5 py-0.5 rounded-full uppercase">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4.5 text-slate-500 font-medium">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-6 py-4.5 text-right space-x-1.5 shrink-0">
                      {/* Suspension action */}
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleSuspendClick(user)}
                          className={`p-1.5 border rounded-lg transition-colors inline-flex ${
                            user.isSuspended
                              ? 'border-slate-200 text-success hover:bg-emerald-50'
                              : 'border-slate-200 text-error hover:bg-rose-50'
                          }`}
                          title={user.isSuspended ? 'Unsuspend User' : 'Suspend User'}
                        >
                          {user.isSuspended ? <UserPlus className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <span className="text-xs text-slate-500">
                Showing Page <span className="font-bold text-slate-700">{currentPage}</span> of <span className="font-bold text-slate-700">{totalPages}</span> ({filteredUsers.length} total users)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

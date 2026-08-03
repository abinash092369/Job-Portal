import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Job, Application } from '../../types';
import { useToastStore } from '../../context/toastStore';
import { ArrowLeft, ChevronRight, MessageSquare, Loader2, Download, ExternalLink, X } from 'lucide-react';
import { CandidateCardSkeleton } from '../../components/Skeletons';

const stages: { id: Application['status']; label: string; color: string }[] = [
  { id: 'applied', label: 'Applied', color: 'border-t-2 border-blue-400' },
  { id: 'reviewed', label: 'Reviewed', color: 'border-t-2 border-indigo-400' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'border-t-2 border-amber-400' },
  { id: 'interview', label: 'Interview', color: 'border-t-2 border-violet-400' },
  { id: 'hired', label: 'Hired', color: 'border-t-2 border-emerald-400' },
  { id: 'rejected', label: 'Rejected', color: 'border-t-2 border-rose-400' },
];

export const ApplicantTracking: React.FC = () => {
  const { id: jobId } = useParams<{ id: string }>();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');

  // Fetch job metadata
  const { data: job } = useQuery<Job>({
    queryKey: ['jobDetail', jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}`);
      return res.data.data;
    },
    enabled: !!jobId,
  });

  // Fetch applications for this job
  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ['jobApplications', jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}/applications`);
      return res.data.data;
    },
    enabled: !!jobId,
  });

  // Find active application for detail view
  const activeApp = applications.find((a) => a.id === activeAppId);

  // Update applicant status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: Application['status'] }) => {
      await api.patch(`/applications/${appId}/status`, { status });
    },
    onSuccess: () => {
      addToast('Applicant status updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
      queryClient.invalidateQueries({ queryKey: ['employerDashboard'] });
    },
    onError: () => {
      addToast('Failed to update candidate status', 'error');
    },
  });

  // Add private note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ appId, note }: { appId: string; note: string }) => {
      await api.post(`/applications/${appId}/notes`, { note });
    },
    onSuccess: () => {
      addToast('Private note added', 'success');
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
    },
    onError: () => {
      addToast('Failed to add private note', 'error');
    },
  });

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim() && activeAppId) {
      addNoteMutation.mutate({ appId: activeAppId, note: newNote.trim() });
    }
  };

  const handleStageChange = (appId: string, status: Application['status']) => {
    updateStatusMutation.mutate({ appId, status });
  };

  // Group applications by status stage
  const groupedApps = React.useMemo(() => {
    const map: Record<Application['status'], Application[]> = {
      applied: [],
      reviewed: [],
      shortlisted: [],
      interview: [],
      hired: [],
      rejected: [],
    };
    applications.forEach((app) => {
      if (map[app.status]) {
        map[app.status].push(app);
      }
    });
    return map;
  }, [applications]);

  const staticApiUrl = 'http://localhost:5000';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen space-y-6 animate-fade-in">
      
      {/* Back link */}
      <Link to="/employer/jobs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Listings
      </Link>

      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">
            Applicant Funnel Board
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Role: <span className="font-semibold text-slate-700">{job?.title || 'Loading position...'}</span>
          </p>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shrink-0">
          Total Candidates: {applications.length}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CandidateCardSkeleton />
          <CandidateCardSkeleton />
          <CandidateCardSkeleton />
        </div>
      ) : (
        /* Kanban Columns Grid */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1100px] items-start">
            
            {stages.map((stage) => {
              const list = groupedApps[stage.id] || [];
              return (
                <div key={stage.id} className="flex-1 min-w-[220px] bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  
                  {/* Column Header */}
                  <div className={`pt-2 flex justify-between items-center ${stage.color}`}>
                    <span className="text-xs font-bold text-slate-800 tracking-tight">{stage.label}</span>
                    <span className="text-[10px] bg-slate-200/50 text-slate-500 font-bold px-2 py-0.5 rounded-full shrink-0">
                      {list.length}
                    </span>
                  </div>

                  {/* List container */}
                  <div className="space-y-3 min-h-[300px]">
                    {list.length === 0 ? (
                      <div className="text-center py-12 text-[10px] text-slate-400">
                        Drag or drop stage here
                      </div>
                    ) : (
                      list.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => setActiveAppId(app.id)}
                          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-premium hover-lift cursor-pointer space-y-3"
                        >
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-800 leading-tight block truncate">
                              {app.candidateName}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {app.candidateEmail}
                            </span>
                          </div>

                          {/* Skills preview */}
                          {app.candidateSkills && app.candidateSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {app.candidateSkills.slice(0, 2).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] bg-slate-50 border border-slate-200/40 px-1.5 py-0.5 rounded text-slate-500 font-semibold"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                            <span className="text-[9px] text-slate-400">
                              {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* Candidate Details Sidebar Drawer Modal */}
      {activeApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800">{activeApp.candidateName}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{activeApp.candidateEmail}</p>
              </div>
              <button
                onClick={() => setActiveAppId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Funnel Stage controls */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700">Funnel Stage</span>
                <div className="flex flex-wrap gap-1.5">
                  {stages.map((st) => {
                    const isActive = activeApp.status === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => handleStageChange(activeApp.id, st.id)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          isActive
                            ? 'bg-primary text-white border-primary shadow'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skills stack */}
              {activeApp.candidateSkills && activeApp.candidateSkills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tech Stack Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeApp.candidateSkills.map((sk) => (
                      <span
                        key={sk}
                        className="text-xs bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-lg text-slate-600 font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cover Letter</h4>
                <p className="text-xs text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                  {activeApp.coverLetter || 'No cover letter submitted.'}
                </p>
              </div>

              {/* Screening Answers */}
              {activeApp.screeningAnswers && activeApp.screeningAnswers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Screening Answers</h4>
                  <div className="space-y-3">
                    {activeApp.screeningAnswers.map((ans, idx) => (
                      <div key={idx} className="p-3 bg-indigo-50/20 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[11px] font-bold text-slate-700 leading-relaxed block">{ans.question}</span>
                        <span className="text-xs text-slate-600 block pl-1 italic">Answer: "{ans.answer}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume download / view */}
              <div className="space-y-2 border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Resume Attachment</h4>
                <div className="flex items-center gap-2">
                  <a
                    href={activeApp.resumeUrl.startsWith('http') ? activeApp.resumeUrl : `${staticApiUrl}${activeApp.resumeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="w-4 h-4" /> Download Resume
                  </a>
                  <a
                    href={activeApp.resumeUrl.startsWith('http') ? activeApp.resumeUrl : `${staticApiUrl}${activeApp.resumeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-indigo-50/70"
                  >
                    <ExternalLink className="w-4 h-4" /> View Resume Inline
                  </a>
                </div>
              </div>

              {/* Private Notes Section */}
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4.5 h-4.5 text-primary" /> Private Feedback Comments ({activeApp.notes?.length || 0})
                </h4>

                <div className="space-y-2">
                  {activeApp.notes && activeApp.notes.length > 0 ? (
                    activeApp.notes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 leading-relaxed font-medium">
                        {note}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic pl-1">No feedback comments written yet.</p>
                  )}
                </div>

                {/* Form to submit note */}
                <form onSubmit={handleNoteSubmit} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Write a private interview note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-grow text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white input-focus"
                  />
                  <button
                    type="submit"
                    disabled={addNoteMutation.isPending}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 shrink-0"
                  >
                    {addNoteMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Save Note'
                    )}
                  </button>
                </form>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 text-right shrink-0">
              <button
                type="button"
                onClick={() => setActiveAppId(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

import React from 'react';
import { MapPin } from 'lucide-react';

interface FilterSidebarProps {
  className?: string;
  locationVal: string;
  setLocationVal: (val: string) => void;
  selectedJobTypes: string[];
  toggleJobType: (typeId: string) => void;
  remoteOnly: boolean;
  setRemoteOnly: (remote: boolean) => void;
  salaryMin: string;
  setSalaryMin: (val: string) => void;
  selectedExp: string;
  setSelectedExp: (val: string) => void;
  selectedSkills: string[];
  toggleSkill: (skill: string) => void;
}

export const experienceOptions = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead/Manager'];

export const jobTypes = [
  { id: 'full-time', label: 'Full Time' },
  { id: 'part-time', label: 'Part Time' },
  { id: 'contract', label: 'Contract' },
  { id: 'remote', label: 'Remote' },
];

export const popularSkills = ['React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Docker', 'AWS', 'Figma'];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  className = 'bg-white rounded-2xl border border-slate-100 p-6 shadow-premium space-y-6',
  locationVal,
  setLocationVal,
  selectedJobTypes,
  toggleJobType,
  remoteOnly,
  setRemoteOnly,
  salaryMin,
  setSalaryMin,
  selectedExp,
  setSelectedExp,
  selectedSkills,
  toggleSkill,
}) => {
  return (
    <div className={className} data-testid="filter-sidebar">
      {/* Location filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Location</label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. Remote, San Francisco"
            value={locationVal}
            onChange={(e) => setLocationVal(e.target.value)}
            className="w-full text-xs pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white input-focus"
          />
          <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Job Types */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Job Type</label>
        <div className="space-y-2">
          {jobTypes.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={selectedJobTypes.includes(t.id)}
                onChange={() => toggleJobType(t.id)}
                className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {/* Remote Only Toggle */}
      <div className="flex items-center justify-between border-t border-slate-50 pt-4">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Remote Only</span>
        <button
          type="button"
          aria-label="Toggle remote only"
          onClick={() => setRemoteOnly(!remoteOnly)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            remoteOnly ? 'bg-primary' : 'bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              remoteOnly ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Minimum Salary */}
      <div className="space-y-2 border-t border-slate-50 pt-4">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Min Annual Salary ($)</label>
        <input
          type="number"
          placeholder="e.g. 80000"
          value={salaryMin}
          onChange={(e) => setSalaryMin(e.target.value)}
          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white input-focus"
        />
      </div>

      {/* Experience Level */}
      <div className="space-y-2 border-t border-slate-50 pt-4">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Experience Level</label>
        <select
          value={selectedExp}
          onChange={(e) => setSelectedExp(e.target.value)}
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 input-focus"
        >
          <option value="">Any Experience Level</option>
          {experienceOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Skills tags */}
      <div className="space-y-2 border-t border-slate-50 pt-4">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Filter by Tech Stack</label>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {popularSkills.map((skill) => {
            const active = selectedSkills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors border ${
                  active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

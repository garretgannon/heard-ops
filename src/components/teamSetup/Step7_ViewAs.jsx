import { useState } from 'react';
import { motion } from 'framer-motion';

const PREVIEW_ROLES = [
  { key: 'staff', label: 'Staff' },
  { key: 'bartender', label: 'Bartender' },
  { key: 'server', label: 'Server' },
  { key: 'cook', label: 'Cook' },
  { key: 'shift_lead', label: 'Shift Lead' },
  { key: 'manager', label: 'Manager' },
];

const SAMPLE_TASKS = {
  staff: ['Open Sidework', 'Station Setup', 'Closing Duties'],
  bartender: ['Opening Bar Checklist', 'Bar Prep', 'Garnish Station'],
  server: ['Opening Sidework', 'Table Setup', 'Closing Sidework'],
  cook: ['Opening Line Check', 'Prep List', 'Temp Log'],
  shift_lead: ['Team Brief', 'Station Check', 'Approve Sidework'],
  manager: ['Shift Review', 'Approvals', 'Staff Check-in'],
};

const VISIBLE_MODULES = {
  staff: ['Today', 'Tasks', 'Schedule', 'Logs'],
  bartender: ['Today', 'Tasks', 'Schedule', 'Logs', 'Training'],
  server: ['Today', 'Tasks', 'Schedule', 'Logs', 'Training'],
  cook: ['Today', 'Tasks', 'Logs', 'Training'],
  shift_lead: ['Today', 'Tasks', 'Schedule', 'Logs', 'Stations', 'People'],
  manager: ['Today', 'Tasks', 'Schedule', 'Logs', 'Stations', 'People', 'Reports'],
};

export default function Step7_ViewAs({ jobCodes, roles, access, responsibilities, onNext, onBack }) {
  const [activeRole, setActiveRole] = useState('staff');

  const tasks = SAMPLE_TASKS[activeRole] || [];
  const modules = VISIBLE_MODULES[activeRole] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5 py-6 max-w-2xl"
    >
      <div>
        <h2 className="text-2xl font-extrabold text-white mb-1">Preview as Role</h2>
        <p className="text-sm text-white/40">See what the app looks like for each team member.</p>
      </div>

      {/* Role selector */}
      <div className="flex flex-wrap gap-2">
        {PREVIEW_ROLES.map((r) => (
          <button
            key={r.key}
            onClick={() => setActiveRole(r.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={
              activeRole === r.key
                ? { background: '#FF6B00', color: 'white' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Phone frame preview */}
      <div className="flex flex-col sm:flex-row gap-6">
        <div
          className="relative mx-auto sm:mx-0"
          style={{
            width: 220,
            height: 420,
            background: 'rgba(255,255,255,0.04)',
            border: '2px solid rgba(255,255,255,0.15)',
            borderRadius: 32,
            overflow: 'hidden',
          }}
        >
          {/* Status bar mock */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-[10px] text-white/40">9:41</span>
            <span className="text-[10px] text-white/40">●●●</span>
          </div>

          {/* App header mock */}
          <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-bold text-white">
              {PREVIEW_ROLES.find((r) => r.key === activeRole)?.label} View
            </p>
          </div>

          {/* Module list */}
          <div className="px-3 py-2">
            <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Modules</p>
            <div className="flex flex-wrap gap-1">
              {modules.map((mod) => (
                <span
                  key={mod}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                  style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}
                >
                  {mod}
                </span>
              ))}
            </div>
          </div>

          {/* Task list */}
          <div className="px-3 py-2">
            <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Today's Tasks</p>
            <div className="flex flex-col gap-1.5">
              {tasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ border: '1.5px solid rgba(255,255,255,0.2)' }} />
                  <p className="text-[10px] text-white/70 leading-tight">{task}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav mock */}
          <div
            className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-around px-4"
            style={{ background: 'rgba(5,8,14,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            {['☀️', '✅', '📅', '⋯'].map((icon, i) => (
              <span key={i} className="text-sm opacity-60">{icon}</span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-3 flex-1">
          <div
            className="p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}
          >
            <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Visible Modules</p>
            <p className="text-sm text-white/70">{modules.join(', ')}</p>
          </div>
          <div
            className="p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}
          >
            <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Sample Tasks</p>
            <ul className="flex flex-col gap-1">
              {tasks.map((t, i) => (
                <li key={i} className="text-sm text-white/70 flex items-center gap-2">
                  <span style={{ color: '#FF6B00' }}>›</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Desktop CTAs */}
      <div className="hidden lg:flex items-center gap-3 mt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)' }}
        >
          Continue →
        </button>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 flex gap-3 z-20" style={{ background: 'rgba(5,8,14,0.97)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-[2] py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)' }}
        >
          Review Setup →
        </button>
      </div>
    </motion.div>
  );
}

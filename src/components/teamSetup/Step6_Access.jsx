import { motion } from 'framer-motion';

const MODULES = [
  { key: 'today', label: 'Today', icon: '☀️', defaultState: 'visible' },
  { key: 'tasks', label: 'Tasks', icon: '✅', defaultState: 'visible' },
  { key: 'schedule', label: 'Schedule', icon: '📅', defaultState: 'visible' },
  { key: 'logs', label: 'Logs', icon: '📋', defaultState: 'visible' },
  { key: 'training', label: 'Training', icon: '🎓', defaultState: 'visible' },
  { key: 'stations', label: 'Stations', icon: '📍', defaultState: 'visible' },
  { key: 'people', label: 'People', icon: '👥', defaultState: 'locked' },
  { key: 'reports', label: 'Reports', icon: '📊', defaultState: 'locked' },
  { key: 'settings', label: 'Settings', icon: '⚙️', defaultState: 'locked' },
  { key: 'billing', label: 'Billing', icon: '💳', defaultState: 'hidden' },
];

const STATES = ['visible', 'locked', 'hidden'];

const STATE_STYLES = {
  visible: { label: '✓', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' },
  locked: { label: '🔒', bg: 'rgba(230,106,31,0.15)', border: 'rgba(230,106,31,0.3)', text: '#E66A1F' },
  hidden: { label: '—', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.2)' },
};

function getInitialAccess() {
  const acc = {};
  MODULES.forEach((m) => { acc[m.key] = m.defaultState; });
  return acc;
}

export default function Step6_Access({ access, roles, onChange, onNext, onBack }) {
  const effectiveAccess = Object.keys(access).length === 0 ? getInitialAccess() : access;

  function cycleState(key) {
    const current = effectiveAccess[key] || 'visible';
    const next = STATES[(STATES.indexOf(current) + 1) % STATES.length];
    onChange({ ...effectiveAccess, [key]: next });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5 py-6 max-w-2xl"
    >
      <div>
        <h2 className="text-2xl font-extrabold text-white mb-1">Access & Visibility</h2>
        <p className="text-sm text-white/40">Control which parts of heardOS your team can see and use.</p>
      </div>

      {/* Concept callout */}
      <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(230,106,31,0.06)', border: '1px solid rgba(230,106,31,0.15)' }}>
        <span className="text-lg shrink-0 mt-0.5">🔐</span>
        <div>
          <p className="text-sm font-semibold text-white/90 mb-0.5">
            <span style={{ color: '#E66A1F' }}>Access</span> = what your team sees when they open heardOS.
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            <span className="text-green-400">Visible</span> — anyone can access. <span style={{ color: '#E66A1F' }}>Locked</span> — only managers and admins. <span className="text-white/40">Hidden</span> — not shown at all. Click each module to cycle through states. Staff typically see Tasks, Logs, and Training. Keep Reports, People, and Settings locked.
          </p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/30 mb-3">App Modules — click to change</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {[
          { state: 'visible', desc: 'All staff can see' },
          { state: 'locked', desc: 'Managers only' },
          { state: 'hidden', desc: 'Not visible' },
        ].map(({ state, desc }) => {
          const s = STATE_STYLES[state];
          return (
            <div key={state} className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
              >
                {s.label}
              </span>
              <p className="text-xs text-white/40">{desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MODULES.map((mod) => {
          const state = effectiveAccess[mod.key] || mod.defaultState;
          const s = STATE_STYLES[state];
          return (
            <button
              key={mod.key}
              onClick={() => cycleState(mod.key)}
              className="flex flex-col gap-2 p-4 rounded-xl text-left transition-all active:scale-[0.97]"
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 12,
                opacity: state === 'hidden' ? 0.5 : 1,
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xl">{mod.icon}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ color: s.text, background: `${s.bg}` }}
                >
                  {s.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">{mod.label}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: s.text }}>
                {state}
              </p>
            </button>
          );
        })}
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
          style={{ background: 'linear-gradient(135deg, #E66A1F 0%, #d45a14 100%)' }}
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
          style={{ background: 'linear-gradient(135deg, #E66A1F 0%, #d45a14 100%)' }}
        >
          Continue →
        </button>
      </div>
    </motion.div>
  );
}

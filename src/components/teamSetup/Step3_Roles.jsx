import { useState } from 'react';
import { motion } from 'framer-motion';

const ROLE_PRESETS = [
  { name: 'Staff', level: 'staff', description: 'Complete tasks, submit logs, view schedule' },
  { name: 'Trainer', level: 'lead', description: 'All staff + can sign off training' },
  { name: 'Shift Lead', level: 'lead', description: 'All trainer + assign tasks, approve checklists' },
  { name: 'Manager', level: 'manager', description: 'All shift lead + edit schedules, approve requests' },
  { name: 'Admin', level: 'admin', description: 'Full access to everything' },
];

const LEVEL_COLORS = {
  staff: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  lead: { bg: 'rgba(234,179,8,0.15)', text: '#eab308' },
  manager: { bg: 'rgba(230,106,31,0.15)', text: '#E66A1F' },
  admin: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
};

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Step3_Roles({ roles, onChange, onNext, onBack }) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customLevel, setCustomLevel] = useState('staff');

  const selectedNames = roles.map((r) => r.name);

  function togglePreset(preset) {
    if (selectedNames.includes(preset.name)) {
      onChange(roles.filter((r) => r.name !== preset.name));
    } else {
      onChange([...roles, { ...preset, id: genId(), permissions: {} }]);
    }
  }

  function addCustom() {
    if (!customName.trim()) return;
    onChange([
      ...roles,
      { id: genId(), name: customName.trim(), level: customLevel, description: customDesc.trim(), permissions: {} },
    ]);
    setCustomName('');
    setCustomDesc('');
    setCustomLevel('staff');
    setShowCustomForm(false);
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
        <h2 className="text-2xl font-extrabold text-white mb-1">Roles</h2>
        <p className="text-sm text-white/40">Select the roles that exist in your restaurant hierarchy.</p>
      </div>

      {/* Concept callout */}
      <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(230,106,31,0.06)', border: '1px solid rgba(230,106,31,0.15)' }}>
        <span className="text-lg shrink-0 mt-0.5">🛡️</span>
        <div>
          <p className="text-sm font-semibold text-white/90 mb-0.5">
            <span style={{ color: '#E66A1F' }}>Role</span> = what someone can see and do in heardOS.
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            Roles are different from job codes. A "Line Cook" is a job code (what they do). "Staff" is a role (what they can access). A Line Cook might have the Staff role — meaning they can complete tasks and submit logs, but can't edit schedules or approve requests.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {ROLE_PRESETS.map((preset) => {
          const isSelected = selectedNames.includes(preset.name);
          const lvlStyle = LEVEL_COLORS[preset.level] || LEVEL_COLORS.staff;
          return (
            <button
              key={preset.name}
              onClick={() => togglePreset(preset)}
              className="flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-150 active:scale-[0.98] w-full"
              style={
                isSelected
                  ? { background: 'rgba(230,106,31,0.08)', border: '1px solid rgba(230,106,31,0.4)', borderRadius: 12 }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }
              }
            >
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{preset.name}</p>
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase"
                    style={{ background: lvlStyle.bg, color: lvlStyle.text }}
                  >
                    {preset.level}
                  </span>
                </div>
                <p className="text-xs text-white/40">{preset.description}</p>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={
                  isSelected
                    ? { background: '#E66A1F', borderColor: '#E66A1F' }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.2)' }
                }
              >
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom roles already added */}
      {roles.filter((r) => !ROLE_PRESETS.some((p) => p.name === r.name)).map((r) => {
        const lvlStyle = LEVEL_COLORS[r.level] || LEVEL_COLORS.staff;
        return (
          <div
            key={r.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(230,106,31,0.06)', border: '1px solid rgba(230,106,31,0.25)', borderRadius: 12 }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">{r.name}</p>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase" style={{ background: lvlStyle.bg, color: lvlStyle.text }}>
                  {r.level}
                </span>
              </div>
              {r.description && <p className="text-xs text-white/40 mt-0.5">{r.description}</p>}
            </div>
            <button
              onClick={() => onChange(roles.filter((role) => role.id !== r.id))}
              className="text-white/30 hover:text-red-400 text-xs transition-colors"
            >
              Remove
            </button>
          </div>
        );
      })}

      {/* Custom role form */}
      {showCustomForm ? (
        <div
          className="flex flex-col gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
        >
          <input
            autoFocus
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Role name"
            className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <input
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <select
            value={customLevel}
            onChange={(e) => setCustomLevel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <option value="staff">Staff</option>
            <option value="lead">Lead</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={addCustom}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#E66A1F' }}
            >
              Add Role
            </button>
            <button
              onClick={() => { setShowCustomForm(false); setCustomName(''); setCustomDesc(''); }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/50"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCustomForm(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
          style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 12 }}
        >
          <span className="text-lg leading-none">+</span> Add Custom Role
        </button>
      )}

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

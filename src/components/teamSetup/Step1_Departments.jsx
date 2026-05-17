import { useState } from 'react';
import { cn } from '@/lib/utils';

const PRESETS = [
  { slug: 'foh', name: 'FOH', description: 'Servers, Hosts, Runners, Bussers', icon: '🍽️', color: '#3b82f6' },
  { slug: 'boh', name: 'BOH', description: 'Cooks, Prep, Dish, Expo', icon: '👨‍🍳', color: '#f97316' },
  { slug: 'bar', name: 'Bar', description: 'Bartenders, Barbacks', icon: '🍷', color: '#8b5cf6' },
  { slug: 'leadership', name: 'Leadership', description: 'Managers, Leads, Chefs', icon: '⭐', color: '#22c55e' },
];

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Step1_Departments({ departments, onChange, onNext, onBack }) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const selectedSlugs = departments.map((d) => d.slug);

  function togglePreset(preset) {
    if (selectedSlugs.includes(preset.slug)) {
      onChange(departments.filter((d) => d.slug !== preset.slug));
    } else {
      onChange([...departments, { ...preset, id: genId() }]);
    }
  }

  function addCustom() {
    if (!customName.trim()) return;
    const slug = customName.trim().toLowerCase().replace(/\s+/g, '_') + '_' + genId();
    onChange([
      ...departments,
      { id: genId(), name: customName.trim(), slug, description: customDesc.trim(), icon: '🏷️', color: '#E66A1F' },
    ]);
    setCustomName('');
    setCustomDesc('');
    setShowCustomForm(false);
  }

  const canContinue = departments.length > 0;

  return (
    <div className="flex flex-col gap-5 py-4 max-w-2xl">
      <div>
        <h2 className="text-2xl font-extrabold text-white mb-1">Departments</h2>
        <p className="text-sm text-white/40">Select the areas that make up your restaurant.</p>
      </div>

      {/* Concept callout */}
      <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(230,106,31,0.06)', border: '1px solid rgba(230,106,31,0.15)' }}>
        <span className="text-lg shrink-0 mt-0.5">📂</span>
        <div>
          <p className="text-sm font-semibold text-white/90 mb-0.5">
            <span style={{ color: '#E66A1F' }}>Department</span> = a group of related positions.
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            FOH (front of house) covers servers and hosts. BOH (back of house) covers cooks and prep. Bar and Leadership are their own groups. Departments let you filter job codes, assign tasks, and organize your team in heardOS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRESETS.map((preset) => {
          const isSelected = selectedSlugs.includes(preset.slug);
          return (
            <button
              key={preset.slug}
              onClick={() => togglePreset(preset)}
              className="flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-150 active:scale-[0.98]"
              style={
                isSelected
                  ? { background: 'rgba(230,106,31,0.08)', border: '1px solid rgba(230,106,31,0.4)', borderRadius: 12 }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }
              }
            >
              <span className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: `${preset.color}22` }}>
                {preset.icon}
              </span>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{preset.name}</p>
                <p className="text-xs text-white/40 truncate">{preset.description}</p>
              </div>
              {isSelected && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E66A1F' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {departments.filter((d) => !PRESETS.some((p) => p.slug === d.slug)).map((d) => (
        <div key={d.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(230,106,31,0.06)', border: '1px solid rgba(230,106,31,0.25)', borderRadius: 12 }}>
          <span className="text-lg">{d.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{d.name}</p>
            {d.description && <p className="text-xs text-white/40">{d.description}</p>}
          </div>
          <button onClick={() => onChange(departments.filter((dep) => dep.id !== d.id))} className="text-white/30 hover:text-red-400 text-xs transition-colors">
            Remove
          </button>
        </div>
      ))}

      {showCustomForm ? (
        <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
          <input autoFocus value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Department name" className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
          <input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="Short description (optional)" className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
          <div className="flex gap-2">
            <button onClick={addCustom} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#E66A1F' }}>Add</button>
            <button onClick={() => { setShowCustomForm(false); setCustomName(''); setCustomDesc(''); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white/50" style={{ background: 'rgba(255,255,255,0.05)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowCustomForm(true)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 12 }}>
          <span className="text-lg leading-none">+</span> Add Custom Department
        </button>
      )}

      <div className="hidden lg:flex items-center gap-3 mt-2">
        <button onClick={onBack} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Back</button>
        <button onClick={onNext} disabled={!canContinue} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #E66A1F 0%, #d45a14 100%)' }}>Continue →</button>
        {!canContinue && <p className="text-xs text-white/30">Select at least one department.</p>}
      </div>

      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 flex gap-3 z-20" style={{ background: 'rgba(5,8,14,0.97)', backdropFilter: 'blur(12px)' }}>
        <button onClick={onBack} className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Back</button>
        <button onClick={onNext} disabled={!canContinue} className="flex-[2] py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #E66A1F 0%, #d45a14 100%)' }}>Continue →</button>
      </div>
    </div>
  );
}

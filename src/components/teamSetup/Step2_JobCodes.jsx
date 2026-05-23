import { useState } from 'react';
import { motion } from 'framer-motion';

const SUGGESTIONS = {
  foh: ['Server', 'Host', 'Busser', 'Food Runner', 'Expo'],
  boh: ['Line Cook', 'Prep Cook', 'Dishwasher', 'Sous Chef', 'Chef'],
  bar: ['Bartender', 'Barback', 'Cocktail Server'],
  leadership: ['Shift Lead', 'Manager', 'Assistant Manager', 'GM'],
};

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Step2_JobCodes({ jobCodes, departments, onChange, onNext, onBack }) {
  const [activeDept, setActiveDept] = useState(departments[0]?.slug || '');
  const [customInputs, setCustomInputs] = useState({});

  const currentDept = departments.find((d) => d.slug === activeDept);
  const suggestions = SUGGESTIONS[activeDept] || [];
  const addedNames = jobCodes.map((j) => j.name);

  function addJobCode(name, department) {
    if (addedNames.includes(name)) return;
    onChange([...jobCodes, { id: genId(), name, department, description: '' }]);
  }

  function removeJobCode(id) {
    onChange(jobCodes.filter((j) => j.id !== id));
  }

  function addCustom(deptSlug) {
    const val = (customInputs[deptSlug] || '').trim();
    if (!val) return;
    addJobCode(val, deptSlug);
    setCustomInputs((prev) => ({ ...prev, [deptSlug]: '' }));
  }

  const canContinue = jobCodes.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5 py-6 max-w-2xl"
    >
      <div>
        <h2 className="text-2xl font-extrabold text-white mb-1">Job Codes</h2>
        <p className="text-sm text-white/40">Add the positions that exist in your restaurant.</p>
      </div>

      {/* Concept callout */}
      <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.15)' }}>
        <span className="text-lg shrink-0 mt-0.5">🏷️</span>
        <div>
          <p className="text-sm font-semibold text-white/90 mb-0.5">
            <span style={{ color: '#FF6B00' }}>Job code</span> = a specific position at your restaurant.
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            Like "Line Cook," "Bartender," or "Server." Job codes control how shifts are scheduled, how tasks get routed, and how labor is reported. One person can hold multiple job codes (e.g., a server who also trains).
          </p>
        </div>
      </div>

      {/* Department tabs */}
      <div className="flex flex-wrap gap-2">
        {departments.map((dept) => (
          <button
            key={dept.slug}
            onClick={() => setActiveDept(dept.slug)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={
              activeDept === dept.slug
                ? { background: '#FF6B00', color: 'white' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {dept.name}
          </button>
        ))}
      </div>

      {/* Suggestions for active dept */}
      {currentDept && (
        <div
          className="p-4 rounded-xl flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}
        >
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Suggested for {currentDept.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((name) => {
              const added = addedNames.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => !added && addJobCode(name, activeDept)}
                  disabled={added}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={
                    added
                      ? { background: 'rgba(255,107,0,0.15)', color: 'rgba(255,107,0,0.6)', border: '1px solid rgba(255,107,0,0.25)' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }
                  }
                >
                  {added ? '✓ ' : '+ '}{name}
                </button>
              );
            })}
          </div>

          {/* Custom input for this dept */}
          <div className="flex gap-2 mt-1">
            <input
              value={customInputs[activeDept] || ''}
              onChange={(e) => setCustomInputs((prev) => ({ ...prev, [activeDept]: e.target.value }))}
              placeholder="Add custom job code…"
              className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/25 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onKeyDown={(e) => e.key === 'Enter' && addCustom(activeDept)}
            />
            <button
              onClick={() => addCustom(activeDept)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#FF6B00' }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Added job codes */}
      {jobCodes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Added ({jobCodes.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {jobCodes.map((jc) => {
              const dept = departments.find((d) => d.slug === jc.department);
              return (
                <div
                  key={jc.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 8 }}
                >
                  <span className="text-white">{jc.name}</span>
                  {dept && <span className="text-white/30 text-[10px]">{dept.name}</span>}
                  <button
                    onClick={() => removeJobCode(jc.id)}
                    className="text-white/30 hover:text-red-400 ml-1 transition-colors leading-none"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
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
          disabled={!canContinue}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)' }}
        >
          Continue →
        </button>
        {!canContinue && <p className="text-xs text-white/30">Add at least one job code.</p>}
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
          disabled={!canContinue}
          className="flex-[2] py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)' }}
        >
          Continue →
        </button>
      </div>
    </motion.div>
  );
}

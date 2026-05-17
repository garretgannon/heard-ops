import { useState } from 'react';
import { motion } from 'framer-motion';

const RESPONSIBILITY_GROUPS = [
  {
    label: 'Tasks',
    key: 'tasks',
    items: [
      { key: 'opening_duties', label: 'Opening duties' },
      { key: 'closing_duties', label: 'Closing duties' },
      { key: 'sidework', label: 'Sidework' },
      { key: 'prep_tasks', label: 'Prep tasks' },
      { key: 'station_tasks', label: 'Can receive station tasks' },
    ],
  },
  {
    label: 'Logs',
    key: 'logs',
    items: [
      { key: 'temp_checks', label: 'Temp checks' },
      { key: 'waste_logs', label: 'Waste logs' },
      { key: 'shift_notes', label: 'Can submit shift notes' },
    ],
  },
  {
    label: 'Cash',
    key: 'cash',
    items: [
      { key: 'cash_handling', label: 'Cash handling' },
      { key: 'drawer_closeout', label: 'Drawer closeout' },
    ],
  },
  {
    label: 'Approvals',
    key: 'approvals',
    items: [
      { key: 'approve_tasks', label: 'Can approve tasks' },
      { key: 'approve_requests', label: 'Can approve requests' },
      { key: 'approve_logs', label: 'Can approve logs' },
    ],
  },
];

export default function Step5_Responsibilities({ jobCodes, responsibilities, onChange, onNext, onBack }) {
  const [selectedJC, setSelectedJC] = useState(jobCodes[0]?.id || null);

  function toggle(jcId, key) {
    const current = responsibilities[jcId] || {};
    onChange({
      ...responsibilities,
      [jcId]: { ...current, [key]: !current[key] },
    });
  }

  const currentResps = responsibilities[selectedJC] || {};
  const activeJC = jobCodes.find((j) => j.id === selectedJC);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5 py-6 max-w-2xl"
    >
      <div>
        <h2 className="text-2xl font-extrabold text-white mb-1">Responsibilities</h2>
        <p className="text-sm text-white/40">Define what each job code is responsible for each shift.</p>
      </div>

      {/* Concept callout */}
      <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(230,106,31,0.06)', border: '1px solid rgba(230,106,31,0.15)' }}>
        <span className="text-lg shrink-0 mt-0.5">📋</span>
        <div>
          <p className="text-sm font-semibold text-white/90 mb-0.5">
            <span style={{ color: '#E66A1F' }}>Responsibilities</span> = what this position does every shift.
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            These connect directly to heardOS workflows. Enable "Opening duties" and a checklist gets assigned at open. Enable "Temp checks" and this job code gets scheduled food safety logs. Enable "Cash handling" and the drawer closeout flow gets routed here. You can always adjust these later per station or per template.
          </p>
        </div>
      </div>

      {/* Job code selector */}
      <div className="flex flex-wrap gap-2">
        {jobCodes.map((jc) => (
          <button
            key={jc.id}
            onClick={() => setSelectedJC(jc.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={
              selectedJC === jc.id
                ? { background: '#E66A1F', color: 'white' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {jc.name}
          </button>
        ))}
      </div>

      {activeJC && (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Responsibilities for <span className="text-white/60">{activeJC.name}</span>
          </p>

          {RESPONSIBILITY_GROUPS.map((group) => (
            <div
              key={group.key}
              className="p-4 rounded-xl flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}
            >
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">{group.label}</p>
              <div className="flex flex-col gap-2">
                {group.items.map((item) => {
                  const isOn = !!currentResps[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggle(selectedJC, item.key)}
                      className="flex items-center justify-between py-2 px-1 transition-all"
                    >
                      <span className="text-sm text-white/80">{item.label}</span>
                      <div
                        className="w-10 h-5 rounded-full relative transition-all duration-200 shrink-0"
                        style={isOn ? { background: '#E66A1F' } : { background: 'rgba(255,255,255,0.1)' }}
                      >
                        <div
                          className="w-4 h-4 rounded-full absolute top-0.5 transition-all duration-200"
                          style={{
                            background: 'white',
                            left: isOn ? '22px' : '2px',
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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

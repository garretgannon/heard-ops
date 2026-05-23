import { useState } from 'react';
import { motion } from 'framer-motion';

function genId() {
  return 'wizard_' + Math.random().toString(36).slice(2, 9);
}

const PRESET_GROUPS = [
  {
    group: 'Kitchen',
    icon: '🔥',
    items: ['Grill', 'Fryer', 'Sauté', 'Flat Top', 'Pantry / Cold', 'Expo', 'Prep Table', 'Dish Pit', 'Line Lead'],
  },
  {
    group: 'Bar',
    icon: '🍷',
    items: ['Main Bar', 'Service Bar', 'Patio Bar', 'Banquet Bar', 'Well', 'Beer / Wine Station'],
  },
  {
    group: 'Front of House',
    icon: '🍽️',
    items: ['Host Stand', 'Dining Room', 'Patio', 'Private Dining', 'To-Go Counter', 'Server Section'],
  },
  {
    group: 'Storage & Back',
    icon: '📦',
    items: ['Walk-In Cooler', 'Dry Storage', 'Office'],
  },
];

export default function Step4_StationLinks({
  jobCodes,
  stationLinks,
  stations,          // existing stations from base44
  customStations,    // new stations added in this wizard
  onStationsChange,  // updates customStations
  onChange,          // updates stationLinks
  onNext,
  onBack,
}) {
  const [selectedJobCode, setSelectedJobCode] = useState(jobCodes[0]?.id || null);
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [activeGroup, setActiveGroup] = useState(null); // null = show all presets

  // Merge existing + custom into one list
  const allStations = [
    ...stations,
    ...customStations,
  ];

  const existingNames = allStations.map((s) => (s.name || '').toLowerCase());

  function addPresetStation(name) {
    if (existingNames.includes(name.toLowerCase())) return;
    const newStation = { id: genId(), name, isActive: true };
    onStationsChange([...customStations, newStation]);
  }

  function addCustomStation() {
    const name = newStationName.trim();
    if (!name) return;
    if (existingNames.includes(name.toLowerCase())) {
      setNewStationName('');
      setShowAddStation(false);
      return;
    }
    const newStation = { id: genId(), name, isActive: true };
    onStationsChange([...customStations, newStation]);
    setNewStationName('');
    setShowAddStation(false);
  }

  function removeCustomStation(id) {
    onStationsChange(customStations.filter((s) => s.id !== id));
    // Also remove from any links
    const updated = {};
    Object.entries(stationLinks).forEach(([jcId, sIds]) => {
      updated[jcId] = sIds.filter((sid) => sid !== id);
    });
    onChange(updated);
  }

  function toggleStation(stationId) {
    if (!selectedJobCode) return;
    const current = stationLinks[selectedJobCode] || [];
    const updated = current.includes(stationId)
      ? current.filter((id) => id !== stationId)
      : [...current, stationId];
    onChange({ ...stationLinks, [selectedJobCode]: updated });
  }

  const selectedJC = jobCodes.find((j) => j.id === selectedJobCode);
  const linkedStations = stationLinks[selectedJobCode] || [];
  const totalLinks = Object.values(stationLinks).reduce((acc, arr) => acc + arr.length, 0);

  const filteredPresets = activeGroup
    ? PRESET_GROUPS.filter((g) => g.group === activeGroup)
    : PRESET_GROUPS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5 py-4 max-w-2xl"
    >
      <div>
        <h2 className="text-2xl font-extrabold text-white mb-1">Stations</h2>
        <p className="text-sm text-white/40">Build your station list, then connect job codes to them.</p>
      </div>

      {/* Concept callout */}
      <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.15)' }}>
        <span className="text-lg shrink-0 mt-0.5">📍</span>
        <div>
          <p className="text-sm font-semibold text-white/90 mb-0.5">
            <span style={{ color: '#FF6B00' }}>Station</span> = a physical location or workstation in your restaurant.
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            Examples: Grill, Main Bar, Host Stand, Patio. Tasks, temperature logs, cleaning checklists, and sidework are all tied to stations — so when you assign someone to a station, heardOS knows exactly what needs to happen there. Linking a job code (like "Bartender") to a station (like "Main Bar") routes all bar tasks to that person automatically.
          </p>
        </div>
      </div>

      {/* Step 1: Build your station list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold uppercase tracking-widest text-white/40">Step 1 — Add Stations</p>
          <span className="text-xs text-white/30">{allStations.length} station{allStations.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Preset group filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveGroup(null)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
            style={activeGroup === null
              ? { background: '#FF6B00', color: 'white' }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
          >
            All
          </button>
          {PRESET_GROUPS.map((g) => (
            <button
              key={g.group}
              onClick={() => setActiveGroup(activeGroup === g.group ? null : g.group)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
              style={activeGroup === g.group
                ? { background: '#FF6B00', color: 'white' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              {g.icon} {g.group}
            </button>
          ))}
        </div>

        {/* Preset station chips */}
        <div className="p-3 rounded-xl flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {filteredPresets.map((grp) => {
            const available = grp.items.filter((name) => !existingNames.includes(name.toLowerCase()));
            const added = grp.items.filter((name) => existingNames.includes(name.toLowerCase()));
            if (available.length === 0 && added.length === 0) return null;
            return (
              <div key={grp.group}>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">{grp.icon} {grp.group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {grp.items.map((name) => {
                    const isAdded = existingNames.includes(name.toLowerCase());
                    return (
                      <button
                        key={name}
                        onClick={() => !isAdded && addPresetStation(name)}
                        disabled={isAdded}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                        style={isAdded
                          ? { background: 'rgba(255,107,0,0.12)', color: 'rgba(255,107,0,0.7)', border: '1px solid rgba(255,107,0,0.2)', cursor: 'default' }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      >
                        {isAdded ? '✓ ' : '+ '}{name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Custom station input */}
          {showAddStation ? (
            <div className="flex gap-2 pt-1 border-t border-white/5">
              <input
                autoFocus
                value={newStationName}
                onChange={(e) => setNewStationName(e.target.value)}
                placeholder="Station name…"
                className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/25 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                onKeyDown={(e) => { if (e.key === 'Enter') addCustomStation(); if (e.key === 'Escape') { setShowAddStation(false); setNewStationName(''); } }}
              />
              <button onClick={addCustomStation} className="px-3 py-2 rounded-lg text-sm font-semibold text-white shrink-0" style={{ background: '#FF6B00' }}>Add</button>
              <button onClick={() => { setShowAddStation(false); setNewStationName(''); }} className="px-3 py-2 rounded-lg text-sm text-white/40">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddStation(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/70 transition-colors pt-1 border-t border-white/5"
            >
              <span className="text-base leading-none">+</span> Add a station not listed above
            </button>
          )}
        </div>

        {/* Current station list */}
        {allStations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allStations.map((s) => {
              const isCustom = customStations.some((c) => c.id === s.id);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}
                >
                  <span className="text-white/80">{s.name}</span>
                  {isCustom && (
                    <button onClick={() => removeCustomStation(s.id)} className="text-white/30 hover:text-red-400 transition-colors leading-none ml-0.5">×</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2: Link job codes */}
      {allStations.length > 0 && jobCodes.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-extrabold uppercase tracking-widest text-white/40">Step 2 — Link Job Codes to Stations</p>
          <p className="text-xs text-white/30">Select a job code, then check which stations that position works at.</p>

          <div className="flex gap-3">
            {/* Job code selector */}
            <div className="w-36 shrink-0 flex flex-col gap-1 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-1 py-0.5">Job Codes</p>
              {jobCodes.map((jc) => {
                const linked = (stationLinks[jc.id] || []).length;
                const isActive = jc.id === selectedJobCode;
                return (
                  <button
                    key={jc.id}
                    onClick={() => setSelectedJobCode(jc.id)}
                    className="px-2 py-2 rounded-lg text-left transition-all"
                    style={isActive ? { background: 'rgba(255,107,0,0.15)', color: 'white' } : { color: 'rgba(255,255,255,0.5)' }}
                  >
                    <p className="text-xs font-medium leading-tight">{jc.name}</p>
                    {linked > 0 && <p className="text-[10px] mt-0.5" style={{ color: '#FF6B00' }}>{linked} linked</p>}
                  </button>
                );
              })}
            </div>

            {/* Station checkboxes */}
            <div className="flex-1 min-w-0">
              {selectedJC && (
                <p className="text-xs text-white/40 mb-2">
                  Where does <span className="text-white/70 font-semibold">{selectedJC.name}</span> work?
                </p>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {allStations.map((station) => {
                  const isLinked = linkedStations.includes(station.id);
                  return (
                    <button
                      key={station.id}
                      onClick={() => toggleStation(station.id)}
                      className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-all"
                      style={isLinked
                        ? { background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.35)', borderRadius: 10 }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                    >
                      <div className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all" style={isLinked ? { background: '#FF6B00', borderColor: '#FF6B00' } : { background: 'transparent', borderColor: 'rgba(255,255,255,0.2)' }}>
                        {isLinked && (
                          <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4l1.5 1.5 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs font-medium text-white/80 truncate">{station.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {totalLinks > 0 && (
            <p className="text-xs text-white/30">{totalLinks} link{totalLinks !== 1 ? 's' : ''} configured across all job codes.</p>
          )}
        </div>
      )}

      {allStations.length === 0 && (
        <p className="text-xs text-white/30 italic">Add at least one station above to start linking job codes.</p>
      )}

      {/* Desktop CTAs */}
      <div className="hidden lg:flex items-center gap-3 mt-2">
        <button onClick={onBack} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Back</button>
        <button onClick={onNext} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)' }}>Continue →</button>
        {allStations.length === 0 && <p className="text-xs text-white/30">You can link stations later — or add them above first.</p>}
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 flex gap-3 z-20" style={{ background: 'rgba(5,8,14,0.97)', backdropFilter: 'blur(12px)' }}>
        <button onClick={onBack} className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Back</button>
        <button onClick={onNext} className="flex-[2] py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)' }}>Continue →</button>
      </div>
    </motion.div>
  );
}

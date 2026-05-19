import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Layers, ChefHat, Wine, AlertTriangle, Package, Sliders,
  ChevronLeft, ChevronRight, X, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { toast } from 'sonner';

const CARD_BG = 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)';

const COUNT_TYPES = [
  { id: 'full',       label: 'Full Inventory',  desc: 'All food, beverage, and supplies', icon: Layers },
  { id: 'food',       label: 'Food Inventory',  desc: 'Food and kitchen items',           icon: ChefHat },
  { id: 'bar',        label: 'Bar Inventory',   desc: 'Liquor, beer, wine, mixers',       icon: Wine },
  { id: 'chemicals',  label: 'Chemicals',       desc: 'Cleaning and sanitation items',    icon: AlertTriangle },
  { id: 'smallwares', label: 'Smallwares',      desc: 'Disposables and small wares',      icon: Package },
  { id: 'custom',     label: 'Custom',          desc: 'Build your own count',             icon: Sliders },
];

const DUE_TIMES = ['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
                   '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];

export default function StartCountWizard({ stations, onStart, onClose }) {
  const [step,             setStep]             = useState(1);
  const [countType,        setCountType]        = useState('full');
  const [selectedStations, setSelectedStations] = useState([]);
  const [assignments,      setAssignments]      = useState({});
  const [sessionName,      setSessionName]      = useState('');
  const [sessionDate,      setSessionDate]      = useState(new Date().toISOString().split('T')[0]);
  const [dueTime,          setDueTime]          = useState('10:00 AM');
  const [notes,            setNotes]            = useState('');
  const [submitting,       setSubmitting]       = useState(false);

  const defaultName = () => {
    const day  = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const type = COUNT_TYPES.find(t => t.id === countType)?.label || 'Inventory';
    return `${day} ${type} Count`;
  };

  const toggleStation = name =>
    setSelectedStations(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name],
    );

  const canProceed = () => {
    if (step === 2) return selectedStations.length > 0;
    return true;
  };

  const handleStart = async () => {
    setSubmitting(true);
    const name  = sessionName.trim() || defaultName();
    const today = new Date().toISOString().split('T')[0];
    try {
      await Promise.all(
        selectedStations.map(stationName =>
          base44.entities.PrepInventoryCount.create({
            shift:      countType,
            station:    stationName,
            date:       today,
            counted_by: assignments[stationName] || '',
            status:     'not_started',
            notes:      `[session:${name}][due:${dueTime}]${notes ? '\n' + notes : ''}`,
            items:      [],
          }).catch(() => null),
        ),
      );
      haptics.success();
      toast.success(`${name} started — ${selectedStations.length} location${selectedStations.length !== 1 ? 's' : ''} assigned`);
      onStart(name);
    } catch {
      toast.error('Failed to start count session');
    }
    setSubmitting(false);
  };

  const STEP_LABELS = ['Count Type', 'Locations', 'Assign', 'Review'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border/50 overflow-hidden max-h-[92vh] flex flex-col"
        style={{ background: CARD_BG, boxShadow: '0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <h3 className="text-base font-black text-foreground">
            {step === 1 ? 'Count Session Type' :
             step === 2 ? 'Select Locations' :
             step === 3 ? 'Assign Counters' :
             'Review & Start'}
          </h3>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Step indicators — numbered circles */}
        <div className="flex items-center px-5 pb-4 shrink-0">
          {[1, 2, 3, 4].map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all',
                  s < step  ? 'bg-primary border-primary text-white' :
                  s === step ? 'bg-primary border-primary text-white' :
                               'border-border/40 text-muted-foreground',
                )}>
                  {s < step ? <Check className="h-3 w-3" /> : s}
                </div>
                <p className={cn('text-[9px] font-bold', s <= step ? 'text-primary' : 'text-muted-foreground')}>
                  {STEP_LABELS[s - 1]}
                </p>
              </div>
              {i < 3 && (
                <div className={cn('flex-1 h-px mx-2 mb-4 transition-all', s < step ? 'bg-primary' : 'bg-border/30')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">

          {/* ── Step 1: Type + session details ─────────────────── */}
          {step === 1 && (
            <>
              <p className="text-xs text-muted-foreground">Choose the type of inventory count you want to create.</p>
              <div className="grid grid-cols-2 gap-2">
                {COUNT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => { setCountType(type.id); haptics.light(); }}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.98]',
                      countType === type.id
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border/40 bg-white/[0.02] hover:bg-white/[0.04]',
                    )}
                  >
                    <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', countType === type.id ? 'bg-primary/20' : 'bg-white/[0.05]')}>
                      <type.icon className={cn('h-3.5 w-3.5', countType === type.id ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground leading-tight">{type.label}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">{type.desc}</p>
                    </div>
                    {countType === type.id && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-auto" />}
                  </button>
                ))}
              </div>

              <div className="border-t border-border/20 pt-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Session Details</p>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">Session Name</label>
                  <input
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    placeholder={defaultName()}
                    className="w-full h-9 px-3 rounded-lg bg-white/[0.05] border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">Date</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={e => setSessionDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-white/[0.05] border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">Due Time</label>
                    <select
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-white/[0.05] border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    >
                      {DUE_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add notes for this count session…"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Location selection ──────────────────────── */}
          {step === 2 && (
            <>
              <p className="text-xs text-muted-foreground">
                Select the areas and stations to include.{' '}
                {selectedStations.length > 0 && (
                  <span className="font-bold text-primary">{selectedStations.length} selected</span>
                )}
              </p>
              {stations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No stations found. Add stations in Areas &amp; Stations.
                </p>
              ) : (
                <div className="space-y-2">
                  {stations.map(st => (
                    <button
                      key={st.id || st.name}
                      onClick={() => { toggleStation(st.name); haptics.light(); }}
                      className={cn(
                        'flex w-full items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all active:scale-[0.99]',
                        selectedStations.includes(st.name)
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-border/40 bg-white/[0.02] hover:bg-white/[0.04]',
                      )}
                    >
                      <div className={cn('h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors', selectedStations.includes(st.name) ? 'bg-primary border-primary' : 'border-border/50')}>
                        {selectedStations.includes(st.name) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{st.name}</p>
                        {st.department && <p className="text-[10px] text-muted-foreground capitalize">{st.department}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Step 3: Assign counters ─────────────────────────── */}
          {step === 3 && (
            <>
              <p className="text-xs text-muted-foreground">Assign each location to the person responsible for counting.</p>
              <div className="space-y-3">
                {selectedStations.map(name => (
                  <div key={name}>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">{name}</label>
                    <input
                      value={assignments[name] || ''}
                      onChange={e => setAssignments(prev => ({ ...prev, [name]: e.target.value }))}
                      placeholder="Name or team"
                      className="w-full h-9 px-3 rounded-lg bg-white/[0.05] border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Step 4: Review ─────────────────────────────────── */}
          {step === 4 && (
            <>
              <p className="text-xs text-muted-foreground">Review your count session before starting.</p>
              <div className="space-y-3">
                <div className="bg-white/[0.03] rounded-xl border border-border/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-1.5">Session</p>
                  <p className="text-sm font-bold text-foreground">{sessionName.trim() || defaultName()}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {COUNT_TYPES.find(t => t.id === countType)?.label} · {sessionDate} · Due {dueTime}
                  </p>
                </div>
                <div className="bg-white/[0.03] rounded-xl border border-border/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-2">
                    Locations ({selectedStations.length})
                  </p>
                  <div className="space-y-2">
                    {selectedStations.map(name => (
                      <div key={name} className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground">{name}</p>
                        <p className="text-[10px] text-muted-foreground">{assignments[name] || 'Unassigned'}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {notes.trim() && (
                  <div className="bg-white/[0.03] rounded-xl border border-border/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-1">Notes</p>
                    <p className="text-xs text-muted-foreground">{notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pt-3 pb-5 border-t border-border/20 shrink-0">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 4 ? (
            <button
              onClick={() => { if (canProceed()) { setStep(s => s + 1); haptics.medium(); } }}
              disabled={!canProceed()}
              className={cn('btn-primary h-8 px-4 text-xs flex items-center gap-1.5', !canProceed() && 'opacity-50 cursor-not-allowed')}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={submitting || selectedStations.length === 0}
              className="btn-primary h-8 px-4 text-xs"
            >
              {submitting ? 'Starting…' : `Start Count — ${selectedStations.length} Location${selectedStations.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

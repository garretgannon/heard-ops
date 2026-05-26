import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, CheckCircle2, Plus, Clock, BarChart2, ChefHat, ConciergeBell } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const today = () => new Date().toISOString().split('T')[0];

const STATUS_COLOR = {
  pending: 'bg-amber-500/15 text-amber-400',
  'in-progress': 'bg-blue-500/15 text-blue-400',
  done: 'bg-green-500/15 text-green-400',
};

function PrepItemCard({ item, beoName, onStatusChange, isAdmin }) {
  return (
    <div className="liquid-card p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-foreground">{item.prepItem}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[item.status] || 'bg-muted text-muted-foreground'}`}>
              {item.status || 'pending'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-muted-foreground">
            {item.quantity && <span>{item.quantity} {item.unit}</span>}
            {item.assignedStation && <span>· {item.assignedStation}</span>}
            {item.dueTime && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{item.dueTime}</span>}
            <span className="text-primary">· {beoName}</span>
          </div>
          {item.generatedPrepTaskId && (
            <p className="text-[9px] text-green-400 mt-1 flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" />Prep task linked</p>
          )}
        </div>
        {isAdmin && (
          <select
            value={item.status || 'pending'}
            onChange={e => onStatusChange(item.id, e.target.value)}
            onClick={e => e.stopPropagation()}
            className="text-[10px] px-2 py-1 liquid-card text-foreground shrink-0 focus:outline-none focus:border-border"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        )}
      </div>
    </div>
  );
}

export default function PrepImpactTab({ beos, reservations, isAdmin, onRefresh, onAddBEO, onViewPrepPlanning }) {
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [groupBy, setGroupBy] = useState('event');

  const todayStr = today();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    const activeBEOs = beos.filter(b => !['cancelled','completed'].includes(b.status));
    if (activeBEOs.length === 0) { setLoading(false); return; }
    Promise.all(
      activeBEOs.map(b => base44.entities.BEOPrepItem.filter({ beoId: b.id }).catch(() => []))
    ).then(results => {
      const items = results.flatMap((items, i) => items.map(item => ({ ...item, _beo: activeBEOs[i] })));
      setPrepItems(items);
      setLoading(false);
    });
  }, [beos]);

  const handleStatusChange = async (id, status) => {
    await base44.entities.BEOPrepItem.update(id, { status });
    haptics.light();
    setPrepItems(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const generatePrepTasks = async (beo) => {
    setGenerating(beo.id);
    const items = prepItems.filter(p => p.beoId === beo.id && !p.generatedPrepTaskId);
    for (const item of items) {
      // Check for duplicate: skip if a prep task with same name and beo link already exists
      const existing = await base44.entities.PrepItem.filter({ name: `[${beo.eventName}] ${item.prepItem}` }).catch(() => []);
      if (existing.length > 0) continue;
      const task = await base44.entities.PrepItem.create({
        name: `[${beo.eventName}] ${item.prepItem}`,
        quantity: item.quantity,
        unit: item.unit,
        station_name: item.assignedStation,
        due_time: item.dueTime,
        status: 'pending',
        notes: `Auto-generated from BEO: ${beo.eventName} on ${beo.eventDate}`,
      }).catch(() => null);
      if (task) {
        await base44.entities.BEOPrepItem.update(item.id, { generatedPrepTaskId: task.id });
      }
    }
    await base44.entities.BEO.update(beo.id, { prepTasksGenerated: true });
    haptics.success();
    setGenerating(null);
    onRefresh();
  };

  const upcomingBEOs = beos.filter(b => !['cancelled','completed'].includes(b.status) && b.eventDate >= todayStr);

  const todayRes = reservations.filter(r => r.date === todayStr && r.status !== 'cancelled');
  const todayBEOs = beos.filter(b => b.eventDate === todayStr && b.status !== 'cancelled');
  const totalCovers = todayRes.reduce((s, r) => s + (r.partySize || 0), 0) + todayBEOs.reduce((s, b) => s + (b.guestCount || 0), 0);
  const largeParties = todayRes.filter(r => (r.partySize || 0) >= 8).length;
  const prepLevel = todayBEOs.length > 2 ? 'High' : todayBEOs.length > 0 ? 'Medium' : largeParties > 2 ? 'Medium' : 'Low';
  const serviceLevel = totalCovers > 100 ? 'High' : totalCovers > 50 ? 'Medium' : 'Low';

  if (loading) return <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Group by filter */}
      <div className="w-full overflow-x-auto no-scrollbar pb-1">
        <div className="pill-slider-container">
          {['event','station','date'].map(g => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={cn('glass-pill transition-all active:scale-95', groupBy === g && 'glow-active')}
            >
              By {g}
            </button>
          ))}
        </div>
      </div>

      {/* BEO sections with generate button */}
      {upcomingBEOs.length === 0 && (
        <div className="liquid-card overflow-hidden p-8 flex flex-col items-center justify-center gap-4 mt-2">
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center">
              <BarChart2 className="h-7 w-7 text-muted-foreground/50" />
            </div>
          </div>
          <p className="text-[13px] font-semibold text-foreground">No prep impact today</p>
          <div className="flex flex-col gap-2 w-full max-w-[240px] mt-2">
            {onAddBEO && (
              <button
                onClick={() => { onAddBEO(); haptics.medium(); }}
                className="w-full btn-primary h-10 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Event
              </button>
            )}
            {onViewPrepPlanning && (
              <button
                onClick={() => { onViewPrepPlanning(); haptics.medium(); }}
                className="w-full btn-secondary h-10 flex items-center justify-center gap-1.5"
              >
                View Prep Planning
              </button>
            )}
          </div>
        </div>
      )}
      {upcomingBEOs.map(beo => {
        const items = prepItems.filter(p => p.beoId === beo.id);
        const ungenerated = items.filter(p => !p.generatedPrepTaskId);
        return (
          <div key={beo.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">{beo.eventName}</p>
                <p className="text-[10px] text-muted-foreground">{beo.eventDate} · {beo.guestCount} guests</p>
              </div>
              <div className="flex items-center gap-2">
                {beo.prepTasksGenerated && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 flex items-center gap-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5" />Tasks Generated
                  </span>
                )}
                {isAdmin && ungenerated.length > 0 && (
                  <button
                    onClick={() => generatePrepTasks(beo)}
                    disabled={generating === beo.id}
                    className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/20 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Zap className="h-3 w-3" />
                    {generating === beo.id ? 'Generating…' : 'Generate Prep Tasks'}
                  </button>
                )}
              </div>
            </div>
            {items.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic px-1">No prep items added for this event.</p>
            ) : (
              items.map(item => (
                <PrepItemCard
                  key={item.id}
                  item={item}
                  beoName={beo.eventName}
                  isAdmin={isAdmin}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        );
      })}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {[
          { label: 'Prep Impact', level: prepLevel, Icon: ChefHat },
          { label: 'Service Impact', level: serviceLevel, Icon: ConciergeBell },
        ].map(({ label, level, Icon }) => {
          const colorClass = level === 'High' ? 'text-red-400 bg-red-500/10' : level === 'Medium' ? 'text-amber-400 bg-amber-500/10' : 'text-green-400 bg-green-500/10';
          const textColor = level === 'High' ? 'text-red-400' : level === 'Medium' ? 'text-amber-400' : 'text-green-400';
          const iconColor = level === 'High' ? 'text-red-400' : level === 'Medium' ? 'text-amber-400' : 'text-green-400';
          return (
            <div key={label} className={`liquid-card p-4 flex flex-col gap-1 ${colorClass.split(' ')[1]}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`h-4 w-4 ${iconColor} shrink-0`} />
                <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
              </div>
              <p className={`text-[22px] font-black leading-none ${textColor}`}>{level}</p>
              {level === 'Low' && <p className="text-[11px] text-muted-foreground mt-0.5">No impact today</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
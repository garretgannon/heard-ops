import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Calendar, X, Plus } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const today = () => new Date().toISOString().split('T')[0];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarTab({ reservations, beos, onSelectBEO, onAddEvent }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(today());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const getDateStr = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const dayReservations = (d) => reservations.filter(r => r.date === getDateStr(d) && r.status !== 'cancelled');
  const dayBEOs = (d) => beos.filter(b => b.eventDate === getDateStr(d) && b.status !== 'cancelled');

  const selectedRes = reservations.filter(r => r.date === selectedDate && r.status !== 'cancelled');
  const selectedBEOList = beos.filter(b => b.eventDate === selectedDate && b.status !== 'cancelled');

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS = ['S','M','T','W','T','F','S'];

  return (
    <div className="space-y-3">
      {/* Month Navigator */}
      <div className="card-glass border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={prevMonth} className="p-1.5 rounded-lg bg-muted"><ChevronLeft className="h-4 w-4 text-muted-foreground" /></button>
          <span className="text-sm font-extrabold text-foreground">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg bg-muted"><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        <div className="px-3 pb-3">
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = getDateStr(d);
              const res = dayReservations(d);
              const beoList = dayBEOs(d);
              const isToday = dateStr === today();
              const isSelected = dateStr === selectedDate;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative rounded-lg py-1.5 flex flex-col items-center transition-all ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-primary-foreground' : ''}`}>{d}</span>
                  <div className="flex gap-0.5 mt-0.5">
                    {res.length > 0 && <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />}
                    {beoList.length > 0 && <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-blue-400'}`} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground mb-2">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        {selectedRes.length === 0 && selectedBEOList.length === 0 ? (
          <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}>
            <div className="flex flex-col items-center py-7 px-4 gap-3">
              <div className="relative">
                <div className="h-14 w-14 rounded-full bg-white/[0.05] border border-border/30 flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center">
                  <X className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground">No events scheduled</p>
              <div className="flex flex-col gap-2 w-full mt-1">
                {onAddEvent && (
                  <button
                    onClick={() => { onAddEvent(); haptics.medium(); }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-bold text-white active:scale-[0.98] transition-all"
                    style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)' }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Event to This Date
                  </button>
                )}
                <button
                  onClick={() => { setSelectedDate(today()); haptics.light(); }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-semibold text-foreground active:scale-[0.98] transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
                >
                  Go to Today
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedRes.map(r => (
              <div key={r.id} className="card-glass border border-border rounded-lg px-3 py-2.5 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.time} · <Users className="h-2.5 w-2.5 inline" /> {r.partySize}</p>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{r.status}</span>
              </div>
            ))}
            {selectedBEOList.map(b => (
              <button key={b.id} onClick={() => onSelectBEO(b)} className="w-full text-left bg-card border border-blue-500/20 rounded-lg px-3 py-2.5 flex items-center gap-2 active:scale-[0.99]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{b.eventName}</p>
                  <p className="text-xs text-muted-foreground">{b.startTime} · <Users className="h-2.5 w-2.5 inline" /> {b.guestCount}</p>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 capitalize">{(b.status || '').replace(/-/g, ' ')}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import QuickAddEightySixModal from '@/components/QuickAddEightySixModal';
import LogCreateModal from '@/components/LogCreateModal';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import {
  AlertCircle, AlignLeft, ArrowRight, Building2, CalendarDays, CheckCircle2,
  CheckSquare, ChevronRight, Clock, FileText, Lock, MapPin, Megaphone,
  MessageSquare, Paperclip, Plus, Reply, Send, Shield, Users2, X, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = ['Capture', 'Feed', 'Needs Ack', 'History'];

const ITEM_TYPES = [
  { type: 'task',      icon: CheckSquare, label: 'Task',      placeholder: 'What needs doing?' },
  { type: 'note',      icon: AlignLeft,   label: 'Note',      placeholder: 'Jot something down…' },
  { type: 'follow_up', icon: ArrowRight,  label: 'Follow-up', placeholder: 'What needs a follow-up?' },
  { type: 'issue',     icon: AlertCircle, label: 'Issue',     placeholder: 'Describe the issue…' },
];

const VISIBILITY_OPTIONS = [
  { value: 'private',   label: 'Private',  icon: Lock,     desc: 'Only me',   active: 'bg-muted text-foreground border-border' },
  { value: 'managers',  label: 'Managers', icon: Shield,   desc: 'Managers',  active: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { value: 'station',   label: 'Station',  icon: Building2,desc: 'This station', active: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  { value: 'all_team',  label: 'All Team', icon: Users2,   desc: 'Everyone',  active: 'bg-primary/15 text-primary border-primary/30' },
];

const TYPE_META = {
  announcement: { label: 'Announcement', icon: Megaphone,    color: 'text-primary',  bg: 'bg-primary/15'  },
  station_note: { label: 'Station Note', icon: MapPin,       color: 'text-violet-400', bg: 'bg-violet-500/15' },
  task_comment: { label: 'Task Comment', icon: MessageSquare,color: 'text-blue-400', bg: 'bg-blue-500/15' },
};

const NOTEPAD_TYPE_META = {
  task:      { label: 'Task',       icon: CheckSquare, color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  note:      { label: 'Note',       icon: FileText,    color: 'text-blue-400',   bg: 'bg-blue-500/15'  },
  follow_up: { label: 'Follow-up',  icon: ArrowRight,  color: 'text-primary',    bg: 'bg-primary/15'   },
  issue:     { label: 'Issue',      icon: AlertCircle, color: 'text-red-400',    bg: 'bg-red-500/15'   },
};

const SHORTCUTS = [
  { key: '86',           label: '86 Item',    sub: 'Out of stock', icon: XCircle,    bg: 'bg-red-500/15',    color: 'text-red-400'    },
  { key: 'log',          label: 'Manager Log',sub: 'Shift note',   icon: FileText,   bg: 'bg-blue-500/15',   color: 'text-blue-400'   },
  { key: 'task',         label: 'Assign Task',sub: 'To staff',     icon: CheckSquare,bg: 'bg-amber-500/15',  color: 'text-amber-400'  },
  { key: 'announcement', label: 'Announcement',sub: 'Broadcast',   icon: Megaphone,  bg: 'bg-purple-500/15', color: 'text-purple-400' },
];

const MAX_CHARS = 500;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(val) {
  if (!val) return 'Now';
  try {
    const d = new Date(val);
    if (isToday(d))     return `Today, ${format(d, 'h:mm a')}`;
    if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
    return format(d, 'MMM d, h:mm a');
  } catch { return 'Now'; }
}

// ── Feed item row ─────────────────────────────────────────────────────────────
function FeedRow({ thread, acknowledged, onAck, isAdmin, onResolve }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[thread.type] || TYPE_META.announcement;
  const Icon = meta.icon;

  return (
    <div className={cn('rounded-2xl border overflow-hidden transition-colors', acknowledged ? 'border-border/30 bg-card/50' : 'border-border bg-card')}>
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-start gap-3 p-4 text-left">
        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
          <Icon className={cn('h-4 w-4', meta.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate flex-1">{thread.title}</p>
            {thread.requires_acknowledgement && !acknowledged && (
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Ack</span>
            )}
            {acknowledged && (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{thread.body}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1.5 font-semibold">
            {meta.label} · {thread.station_name || 'All staff'} · {formatTime(thread.last_message_at || thread.created_date)}
          </p>
        </div>
        <ChevronRight className={cn('h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5 transition-transform', expanded && 'rotate-90')} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
          <p className="text-sm text-foreground leading-relaxed">{thread.body}</p>
          {thread.requires_acknowledgement && !acknowledged && (
            <button onClick={onAck} className="w-full h-10 rounded-xl bg-primary text-sm font-bold text-primary-foreground flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Acknowledge
            </button>
          )}
          {isAdmin && thread.status !== 'resolved' && (
            <button onClick={onResolve} className="w-full h-9 rounded-xl border border-border/60 text-xs font-bold text-muted-foreground flex items-center justify-center gap-2">
              <Reply className="h-3.5 w-3.5" /> Mark resolved
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Private item row ──────────────────────────────────────────────────────────
function PrivateRow({ item, onDelete }) {
  const meta = NOTEPAD_TYPE_META[item.type] || NOTEPAD_TYPE_META.note;
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/25 last:border-0">
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
        <Icon className={cn('h-4 w-4', meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.content}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          {meta.label} · Private · {formatTime(item.created_at)}
        </p>
      </div>
      <button onClick={() => onDelete(item.id)} className="h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-red-400 transition-colors shrink-0">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NotesAndComms() {
  const { user, isAdmin } = useCurrentUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]   = useState('Capture');
  const [loading, setLoading]       = useState(true);

  // Capture form state
  const [itemType, setItemType]     = useState('task');
  const [text, setText]             = useState('');
  const [visibility, setVisibility] = useState('private');
  const [requiresAck, setRequiresAck] = useState(false);
  const [stationId, setStationId]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [modal, setModal]           = useState(null);
  const textRef = useRef(null);

  // Data
  const [notepadItems, setNotepadItems] = useState([]);
  const [threads, setThreads]           = useState([]);
  const [acknowledgements, setAcks]     = useState([]);
  const [stations, setStations]         = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');

  const ackedIds = useMemo(() => new Set(acknowledgements.map(a => a.thread_id)), [acknowledgements]);

  const needsAckThreads = useMemo(
    () => threads.filter(t => t.requires_acknowledgement && !ackedIds.has(t.id) && t.status !== 'archived'),
    [threads, ackedIds]
  );

  const feedThreads = useMemo(
    () => threads.filter(t => t.status !== 'archived'),
    [threads]
  );

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    Promise.all([
      base44.entities.NotepadItem.filter({ created_by: user.email }).catch(() => []),
      base44.entities.MessageThread?.list?.('-last_message_at', 100).catch(() => []),
      base44.entities.MessageAcknowledgement?.filter?.({ user_email: user.email }).catch(() => []),
      base44.entities.Station?.list?.('sortOrder', 100).catch(() => []),
    ]).then(([notes, thr, acks, sts]) => {
      setNotepadItems(notes || []);
      setThreads(thr || []);
      setAcks(acks || []);
      setStations((sts || []).filter(s => s.isActive !== false));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.email]);

  const isPrivate = visibility === 'private';
  const activePlaceholder = ITEM_TYPES.find(t => t.type === itemType)?.placeholder || 'What needs doing?';

  async function handleSubmit() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      if (isPrivate) {
        // Save as private notepad item
        const item = await base44.entities.NotepadItem.create({
          content: text.trim(),
          type: itemType,
          checked: false,
          visibility: 'private',
          created_by: user?.email,
          created_by_name: user?.full_name || user?.email,
        });
        setNotepadItems(prev => [item, ...prev]);
        toast.success('Item saved privately');
      } else {
        // Post to shared feed as a MessageThread
        const visLabel = VISIBILITY_OPTIONS.find(v => v.value === visibility)?.label || visibility;
        const selectedStation = stations.find(s => s.id === stationId);
        const now = new Date().toISOString();
        const thread = await base44.entities.MessageThread.create({
          type: itemType === 'issue' ? 'station_note' : 'announcement',
          title: text.trim().slice(0, 80),
          body: text.trim(),
          priority: itemType === 'issue' ? 'high' : 'normal',
          status: 'open',
          visibility,
          requires_acknowledgement: requiresAck,
          station_id: selectedStation?.id || '',
          station_name: selectedStation?.name || '',
          created_by: user?.email,
          created_by_name: user?.full_name || user?.email,
          last_message_at: now,
        });
        await base44.entities.Message.create({
          thread_id: thread.id,
          body: text.trim(),
          created_by: user?.email,
          created_by_name: user?.full_name || user?.email,
        });
        setThreads(prev => [thread, ...prev]);
        toast.success('Added to feed');
      }
      setText('');
      setRequiresAck(false);
      setStationId('');
      setVisibility('private');
      textRef.current?.focus();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function deleteNotepadItem(id) {
    try {
      await base44.entities.NotepadItem.delete(id);
      setNotepadItems(prev => prev.filter(i => i.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function acknowledgeThread(thread) {
    if (ackedIds.has(thread.id)) return;
    try {
      await base44.entities.MessageAcknowledgement.create({
        thread_id: thread.id,
        user_email: user?.email,
        user_name: user?.full_name || user?.email,
        acknowledged_at: new Date().toISOString(),
      });
      setAcks(prev => [...prev, { thread_id: thread.id }]);
      toast.success('Acknowledged');
    } catch {
      toast.error('Failed to acknowledge');
    }
  }

  async function resolveThread(thread) {
    try {
      await base44.entities.MessageThread.update(thread.id, { status: 'resolved' });
      setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, status: 'resolved' } : t));
      toast.success('Thread resolved');
    } catch {
      toast.error('Failed to resolve');
    }
  }

  function handleShortcut(key) {
    if (key === 'task')         { navigate('/tasks'); return; }
    if (key === 'announcement') { setVisibility('all_team'); setItemType('note'); textRef.current?.focus(); return; }
    if (key === '86')           { setModal('86'); return; }
    setModal('log');
  }

  // History data = private notepad items + shared threads, sorted by date
  const historyItems = useMemo(() => {
    const notes = notepadItems.map(i => ({ ...i, _source: 'notepad', _date: i.created_at }));
    const shared = threads.map(t => ({ ...t, _source: 'thread', _date: t.last_message_at || t.created_date }));
    let all = [...notes, ...shared].sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0));
    if (historyFilter === 'private') return all.filter(i => i._source === 'notepad');
    if (historyFilter === 'shared')  return all.filter(i => i._source === 'thread');
    if (historyFilter === 'tasks')   return all.filter(i => i.type === 'task');
    if (historyFilter === 'issues')  return all.filter(i => i.type === 'issue');
    if (historyFilter === 'announcements') return all.filter(i => i.type === 'announcement' || i._source === 'thread');
    return all;
  }, [notepadItems, threads, historyFilter]);

  // ── Tab badge counts ─────────────────────────────────────────────────────────
  const badges = { Feed: feedThreads.length, 'Needs Ack': needsAckThreads.length };

  return (
    <div className="app-screen">

      <DesktopPageHeader title="Notes & Comms" subtitle="Capture, share, and track everything from one place." />

      {/* ══ TAB BAR ═════════════════════════════════════════════════════ */}
      <div className="flex shrink-0 overflow-x-auto scrollbar-hide border-b border-border bg-background">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap',
              activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
            {badges[tab] > 0 && (
              <span className="inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-black px-1">
                {badges[tab]}
              </span>
            )}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ══ CAPTURE TAB ═════════════════════════════════════════════ */}
        {activeTab === 'Capture' && (
          <div className="px-4 py-4 space-y-4 pb-8 max-w-2xl lg:max-w-none lg:px-6">

            {/* Quick Add card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-border/40">
                <p className="text-base font-bold text-foreground">Quick Add</p>
                <p className="text-xs text-muted-foreground mt-0.5">What are you adding?</p>
              </div>

              {/* Type selector */}
              <div className="grid grid-cols-4 gap-1.5 px-3 pt-3">
                {ITEM_TYPES.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setItemType(type)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[11px] font-bold transition-all',
                      itemType === type
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'border-border/50 text-muted-foreground/60 hover:text-muted-foreground hover:border-border'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="px-3 pt-3">
                <textarea
                  ref={textRef}
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder={activePlaceholder}
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/40 resize-none transition-colors"
                />
              </div>

              {/* Attach + char count */}
              <div className="flex items-center justify-between px-3 pb-3 pt-1.5">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  <Paperclip className="h-3.5 w-3.5" /> Attach
                </button>
                <span className="text-xs text-muted-foreground/40 tabular-nums">
                  {text.length} / {MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Visibility section */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-border/40">
                <p className="text-base font-bold text-foreground">Visibility</p>
                <p className="text-xs text-muted-foreground mt-0.5">Who should see this?</p>
              </div>
              <div className="grid grid-cols-4 gap-1.5 p-3">
                {VISIBILITY_OPTIONS.map(({ value, label, icon: Icon, desc, active }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setVisibility(value);
                      if (value === 'private') { setRequiresAck(false); }
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-center transition-all',
                      visibility === value ? active : 'border-border/40 text-muted-foreground/50 hover:text-muted-foreground hover:border-border'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] font-bold leading-tight">{label}</span>
                    <span className="text-[9px] text-muted-foreground/50 leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-border/40">
                <p className="text-base font-bold text-foreground">Additional Options</p>
                <p className="text-xs text-muted-foreground mt-0.5">Add more context to this item</p>
              </div>

              {/* Requires Ack */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Requires acknowledgment</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {isPrivate ? 'Acknowledgment requires shared visibility' : 'Track who has seen this'}
                  </p>
                </div>
                <button
                  onClick={() => { if (!isPrivate) setRequiresAck(v => !v); }}
                  disabled={isPrivate}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors shrink-0 disabled:opacity-30',
                    requiresAck && !isPrivate ? 'bg-primary' : 'bg-muted border border-border/60'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    requiresAck && !isPrivate ? 'translate-x-5' : 'translate-x-0.5'
                  )} />
                </button>
              </div>

              {/* Assign to Station */}
              <div className="border-b border-border/30">
                <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Assign to station (optional)</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {stationId ? stations.find(s => s.id === stationId)?.name : 'Select a station'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </button>
                {stations.length > 0 && !isPrivate && (
                  <div className="px-4 pb-3">
                    <select
                      value={stationId}
                      onChange={e => setStationId(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none"
                    >
                      <option value="">No specific station</option>
                      {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Add Reminder */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Add reminder (optional)</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Set date & time</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </div>
            </div>

            {/* Primary action button */}
            <button
              onClick={handleSubmit}
              disabled={saving || !text.trim()}
              className="w-full h-13 py-3.5 rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-30 flex items-center justify-center gap-2 transition-opacity"
            >
              {saving ? (
                'Saving…'
              ) : isPrivate ? (
                <><Lock className="h-4 w-4" /> Save Private Item</>
              ) : (
                <><Send className="h-4 w-4" /> Add to Feed</>
              )}
            </button>

            {/* Quick Add Shortcuts */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-border/40">
                <p className="text-base font-bold text-foreground">Quick Add Shortcuts</p>
                <p className="text-xs text-muted-foreground mt-0.5">Jump into common actions</p>
              </div>
              <div className="grid grid-cols-4 gap-0 divide-x divide-border/40">
                {SHORTCUTS.map(({ key, label, sub, icon: Icon, bg, color }) => (
                  <button
                    key={key}
                    onClick={() => handleShortcut(key)}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', bg)}>
                      <Icon className={cn('h-4 w-4', color)} />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-foreground leading-tight">{label}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5 leading-tight">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ══ FEED TAB ════════════════════════════════════════════════ */}
        {activeTab === 'Feed' && (
          <div className="px-4 py-4 space-y-3 pb-8 max-w-2xl lg:max-w-none lg:px-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
              </div>
            ) : feedThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center">
                  <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Nothing posted yet</p>
                  <p className="text-xs text-muted-foreground mt-1.5 max-w-[220px] mx-auto leading-5">
                    Share a note, announcement, or task with your team. It'll show up here for the whole shift.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('Capture')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white active:scale-[0.97] transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)',
                    boxShadow: '0 0 0 1px rgba(255,107,0,0.3)',
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Post Something
                </button>
              </div>
            ) : (
              feedThreads.map(thread => (
                <FeedRow
                  key={thread.id}
                  thread={thread}
                  acknowledged={ackedIds.has(thread.id)}
                  isAdmin={isAdmin}
                  onAck={() => acknowledgeThread(thread)}
                  onResolve={() => resolveThread(thread)}
                />
              ))
            )}
          </div>
        )}

        {/* ══ NEEDS ACK TAB ═══════════════════════════════════════════ */}
        {activeTab === 'Needs Ack' && (
          <div className="px-4 py-4 space-y-3 pb-8 max-w-2xl lg:max-w-none lg:px-6">
            {needsAckThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400/50" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">All caught up</p>
                  <p className="text-xs text-muted-foreground mt-1.5">Nothing needs acknowledgment.</p>
                </div>
              </div>
            ) : (
              needsAckThreads.map(thread => {
                const meta = TYPE_META[thread.type] || TYPE_META.announcement;
                const Icon = meta.icon;
                return (
                  <div key={thread.id} className="rounded-2xl border border-amber-500/25 bg-card overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
                        <Icon className={cn('h-4 w-4', meta.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{thread.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{thread.body}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-amber-400/80">{meta.label}</span>
                          <span className="text-[10px] text-muted-foreground/50">·</span>
                          <span className="text-[10px] text-muted-foreground/50">{formatTime(thread.last_message_at || thread.created_date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => acknowledgeThread(thread)}
                        className="w-full h-10 rounded-xl bg-primary text-sm font-bold text-primary-foreground flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Acknowledge
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ══ HISTORY TAB ═════════════════════════════════════════════ */}
        {activeTab === 'History' && (
          <div className="px-4 py-4 space-y-4 pb-8 max-w-2xl lg:max-w-none lg:px-6">

            {/* Filter chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { id: 'all',           label: 'All' },
                { id: 'private',       label: 'Private' },
                { id: 'shared',        label: 'Shared' },
                { id: 'tasks',         label: 'Tasks' },
                { id: 'issues',        label: 'Issues' },
                { id: 'announcements', label: 'Announcements' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setHistoryFilter(f.id)}
                  className={cn(
                    'shrink-0 h-7 px-3 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
                    historyFilter === f.id
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'border-border/40 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-bold text-foreground">Nothing yet</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/30">
                {historyItems.map((item, i) => {
                  if (item._source === 'notepad') {
                    return (
                      <PrivateRow
                        key={`note-${item.id}`}
                        item={item}
                        onDelete={deleteNotepadItem}
                      />
                    );
                  }
                  // Thread item
                  const meta = TYPE_META[item.type] || TYPE_META.announcement;
                  const Icon = meta.icon;
                  return (
                    <div key={`thread-${item.id}`} className="flex items-center gap-3 px-4 py-3.5">
                      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
                        <Icon className={cn('h-4 w-4', meta.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {meta.label} · Shared · {formatTime(item._date)}
                        </p>
                      </div>
                      {item.requires_acknowledgement && (
                        <span className={cn(
                          'shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border',
                          ackedIds.has(item.id)
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        )}>
                          {ackedIds.has(item.id) ? 'Acked' : 'Ack needed'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Quick-add modals ─────────────────────────────────────────────── */}
      <QuickAddEightySixModal
        open={modal === '86'}
        onClose={() => setModal(null)}
        onSuccess={() => { toast.success('86 item added'); setModal(null); }}
      />
      {modal === 'log' && (
        <LogCreateModal
          onClose={() => setModal(null)}
          onCreated={() => { toast.success('Log entry created'); setModal(null); }}
        />
      )}
    </div>
  );
}

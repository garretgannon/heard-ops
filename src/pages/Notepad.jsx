import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import QuickAddEightySixModal from '@/components/QuickAddEightySixModal';
import QuickAddWasteModal from '@/components/QuickAddWasteModal';
import QuickAddPrepModal from '@/components/QuickAddPrepModal';
import LogCreateModal from '@/components/LogCreateModal';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import {
  AlertCircle, AlignLeft, ArrowRight, Bell, CalendarDays, Check, CheckSquare,
  ChefHat, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
  FileText, Plus, Shield, Trash2, User, UserCircle, X, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Quick action definitions (desktop 5-item list) ────────────────────────────
const QUICK_ACTIONS = [
  {
    key: '86', label: '86 Item', desc: 'Flag an item as out — pushes to the 86 board.',
    icon: XCircle,
    accent: { wrap: 'bg-red-500/8 border-red-500/20 hover:border-red-500/35', icon: 'bg-red-500/15 text-red-400', btn: 'border-red-500/25 text-red-400 hover:bg-red-500/15' },
  },
  {
    key: 'log', label: 'Manager Log', desc: 'Write a shift note, issue, or incident.',
    icon: FileText,
    accent: { wrap: 'bg-blue-500/8 border-blue-500/20 hover:border-blue-500/35', icon: 'bg-blue-500/15 text-blue-400', btn: 'border-blue-500/25 text-blue-400 hover:bg-blue-500/15' },
  },
  {
    key: 'task', label: 'Assign Task', desc: 'Create and assign a task to a staff member.',
    icon: CheckSquare,
    accent: { wrap: 'bg-amber-500/8 border-amber-500/20 hover:border-amber-500/35', icon: 'bg-amber-500/15 text-amber-400', btn: 'border-amber-500/25 text-amber-400 hover:bg-amber-500/15' },
  },
  {
    key: 'prep', label: 'Add Prep', desc: 'Log a prep task or item that needs to get done.',
    icon: ChefHat,
    accent: { wrap: 'bg-emerald-500/8 border-emerald-500/20 hover:border-emerald-500/35', icon: 'bg-emerald-500/15 text-emerald-400', btn: 'border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15' },
  },
  {
    key: 'waste', label: 'Log Waste', desc: 'Record a food or product waste entry.',
    icon: Trash2,
    accent: { wrap: 'bg-orange-500/8 border-orange-500/20 hover:border-orange-500/35', icon: 'bg-orange-500/15 text-orange-400', btn: 'border-orange-500/25 text-orange-400 hover:bg-orange-500/15' },
  },
];

// ── Mobile suggested actions (4-item list matching design) ────────────────────
const MOBILE_QUICK_ACTIONS = [
  { key: '86',       label: '86 Item',     desc: 'Flag an item as out — pushes to the 86 board.',   icon: XCircle,    iconBg: 'bg-red-500/15',    iconColor: 'text-red-400'    },
  { key: 'log',      label: 'Manager Log', desc: 'Write a shift note, issue, or incident.',          icon: FileText,   iconBg: 'bg-blue-500/15',   iconColor: 'text-blue-400'   },
  { key: 'task',     label: 'Assign Task', desc: 'Create and assign a task to a staff member.',      icon: CheckSquare,iconBg: 'bg-amber-500/15',  iconColor: 'text-amber-400'  },
  { key: 'incident', label: 'Incident',    desc: 'Document an incident or safety concern.',          icon: Shield,     iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400' },
];

const TYPE_CONFIG = {
  task:      { icon: CheckSquare, color: 'text-amber-400/70' },
  note:      { icon: AlignLeft,   color: 'text-blue-400/60' },
  follow_up: { icon: ArrowRight,  color: 'text-primary/60' },
  issue:     { icon: AlertCircle, color: 'text-red-400/60' },
};

const MOBILE_TYPE_CONFIG = {
  task:      { icon: CheckSquare, bg: 'bg-amber-500/15',  color: 'text-amber-400',  label: 'Task' },
  note:      { icon: FileText,    bg: 'bg-blue-500/15',   color: 'text-blue-400',   label: 'Note' },
  follow_up: { icon: ArrowRight,  bg: 'bg-primary/15',    color: 'text-primary',    label: 'Follow-up' },
  issue:     { icon: Shield,      bg: 'bg-purple-500/15', color: 'text-purple-400', label: 'Incident' },
};

const TYPE_TABS = [
  { type: 'task',      icon: CheckSquare, label: 'Task',      active: 'bg-primary/15 text-primary border-primary/40' },
  { type: 'note',      icon: AlignLeft,   label: 'Note',      active: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { type: 'follow_up', icon: ArrowRight,  label: 'Follow-up', active: 'bg-primary/15 text-primary border-primary/30' },
  { type: 'issue',     icon: AlertCircle, label: 'Issue',     active: 'bg-red-500/15 text-red-400 border-red-500/30' },
];

// ── Item card (desktop workspace) ─────────────────────────────────────────────
function PendingItem({ item, onToggle, onDelete, onAssign, employees, assigningId, setAssigningId, empSearch, setEmpSearch }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.note;
  const Icon = cfg.icon;
  const isAssigning = assigningId === item.id;
  const filteredEmps = isAssigning
    ? employees.filter(e => !empSearch || e.full_name?.toLowerCase().includes(empSearch.toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 px-3.5 py-3">
        {item.type === 'task' ? (
          <button
            onClick={() => onToggle(item)}
            className={cn(
              'mt-0.5 h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors',
              item.checked ? 'bg-emerald-500/20 border-emerald-500/50' : 'border-border hover:border-amber-500/50'
            )}
          >
            {item.checked && <Check className="h-3 w-3 text-emerald-400" />}
          </button>
        ) : (
          <div className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center">
            <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
          </div>
        )}
        <p className={cn('flex-1 text-sm leading-snug break-words min-w-0', item.checked ? 'line-through text-muted-foreground/40' : 'text-foreground')}>
          {item.content}
        </p>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            onClick={() => { setAssigningId(isAssigning ? null : item.id); setEmpSearch(''); }}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              item.assigned_to_name ? 'bg-violet-500/15 text-violet-400 border-violet-500/25' : 'text-muted-foreground/50 border-border hover:text-foreground'
            )}
          >
            <User className="h-3 w-3 shrink-0" />
            <span className="max-w-[72px] truncate hidden sm:block">{item.assigned_to_name || 'Assign'}</span>
          </button>
          <button onClick={() => onDelete(item.id)} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-red-400 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {isAssigning && (
        <div className="px-3.5 pb-3 border-t border-border/40 pt-2.5 space-y-1">
          <input
            autoFocus value={empSearch} onChange={e => setEmpSearch(e.target.value)}
            placeholder="Search team…"
            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-violet-500/50"
          />
          {item.assigned_to_id && (
            <button onClick={() => onAssign(item, null)} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg">
              <X className="h-3 w-3" /> Remove assignment
            </button>
          )}
          <div className="max-h-36 overflow-y-auto space-y-0.5">
            {filteredEmps.map(emp => (
              <button key={emp.id} onClick={() => onAssign(item, emp)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 text-xs text-foreground hover:bg-muted/30 rounded-lg transition-colors">
                <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 shrink-0">
                  {emp.full_name?.[0] ?? '?'}
                </div>
                <span className="truncate">{emp.full_name}</span>
              </button>
            ))}
            {filteredEmps.length === 0 && <p className="text-xs text-muted-foreground/40 px-3 py-1.5">No matches</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Notepad() {
  const { user }  = useCurrentUser();
  const navigate  = useNavigate();

  const [items, setItems]         = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newText, setNewText]     = useState('');
  const [newType, setNewType]     = useState('task');
  const [newAssignTo, setNewAssignTo]   = useState(null);
  const [newDueDate, setNewDueDate]     = useState('');
  const [showMobileAssign, setShowMobileAssign]     = useState(false);
  const [showMobileDueDate, setShowMobileDueDate]   = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [empSearch, setEmpSearch] = useState('');
  const inputRef = useRef(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      base44.entities.NotepadItem.filter({ created_by: user.email }),
      base44.entities.Employee.list('full_name', 100),
    ]).then(([noteItems, emps]) => {
      setItems(noteItems || []);
      setEmployees(emps || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.email]);

  async function addItem() {
    if (!newText.trim()) return;
    try {
      const item = await base44.entities.NotepadItem.create({
        content: newText.trim(),
        type: newType,
        checked: false,
        created_by: user?.email,
        created_by_name: user?.full_name || user?.email,
        assigned_to_id:   newAssignTo?.id ?? null,
        assigned_to_name: newAssignTo?.full_name ?? null,
        due_date: newDueDate || null,
      });
      setItems(prev => [item, ...prev]);
      setNewText('');
      setNewAssignTo(null);
      setNewDueDate('');
      setShowMobileAssign(false);
      setShowMobileDueDate(false);
      inputRef.current?.focus();
    } catch {
      toast.error('Failed to add item');
    }
  }

  async function toggleCheck(item) {
    if (item.type !== 'task') return;
    try {
      const updated = await base44.entities.NotepadItem.update(item.id, { checked: !item.checked });
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    } catch {
      toast.error('Failed to update');
    }
  }

  async function deleteItem(id) {
    try {
      await base44.entities.NotepadItem.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function assignItem(item, employee) {
    try {
      const updated = await base44.entities.NotepadItem.update(item.id, {
        assigned_to_id:   employee?.id ?? null,
        assigned_to_name: employee?.full_name ?? null,
      });
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      setAssigningId(null);
      setEmpSearch('');
    } catch {
      toast.error('Failed to assign');
    }
  }

  async function clearCompleted() {
    const done = items.filter(i => i.checked);
    await Promise.all(done.map(i => base44.entities.NotepadItem.delete(i.id).catch(() => {})));
    setItems(prev => prev.filter(i => !i.checked));
  }

  function handleQuickAction(key) {
    if (key === 'task')     { navigate('/tasks'); return; }
    if (key === 'incident') { setModal('log'); return; }
    setModal(key);
  }

  function formatItemTime(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isToday(d))     return `Today, ${format(d, 'h:mm a')}`;
      if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
      return format(d, 'MMM d, h:mm a');
    } catch { return ''; }
  }

  const unassignedOpen = items.filter(i => !i.checked && !i.assigned_to_id);
  const delegated      = items.filter(i => !i.checked && i.assigned_to_id);
  const completed      = items.filter(i => i.checked);

  const sortedItems = [...items].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const recentItems = showAllRecent ? sortedItems : sortedItems.slice(0, 3);

  const sharedItemProps = { employees, assigningId, setAssigningId, empSearch, setEmpSearch,
    onToggle: toggleCheck, onDelete: deleteItem, onAssign: assignItem };

  const placeholderText =
    newType === 'task'      ? 'What needs doing?' :
    newType === 'follow_up' ? 'What needs a follow-up?' :
    newType === 'issue'     ? 'Describe the issue…' :
                              'Jot something down…';

  return (
    <div className="app-screen">

      {/* ══ MOBILE TOP BAR ══════════════════════════════════════════════ */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-background border-b border-border shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-sm font-semibold text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-base font-extrabold text-foreground">Notepad</h1>
        <div className="flex items-center gap-2">
          <button className="relative h-9 w-9 flex items-center justify-center rounded-full bg-muted">
            <Bell className="h-4 w-4 text-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded-full bg-muted">
            <UserCircle className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block">
        <DesktopPageHeader
          title="Notepad"
          subtitle={
            unassignedOpen.length > 0
              ? `${unassignedOpen.length} open · ${delegated.length} delegated`
              : delegated.length > 0 ? `${delegated.length} delegated` : 'Your shift scratchpad'
          }
        />
      </div>

      <div className="app-page">

        {/* ══ MOBILE CONTENT ═══════════════════════════════════════════ */}
        <div className="lg:hidden space-y-6 pb-8">

          {/* QUICK ADD */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Quick Add</p>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">

              {/* Type tabs */}
              <div className="grid grid-cols-4 gap-1 p-3 border-b border-border/50">
                {TYPE_TABS.map(({ type, icon: Icon, label, active }) => (
                  <button
                    key={type}
                    onClick={() => setNewType(type)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] font-bold transition-all border',
                      newType === type ? active : 'border-border/50 text-muted-foreground/50 hover:text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addItem(); } }}
                placeholder={placeholderText}
                rows={4}
                className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none"
              />

              {/* Assign + Due date row */}
              <div className="flex border-t border-border/50">
                <button
                  onClick={() => { setShowMobileAssign(v => !v); setShowMobileDueDate(false); }}
                  className="flex-1 flex items-center gap-2 px-4 py-3 text-sm"
                >
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className={cn('flex-1 text-left text-sm truncate', newAssignTo ? 'text-violet-400 font-medium' : 'text-muted-foreground/60')}>
                    {newAssignTo ? newAssignTo.full_name : 'Assign to...'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                </button>
                <div className="w-px bg-border/50 my-2" />
                <button
                  onClick={() => { setShowMobileDueDate(v => !v); setShowMobileAssign(false); }}
                  className="flex-1 flex items-center gap-2 px-4 py-3 text-sm"
                >
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className={cn('text-sm truncate', newDueDate ? 'text-foreground' : 'text-muted-foreground/60')}>
                    {newDueDate ? format(new Date(newDueDate + 'T00:00:00'), 'MMM d') : 'Add due date'}
                  </span>
                </button>
              </div>

              {/* Assign picker */}
              {showMobileAssign && (
                <div className="px-3 pb-3 pt-3 border-t border-border/50 space-y-2">
                  <input
                    autoFocus
                    value={assignSearch}
                    onChange={e => setAssignSearch(e.target.value)}
                    placeholder="Search team..."
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                  />
                  {newAssignTo && (
                    <button onClick={() => { setNewAssignTo(null); setShowMobileAssign(false); }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg">
                      <X className="h-3 w-3" /> Remove assignment
                    </button>
                  )}
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {employees
                      .filter(e => !assignSearch || e.full_name?.toLowerCase().includes(assignSearch.toLowerCase()))
                      .slice(0, 8)
                      .map(emp => (
                        <button key={emp.id}
                          onClick={() => { setNewAssignTo(emp); setShowMobileAssign(false); setAssignSearch(''); }}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/30 rounded-lg transition-colors">
                          <div className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0">
                            {emp.full_name?.[0] ?? '?'}
                          </div>
                          <span className="truncate">{emp.full_name}</span>
                        </button>
                      ))}
                    {employees.filter(e => !assignSearch || e.full_name?.toLowerCase().includes(assignSearch.toLowerCase())).length === 0 && (
                      <p className="text-xs text-muted-foreground/40 px-3 py-2">No matches</p>
                    )}
                  </div>
                </div>
              )}

              {/* Due date picker */}
              {showMobileDueDate && (
                <div className="px-3 pb-3 pt-3 border-t border-border/50">
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => { setNewDueDate(e.target.value); setShowMobileDueDate(false); }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                  />
                </div>
              )}
            </div>

            {/* Add Item button */}
            <button
              onClick={addItem}
              disabled={!newText.trim()}
              className="w-full mt-3 h-12 rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-30 flex items-center justify-center gap-2 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>

          {/* SUGGESTED ACTIONS */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Suggested Actions</p>
            <div className="space-y-2.5">
              {MOBILE_QUICK_ACTIONS.map(qa => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.key}
                    onClick={() => handleQuickAction(qa.key)}
                    className="w-full rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-left active:opacity-80"
                  >
                    <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', qa.iconBg)}>
                      <Icon className={cn('h-[18px] w-[18px]', qa.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{qa.label}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">{qa.desc}</p>
                    </div>
                    <div className="h-9 w-9 rounded-xl border border-primary/30 flex items-center justify-center shrink-0">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RECENT ITEMS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Recent Items</p>
              {items.length > 3 && (
                <button onClick={() => setShowAllRecent(v => !v)} className="text-xs font-semibold text-primary">
                  {showAllRecent ? 'Show Less' : 'View All'}
                </button>
              )}
            </div>
            {loading ? (
              <p className="text-xs text-muted-foreground/40 text-center py-8">Loading…</p>
            ) : recentItems.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 text-center py-8">No items yet</p>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/50">
                {recentItems.map(item => {
                  const cfg = MOBILE_TYPE_CONFIG[item.type] || MOBILE_TYPE_CONFIG.note;
                  const Icon = cfg.icon;
                  const metaAuthor = item.assigned_to_name
                    ? `Assigned to ${item.assigned_to_name}`
                    : `By ${item.created_by_name || 'You'}`;
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                        <Icon className={cn('h-4 w-4', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.content}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{cfg.label} · {metaAuthor}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 text-right">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatItemTime(item.created_at)}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ══ DESKTOP CONTENT ═════════════════════════════════════════ */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-[340px_1fr] xl:grid-cols-[420px_1fr] gap-6 xl:gap-8 items-start">

          {/* LEFT PANEL: Add Item + Quick Add */}
          <div className="space-y-5">

            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-0.5 mb-3">Add Item</p>
              <div className="app-card-lg space-y-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { type: 'task',      icon: CheckSquare, label: 'Task',      active: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                    { type: 'note',      icon: AlignLeft,   label: 'Note',      active: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                    { type: 'follow_up', icon: ArrowRight,  label: 'Follow-up', active: 'bg-primary/15 text-primary border-primary/30' },
                    { type: 'issue',     icon: AlertCircle, label: 'Issue',     active: 'bg-red-500/15 text-red-400 border-red-500/30' },
                  ].map(({ type, icon: Icon, label, active }) => (
                    <button
                      key={type}
                      onClick={() => setNewType(type)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors border',
                        newType === type ? active : 'text-muted-foreground/60 border-border hover:border-border/80'
                      )}
                    >
                      <Icon className="h-3 w-3" /> {label}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={inputRef}
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addItem(); } }}
                  placeholder={placeholderText}
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-amber-500/50 transition-colors resize-none"
                />
                <button
                  onClick={addItem}
                  disabled={!newText.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-30 transition-opacity"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="app-card space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Summary</p>
                <div className="space-y-1.5">
                  {unassignedOpen.length > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Open</span>
                      <span className="font-bold text-foreground">{unassignedOpen.length}</span>
                    </div>
                  )}
                  {delegated.length > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Delegated</span>
                      <span className="font-bold text-violet-400">{delegated.length}</span>
                    </div>
                  )}
                  {completed.length > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-bold text-emerald-400">{completed.length}</span>
                    </div>
                  )}
                </div>
                {completed.length > 0 && (
                  <button onClick={clearCompleted} className="w-full pt-1 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
                    Clear {completed.length} completed
                  </button>
                )}
              </div>
            )}

            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-0.5 mb-3">Quick Add</p>
              <div className="space-y-2">
                {QUICK_ACTIONS.map(qa => {
                  const Icon = qa.icon;
                  return (
                    <button key={qa.key} onClick={() => handleQuickAction(qa.key)}
                      className={cn('w-full rounded-xl border p-4 text-left flex items-center gap-4 transition-colors', qa.accent.wrap)}>
                      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', qa.accent.icon)}>
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{qa.label}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">{qa.desc}</p>
                      </div>
                      <div className={cn('h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors', qa.accent.btn)}>
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Open Items Workspace */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Open Items</p>
              {(unassignedOpen.length > 0 || delegated.length > 0) && (
                <span className="text-[10px] font-bold text-muted-foreground/50 bg-muted/30 px-2 py-0.5 rounded-full">
                  {unassignedOpen.length + delegated.length}
                </span>
              )}
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/30 min-h-[480px]">
              {loading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground/40 text-sm">Loading…</div>
              ) : unassignedOpen.length === 0 && delegated.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[480px] text-center px-8 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-amber-400/50" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Nothing open</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">Items you add will appear here until completed or cleared.</p>
                  </div>
                  <button onClick={() => { setNewType('task'); inputRef.current?.focus(); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-bold hover:bg-amber-500/25 transition-colors">
                    <Plus className="h-4 w-4" /> Add first item
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-5">
                  {unassignedOpen.length > 0 && (
                    <div className="space-y-2">
                      {unassignedOpen.map(item => <PendingItem key={item.id} item={item} {...sharedItemProps} />)}
                    </div>
                  )}
                  {delegated.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/60 px-0.5">Delegated · {delegated.length}</p>
                      {delegated.map(item => (
                        <div key={item.id} className="rounded-xl border border-violet-500/15 bg-violet-500/5">
                          <div className="flex items-start gap-3 px-3.5 py-3">
                            {(() => {
                              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.note;
                              const Icon = cfg.icon;
                              return <div className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center"><Icon className={cn('h-3.5 w-3.5', cfg.color)} /></div>;
                            })()}
                            <p className="flex-1 text-sm leading-snug break-words min-w-0 text-foreground">{item.content}</p>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/25">
                                <User className="h-3 w-3" />
                                <span className="max-w-[72px] truncate">{item.assigned_to_name}</span>
                              </span>
                              <button onClick={() => deleteItem(item.id)} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-red-400 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Quick-add modals ───────────────────────────────────────────── */}
      <QuickAddEightySixModal
        open={modal === '86'}
        onClose={() => setModal(null)}
        onSuccess={() => { toast.success('86 item added'); setModal(null); }}
      />
      <QuickAddWasteModal
        open={modal === 'waste'}
        onClose={() => setModal(null)}
        onSuccess={() => { toast.success('Waste entry logged'); setModal(null); }}
      />
      <QuickAddPrepModal
        open={modal === 'prep'}
        onClose={() => setModal(null)}
        onSuccess={() => { toast.success('Prep item added'); setModal(null); }}
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

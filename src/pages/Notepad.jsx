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
import {
  AlertCircle, AlignLeft, ArrowRight, Check, CheckSquare,
  ChefHat, ClipboardList, FileText, Plus, Trash2, User, X, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Quick action definitions ──────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    key: '86',
    label: '86 Item',
    desc: 'Flag an item as out — pushes to the 86 board.',
    icon: XCircle,
    accent: {
      wrap:   'bg-red-500/8 border-red-500/20 hover:border-red-500/35',
      icon:   'bg-red-500/15 text-red-400',
      btn:    'border-red-500/25 text-red-400 hover:bg-red-500/15',
    },
  },
  {
    key: 'log',
    label: 'Manager Log',
    desc: 'Write a shift note, issue, or incident.',
    icon: FileText,
    accent: {
      wrap:   'bg-blue-500/8 border-blue-500/20 hover:border-blue-500/35',
      icon:   'bg-blue-500/15 text-blue-400',
      btn:    'border-blue-500/25 text-blue-400 hover:bg-blue-500/15',
    },
  },
  {
    key: 'task',
    label: 'Assign Task',
    desc: 'Create and assign a task to a staff member.',
    icon: CheckSquare,
    accent: {
      wrap:   'bg-amber-500/8 border-amber-500/20 hover:border-amber-500/35',
      icon:   'bg-amber-500/15 text-amber-400',
      btn:    'border-amber-500/25 text-amber-400 hover:bg-amber-500/15',
    },
  },
  {
    key: 'prep',
    label: 'Add Prep',
    desc: 'Log a prep task or item that needs to get done.',
    icon: ChefHat,
    accent: {
      wrap:   'bg-emerald-500/8 border-emerald-500/20 hover:border-emerald-500/35',
      icon:   'bg-emerald-500/15 text-emerald-400',
      btn:    'border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15',
    },
  },
  {
    key: 'waste',
    label: 'Log Waste',
    desc: 'Record a food or product waste entry.',
    icon: Trash2,
    accent: {
      wrap:   'bg-orange-500/8 border-orange-500/20 hover:border-orange-500/35',
      icon:   'bg-orange-500/15 text-orange-400',
      btn:    'border-orange-500/25 text-orange-400 hover:bg-orange-500/15',
    },
  },
];

const TYPE_CONFIG = {
  task:      { icon: CheckSquare, color: 'text-amber-400/70' },
  note:      { icon: AlignLeft,   color: 'text-blue-400/60' },
  follow_up: { icon: ArrowRight,  color: 'text-primary/60' },
  issue:     { icon: AlertCircle, color: 'text-red-400/60' },
};

// ── Item card used in column 3 ────────────────────────────────────────────────
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
              item.checked
                ? 'bg-emerald-500/20 border-emerald-500/50'
                : 'border-border hover:border-amber-500/50'
            )}
          >
            {item.checked && <Check className="h-3 w-3 text-emerald-400" />}
          </button>
        ) : (
          <div className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center">
            <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
          </div>
        )}

        <p className={cn(
          'flex-1 text-sm leading-snug break-words min-w-0',
          item.checked ? 'line-through text-muted-foreground/40' : 'text-foreground'
        )}>
          {item.content}
        </p>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            onClick={() => { setAssigningId(isAssigning ? null : item.id); setEmpSearch(''); }}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              item.assigned_to_name
                ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                : 'text-muted-foreground/50 border-border hover:text-foreground'
            )}
          >
            <User className="h-3 w-3 shrink-0" />
            <span className="max-w-[72px] truncate hidden sm:block">
              {item.assigned_to_name || 'Assign'}
            </span>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isAssigning && (
        <div className="px-3.5 pb-3 border-t border-border/40 pt-2.5 space-y-1">
          <input
            autoFocus
            value={empSearch}
            onChange={e => setEmpSearch(e.target.value)}
            placeholder="Search team…"
            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-violet-500/50"
          />
          {item.assigned_to_id && (
            <button
              onClick={() => onAssign(item, null)}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              <X className="h-3 w-3" /> Remove assignment
            </button>
          )}
          <div className="max-h-36 overflow-y-auto space-y-0.5">
            {filteredEmps.map(emp => (
              <button
                key={emp.id}
                onClick={() => onAssign(item, emp)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 text-xs text-foreground hover:bg-muted/30 rounded-lg transition-colors"
              >
                <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 shrink-0">
                  {emp.full_name?.[0] ?? '?'}
                </div>
                <span className="truncate">{emp.full_name}</span>
              </button>
            ))}
            {filteredEmps.length === 0 && (
              <p className="text-xs text-muted-foreground/40 px-3 py-1.5">No matches</p>
            )}
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
  const [loading, setLoading]     = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [empSearch, setEmpSearch] = useState('');
  const inputRef = useRef(null);

  // Quick-action modal state
  const [modal, setModal] = useState(null); // '86' | 'log' | 'prep' | 'waste' | null

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
      });
      setItems(prev => [...prev, item]);
      setNewText('');
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
    if (key === 'task') { navigate('/tasks'); return; }
    setModal(key);
  }

  const unassignedOpen = items.filter(i => !i.checked && !i.assigned_to_id);
  const delegated      = items.filter(i => !i.checked && i.assigned_to_id);
  const completed      = items.filter(i => i.checked);

  const sharedItemProps = { employees, assigningId, setAssigningId, empSearch, setEmpSearch,
    onToggle: toggleCheck, onDelete: deleteItem, onAssign: assignItem };

  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Notepad"
        subtitle={
          unassignedOpen.length > 0
            ? `${unassignedOpen.length} open · ${delegated.length} delegated`
            : delegated.length > 0
              ? `${delegated.length} delegated`
              : 'Your shift scratchpad'
        }
      />

      <div className="app-page-narrow">
        <div className="lg:grid lg:grid-cols-[280px_1fr_320px] lg:gap-6 space-y-4 lg:space-y-0">

          {/* ────────────────────────────────────────
              COLUMN 1 — Add Item
          ──────────────────────────────────────── */}
          <aside className="space-y-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-0.5">Add Item</p>
            <div className="app-card-lg space-y-3">

              {/* Type toggle */}
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

              {/* Textarea — grows to fill remaining card height on desktop */}
              <textarea
                ref={inputRef}
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addItem(); }
                }}
                placeholder={
                  newType === 'task'      ? 'What needs doing?' :
                  newType === 'follow_up' ? 'What needs a follow-up?' :
                  newType === 'issue'     ? 'Describe the issue…' :
                                           'Jot something down…'
                }
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

            {/* Stats — only show when there's something */}
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
                  <button
                    onClick={clearCompleted}
                    className="w-full pt-1 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                  >
                    Clear {completed.length} completed
                  </button>
                )}
              </div>
            )}
          </aside>

          {/* ────────────────────────────────────────
              COLUMN 2 — Quick Actions
          ──────────────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-0.5">Quick Add</p>
            <div className="space-y-2">
              {QUICK_ACTIONS.map(qa => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.key}
                    onClick={() => handleQuickAction(qa.key)}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left flex items-center gap-4 transition-colors',
                      qa.accent.wrap
                    )}
                  >
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', qa.accent.icon)}>
                      <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{qa.label}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">{qa.desc}</p>
                    </div>
                    <div className={cn(
                      'h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors',
                      qa.accent.btn
                    )}>
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ────────────────────────────────────────
              COLUMN 3 — Pending / Open Items
          ──────────────────────────────────────── */}
          <aside className="space-y-4">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Open Items</p>
              {unassignedOpen.length > 0 && (
                <span className="text-[10px] font-bold text-muted-foreground/50 bg-muted/30 px-2 py-0.5 rounded-full">
                  {unassignedOpen.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground/50 text-sm">Loading…</div>
            ) : unassignedOpen.length === 0 && delegated.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/40 py-12 px-6 text-center space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <ClipboardList className="h-5 w-5 text-amber-400/50" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Nothing open</p>
                  <p className="text-xs text-muted-foreground mt-1">Items you add will appear here until completed or cleared.</p>
                </div>
                <button
                  onClick={() => { setNewType('task'); inputRef.current?.focus(); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-bold hover:bg-amber-500/25 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add first item
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Unassigned open items */}
                {unassignedOpen.length > 0 && (
                  <div className="space-y-2">
                    {unassignedOpen.map(item => (
                      <PendingItem key={item.id} item={item} {...sharedItemProps} />
                    ))}
                  </div>
                )}

                {/* Delegated section */}
                {delegated.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/60 px-0.5">
                      Delegated · {delegated.length}
                    </p>
                    {delegated.map(item => (
                      <div key={item.id} className="rounded-xl border border-violet-500/15 bg-violet-500/5">
                        <div className="flex items-start gap-3 px-3.5 py-3">
                          {(() => { const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.note; const Icon = cfg.icon; return (
                            <div className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center">
                              <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
                            </div>
                          ); })()}
                          <p className="flex-1 text-sm leading-snug break-words min-w-0 text-foreground">{item.content}</p>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/25">
                              <User className="h-3 w-3" />
                              <span className="max-w-[72px] truncate">{item.assigned_to_name}</span>
                            </span>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-red-400 transition-colors"
                            >
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
          </aside>

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

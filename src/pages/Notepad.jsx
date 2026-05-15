import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { cn } from '@/lib/utils';
import { AlignLeft, Check, CheckSquare, FileText, Plus, Trash2, User, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Notepad() {
  const { user } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState('task');
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [empSearch, setEmpSearch] = useState('');
  const inputRef = useRef(null);

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
        assigned_to_id: employee?.id ?? null,
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

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);
  const assigned = items.filter(i => i.assigned_to_id && !i.checked);

  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Notepad"
        subtitle={unchecked.length > 0 ? `${unchecked.length} open` : undefined}
      />

      <div className="app-page-narrow">
      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6 space-y-4 lg:space-y-0">

        {/* Left panel — add + stats */}
        <aside className="space-y-4">
          <div className="app-card-lg space-y-3">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Add Item</p>

            {/* Type toggle */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setNewType('task')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors",
                  newType === 'task'
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-muted-foreground/60 border border-border hover:border-border/80"
                )}
              >
                <CheckSquare className="h-3 w-3" /> Task
              </button>
              <button
                onClick={() => setNewType('note')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors",
                  newType === 'note'
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-muted-foreground/60 border border-border hover:border-border/80"
                )}
              >
                <AlignLeft className="h-3 w-3" /> Note
              </button>
            </div>

            {/* Input */}
            <textarea
              ref={inputRef}
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addItem(); }
              }}
              placeholder={newType === 'task' ? 'What needs doing?' : 'Jot something down...'}
              rows={3}
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

          {/* Stats */}
          {items.length > 0 && (
            <div className="app-card space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Summary</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Open tasks</span>
                  <span className="font-bold text-foreground">{unchecked.filter(i => i.type === 'task').length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="font-bold text-foreground">{items.filter(i => i.type === 'note').length}</span>
                </div>
                {assigned.length > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Delegated</span>
                    <span className="font-bold text-violet-400">{assigned.length}</span>
                  </div>
                )}
                {checked.length > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-bold text-emerald-400">{checked.length}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Right panel — item list */}
        <section>
          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border/40 rounded-2xl">
              <FileText className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nothing here yet</p>
              <p className="text-xs text-muted-foreground/40 mt-1">Add a task or note on the left</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...unchecked, ...checked].map(item => {
                const isAssigning = assigningId === item.id;
                const filteredEmps = isAssigning
                  ? employees.filter(e => !empSearch || e.full_name?.toLowerCase().includes(empSearch.toLowerCase())).slice(0, 6)
                  : [];

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl border transition-colors",
                      item.checked ? "border-border/30 bg-card/20" : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      {item.type === 'task' ? (
                        <button
                          onClick={() => toggleCheck(item)}
                          className={cn(
                            "mt-0.5 h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors",
                            item.checked
                              ? "bg-emerald-500/20 border-emerald-500/50"
                              : "border-border hover:border-amber-500/50"
                          )}
                        >
                          {item.checked && <Check className="h-3 w-3 text-emerald-400" />}
                        </button>
                      ) : (
                        <div className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center">
                          <AlignLeft className="h-3.5 w-3.5 text-blue-400/60" />
                        </div>
                      )}

                      <p className={cn(
                        "flex-1 text-sm leading-snug break-words min-w-0",
                        item.checked ? "line-through text-muted-foreground/40" : "text-foreground"
                      )}>
                        {item.content}
                      </p>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => { setAssigningId(isAssigning ? null : item.id); setEmpSearch(''); }}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                            item.assigned_to_name
                              ? "bg-violet-500/15 text-violet-400 border-violet-500/25"
                              : "text-muted-foreground/60 border-border hover:text-foreground"
                          )}
                        >
                          <User className="h-3 w-3 shrink-0" />
                          <span className="max-w-[100px] truncate">
                            {item.assigned_to_name || 'Assign'}
                          </span>
                        </button>

                        <button
                          onClick={() => deleteItem(item.id)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Assignee picker */}
                    {isAssigning && (
                      <div className="px-4 pb-3 border-t border-border/40 pt-3 space-y-1">
                        <input
                          autoFocus
                          value={empSearch}
                          onChange={e => setEmpSearch(e.target.value)}
                          placeholder="Search team..."
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-violet-500/50"
                        />
                        {item.assigned_to_id && (
                          <button
                            onClick={() => assignItem(item, null)}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            <X className="h-3 w-3" /> Remove assignment
                          </button>
                        )}
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                          {filteredEmps.map(emp => (
                            <button
                              key={emp.id}
                              onClick={() => assignItem(item, emp)}
                              className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted/30 rounded-lg transition-colors"
                            >
                              <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 shrink-0">
                                {emp.full_name?.[0] ?? '?'}
                              </div>
                              <span className="truncate">{emp.full_name}</span>
                            </button>
                          ))}
                          {filteredEmps.length === 0 && (
                            <p className="text-xs text-muted-foreground/40 px-3 py-2">No matches</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {checked.length > 0 && (
                <button
                  onClick={clearCompleted}
                  className="w-full text-xs text-muted-foreground/40 hover:text-muted-foreground/70 py-2 transition-colors"
                >
                  Clear {checked.length} completed
                </button>
              )}
            </div>
          )}
        </section>
      </div>
      </div>
    </div>
  );
}

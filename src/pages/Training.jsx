import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  BookOpen, Plus, Search, Upload, CheckCircle2, Clock, AlertCircle,
  Play, Edit2, Trash2, Users, Award, ChevronRight,
  ChevronLeft, Bell, UserCircle, Shield, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TrainingBuilder from '@/components/training/TrainingBuilder';
import TrainingPlayer from '@/components/training/TrainingPlayer';
import TrainingImport from '@/components/training/TrainingImport';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  onboarding: 'Onboarding',
  role_training: 'Role',
  compliance: 'Compliance',
  food_safety: 'Food Safety',
  system_training: 'System',
  skill_development: 'Skills',
  certification: 'Certification',
  other: 'Other',
};

const TYPE_LABELS = {
  reading: 'Reading',
  checklist: 'Checklist',
  quiz: 'Quiz',
  video: 'Video',
  certification: 'Cert',
  learning_path: 'Path',
};

function statusBadge(mod) {
  if (mod.status === 'published' || mod.active) {
    return <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px] font-bold">Published</span>;
  }
  return <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">Draft</span>;
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="rounded-2xl border border-border/30 bg-card/60 px-4 py-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className={cn('h-3.5 w-3.5', color)} />
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('text-2xl font-black', color)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Admin Module Card ────────────────────────────────────────────────────────

function ModuleCard({ mod, completions, assignments, onEdit, onDelete, onPlay, onAssign }) {
  const modCompletions = completions.filter(c => c.moduleId === mod.id || c.module_id === mod.id);
  const modAssignments = assignments.filter(a => a.moduleId === mod.id || a.module_id === mod.id);
  const blocks = (() => {
    try { return JSON.parse(mod.content_blocks || '[]'); } catch { return []; }
  })();

  return (
    <div
      className="rounded-2xl border border-border/30 overflow-hidden transition-all hover:border-border/60"
      style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {statusBadge(mod)}
              {mod.required && (
                <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-bold">Required</span>
              )}
            </div>
            <h3 className="font-black text-foreground text-sm leading-snug">{mod.title}</h3>
            {mod.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {mod.category && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
              {CATEGORY_LABELS[mod.category] || mod.category}
            </span>
          )}
          {mod.moduleType && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
              {TYPE_LABELS[mod.moduleType] || mod.moduleType}
            </span>
          )}
          {mod.estimatedMinutes && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" /> {mod.estimatedMinutes}m
            </span>
          )}
          {blocks.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
              {blocks.length} blocks
            </span>
          )}
        </div>

        {(modCompletions.length > 0 || modAssignments.length > 0) && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            {modAssignments.length > 0 && (
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {modAssignments.length} assigned</span>
            )}
            {modCompletions.length > 0 && (
              <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> {modCompletions.length} completed</span>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onPlay(mod)}
            className="flex-1 h-10 rounded-lg border border-border/40 bg-card/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-border/80 flex items-center justify-center gap-1 transition-all"
          >
            <Play className="h-3 w-3" /> Preview
          </button>
          <button
            onClick={() => onAssign(mod)}
            className="flex-1 h-10 rounded-lg border border-border/40 bg-card/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-border/80 flex items-center justify-center gap-1 transition-all"
          >
            <Users className="h-3 w-3" /> Assign
          </button>
          <button
            onClick={() => onEdit(mod)}
            className="h-10 px-3 rounded-lg border border-border/40 bg-card/60 text-muted-foreground hover:text-foreground hover:border-border/80 transition-all"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(mod.id)}
            className="h-10 px-3 rounded-lg border border-border/40 bg-card/60 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────

function AssignModal({ module, onClose, onSuccess }) {
  const [form, setForm] = useState({
    assignedToEmployeeName: '',
    assignee_email: '',
    dueDate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.assignedToEmployeeName.trim()) { toast.error('Enter a name'); return; }
    setSaving(true);
    try {
      await base44.entities.TrainingAssignment.create({
        moduleId: module.id,
        module_id: module.id,
        moduleName: module.title,
        module_title: module.title,
        assignedToEmployeeName: form.assignedToEmployeeName,
        assignee_email: form.assignee_email,
        assigned_to_email: form.assignee_email,
        dueDate: form.dueDate || null,
        notes: form.notes,
        status: 'pending',
        assignedAt: new Date().toISOString(),
      });
      toast.success('Assigned!');
      onSuccess?.();
    } catch {
      toast.error('Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center">
      <div className="bg-card w-full max-w-md rounded-t-2xl lg:rounded-2xl border border-border/30 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Assign Training</h2>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
        <div className="rounded-lg border border-border/30 bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">Module</p>
          <p className="text-sm font-bold text-foreground">{module.title}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Employee Name *</label>
            <input
              type="text"
              value={form.assignedToEmployeeName}
              onChange={e => setForm(f => ({ ...f, assignedToEmployeeName: e.target.value }))}
              placeholder="Jane Smith"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Email (optional)</label>
            <input
              type="email"
              value={form.assignee_email}
              onChange={e => setForm(f => ({ ...f, assignee_email: e.target.value }))}
              placeholder="jane@restaurant.com"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Due Date (optional)</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl bg-muted font-semibold text-sm hover:bg-muted/80 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary h-10 text-sm disabled:opacity-50">
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin View ───────────────────────────────────────────────────────────────

const ADMIN_TABS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'required', label: 'Required' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'completions', label: 'Completions' },
];

function AdminView({ modules, assignments, completions, certifications, onRefresh }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [playingModule, setPlayingModule] = useState(null);
  const [assigningModule, setAssigningModule] = useState(null);
  const [importData, setImportData] = useState(null);

  const published = modules.filter(m => m.status === 'published' || (m.active && m.status !== 'draft'));
  const drafts = modules.filter(m => m.status === 'draft' || (!m.active && m.status !== 'published'));
  const overdue = assignments.filter(a => a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'complete');
  const thisWeek = completions.filter(c => {
    const d = new Date(c.completedAt);
    const now = new Date();
    return d >= new Date(now.setDate(now.getDate() - 7));
  });

  const filteredModules = modules.filter(m => {
    if (tab === 'published') return m.status === 'published' || (m.active && m.status !== 'draft');
    if (tab === 'draft') return m.status === 'draft' || (!m.active && m.status !== 'published');
    if (tab === 'required') return m.required;
    return true;
  }).filter(m =>
    !search.trim() || m.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this training module?')) return;
    try {
      await base44.entities.TrainingModule.delete(id);
      toast.success('Module deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openImport = () => setShowImport(true);

  if (showBuilder || editingModule) {
    return (
      <TrainingBuilder
        module={editingModule}
        initialData={importData}
        onClose={() => { setShowBuilder(false); setEditingModule(null); setImportData(null); }}
        onSuccess={() => { setShowBuilder(false); setEditingModule(null); setImportData(null); onRefresh(); }}
      />
    );
  }

  if (playingModule) {
    return (
      <TrainingPlayer
        module={playingModule}
        onClose={() => setPlayingModule(null)}
        onComplete={() => { setPlayingModule(null); onRefresh(); }}
      />
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Desktop header */}
      <div
        className="hidden lg:flex items-center justify-between shrink-0 -mx-8 px-8 h-10"
        style={{ background: 'rgba(5,8,14,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-foreground/90 tracking-wide">Training</h1>
          <span className="text-muted-foreground/30 text-sm">·</span>
          <p className="text-[13px] text-muted-foreground/60">Modules, assignments, and completions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openImport} className="h-8 px-3 rounded-lg border border-border/60 card-glass text-foreground font-bold text-xs flex items-center gap-1">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button onClick={() => setShowBuilder(true)} className="btn-primary h-8 px-3 text-xs flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Module
          </button>
        </div>
      </div>

      {/* ── MOBILE TOP BAR ──────────────────────────────────────────────── */}
      <div
        className="lg:hidden sticky top-0 z-10"
        style={{ background: '#000000', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/[0.06] border border-border/30"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <span className="text-[15px] font-black text-foreground">Training</span>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <UserCircle className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* ── MOBILE PREMIUM EMPTY STATE ──────────────────────────────────── */}
      {modules.length === 0 && !search && (
        <div className="lg:hidden flex flex-col items-center px-6 pt-8 pb-16 text-center">
          {/* Book icon with sparkle decorations */}
          <div className="relative mb-6 mt-4">
            <span className="absolute -top-6 right-0 text-primary/60 text-xl select-none">✦</span>
            <span className="absolute -top-1 -left-6 text-primary/40 text-base select-none">✦</span>
            <span className="absolute bottom-1 -right-5 text-primary/30 text-sm select-none">✦</span>
            <BookOpen className="h-20 w-20 text-muted-foreground/40" strokeWidth={1.2} />
          </div>
          <h2 className="text-[22px] font-black text-foreground mb-2">No training modules yet</h2>
          <p className="text-[14px] text-muted-foreground leading-relaxed mb-8 max-w-[280px]">
            Create your first module to assign training by role, station, or job code.
          </p>
          <div className="w-full space-y-3 mb-10">
            <button
              onClick={() => setShowBuilder(true)}
              className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-[15px] font-black text-white active:scale-[0.97] transition-all"
              style={{
                background: 'linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)',
                boxShadow: '0 0 0 1px rgba(230,106,31,0.35), 0 0 20px rgba(230,106,31,0.18)',
              }}
            >
              <Plus className="h-4 w-4" /> Create First Module
            </button>
            <button
              onClick={openImport}
              className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-[15px] font-semibold text-foreground active:scale-[0.97] transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'transparent' }}
            >
              <Upload className="h-4 w-4" /> Import Existing Content
            </button>
          </div>
          {/* Feature list */}
          <div className="w-full text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-4">Once you start, you can</p>
            <div className="space-y-4">
              {[
                { icon: Users,     label: 'Assign by Role or Station', desc: 'Target training to the right team members.' },
                { icon: TrendingUp, label: 'Track Completions',        desc: 'See progress and completion status.' },
                { icon: Award,     label: 'Issue Certifications',      desc: 'Validate skills and keep records.' },
                { icon: Shield,    label: 'Stay Compliant',            desc: 'Keep training and certifications up to date.' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/[0.05] border border-border/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-foreground leading-snug">{label}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={cn('flex-1 lg:overflow-y-auto', modules.length === 0 && !search ? 'hidden lg:flex lg:flex-col' : '')}>
        <div className="px-4 lg:px-8 py-4 space-y-4 pb-28 lg:pb-8">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={BookOpen} label="Total" value={modules.length} sub={`${published.length} published`} />
            <StatCard icon={CheckCircle2} label="This Week" value={thisWeek.length} sub="completions" color="text-green-400" />
            <StatCard icon={AlertCircle} label="Overdue" value={overdue.length} sub="assignments" color={overdue.length > 0 ? 'text-red-400' : 'text-muted-foreground'} />
            <StatCard icon={Award} label="Certifications" value={certifications.length} sub="total issued" color="text-amber-400" />
          </div>

          {/* Mobile new module button */}
          <div className="flex gap-2 lg:hidden">
            <button onClick={openImport} className="h-9 px-4 rounded-xl border border-border/50 bg-card/60 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all">
              <Upload className="h-3.5 w-3.5" /> Import
            </button>
            <button onClick={() => setShowBuilder(true)} className="flex-1 btn-primary h-9 text-xs flex items-center justify-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New Module
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 pt-4 pl-1 scrollbar-hide">
            {ADMIN_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  tab === t.id ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search (modules tabs only) */}
          {!['assignments', 'completions'].includes(tab) && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search modules…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg card-glass border border-border/40 text-foreground text-xs focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Module Grid */}
          {!['assignments', 'completions'].includes(tab) && (
            <>
              {filteredModules.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {search ? 'No modules match your search.' : 'No training modules yet.'}
                  </p>
                  {!search && (
                    <button onClick={() => setShowBuilder(true)} className="btn-primary px-5 py-2 text-xs">
                      Create First Module
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {filteredModules.map(mod => (
                    <ModuleCard
                      key={mod.id}
                      mod={mod}
                      completions={completions}
                      assignments={assignments}
                      onEdit={m => setEditingModule(m)}
                      onDelete={handleDelete}
                      onPlay={m => setPlayingModule(m)}
                      onAssign={m => setAssigningModule(m)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Assignments Tab */}
          {tab === 'assignments' && (
            <div className="space-y-2">
              {assignments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No assignments yet.</div>
              ) : (
                assignments.map(a => {
                  const mod = modules.find(m => m.id === (a.moduleId || a.module_id));
                  const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'complete';
                  return (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/60 px-4 py-3">
                      <div className={cn('w-2 h-2 rounded-full shrink-0', {
                        'bg-green-400': a.status === 'complete',
                        'bg-red-400': isOverdue,
                        'bg-amber-400': a.status === 'in_progress',
                        'bg-muted-foreground': a.status === 'pending',
                      })} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{mod?.title || a.moduleName || a.module_title || 'Training'}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.assignedToEmployeeName || a.assignedToRoleName || 'Employee'}
                          {a.dueDate && ` · Due ${new Date(a.dueDate).toLocaleDateString()}`}
                        </p>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', {
                        'bg-green-500/15 text-green-400': a.status === 'complete',
                        'bg-red-500/15 text-red-400': isOverdue,
                        'bg-blue-500/15 text-blue-400': a.status === 'in_progress',
                        'bg-muted text-muted-foreground': a.status === 'pending',
                      })}>
                        {isOverdue ? 'Overdue' : (a.status || 'pending').replace('_', ' ')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Completions Tab */}
          {tab === 'completions' && (
            <div className="space-y-2">
              {completions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No completions recorded yet.</div>
              ) : (
                completions.map(c => {
                  const mod = modules.find(m => m.id === (c.moduleId || c.module_id));
                  return (
                    <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/60 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{mod?.title || c.module_title || 'Training'}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.employee_name || c.completedBy || 'Employee'}
                          {c.completedAt && ` · ${new Date(c.completedAt).toLocaleDateString()}`}
                          {c.score != null && ` · Score: ${c.score}%`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import modal */}
      {showImport && (
        <TrainingImport
          onClose={() => setShowImport(false)}
          onGenerated={data => {
            setImportData(data);
            setShowImport(false);
            setShowBuilder(true);
          }}
        />
      )}

      {/* Assign modal */}
      {assigningModule && (
        <AssignModal
          module={assigningModule}
          onClose={() => setAssigningModule(null)}
          onSuccess={() => { setAssigningModule(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Employee View ────────────────────────────────────────────────────────────

function EmployeeAssignmentCard({ assignment, module, isComplete, onPlay }) {
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date() && !isComplete;
  const blocks = (() => {
    try { return JSON.parse(module?.content_blocks || '[]'); } catch { return []; }
  })();

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 space-y-3 transition-all',
        isComplete ? 'border-green-500/30 bg-green-500/5' : isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-border/30 bg-card/60'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          isComplete ? 'bg-green-500/20' : isOverdue ? 'bg-red-500/20' : 'bg-primary/15'
        )}>
          {isComplete
            ? <CheckCircle2 className="h-4 w-4 text-green-400" />
            : <BookOpen className={cn('h-4 w-4', isOverdue ? 'text-red-400' : 'text-primary')} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-foreground leading-snug">{module?.title || assignment.moduleName || 'Training'}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {module?.estimatedMinutes && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" /> {module.estimatedMinutes}m
              </span>
            )}
            {assignment.dueDate && !isComplete && (
              <span className={cn('text-[10px] font-semibold', isOverdue ? 'text-red-400' : 'text-muted-foreground')}>
                Due {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            )}
            {isComplete && <span className="text-[10px] text-green-400 font-semibold">Completed</span>}
          </div>
        </div>
      </div>

      {module && blocks.length > 0 && !isComplete && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{blocks.length} sections</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full w-0" />
          </div>
        </div>
      )}

      {!isComplete && module && (
        <button
          onClick={() => onPlay(module, assignment)}
          className="w-full btn-primary h-9 text-sm flex items-center justify-center gap-1.5"
        >
          <Play className="h-3.5 w-3.5" />
          {blocks.length === 0 ? 'View' : 'Start Training'}
        </button>
      )}
    </div>
  );
}

function EmployeeView({ modules, assignments, completions, user, onRefresh }) {
  const [playingModule, setPlayingModule] = useState(null);
  const [playingAssignment, setPlayingAssignment] = useState(null);

  const completedIds = new Set(
    completions
      .filter(c => c.completedBy === user?.email || c.employee_email === user?.email)
      .map(c => c.moduleId || c.module_id)
  );

  const myAssignments = assignments.filter(a =>
    a.assignee_email === user?.email || a.assigned_to_email === user?.email
  );
  const openAssignments = myAssignments.filter(a => !completedIds.has(a.moduleId || a.module_id));
  const doneAssignments = myAssignments.filter(a => completedIds.has(a.moduleId || a.module_id));
  const availableModules = modules.filter(m =>
    (m.status === 'published' || m.active) &&
    !myAssignments.find(a => (a.moduleId || a.module_id) === m.id)
  );

  if (playingModule) {
    return (
      <TrainingPlayer
        module={playingModule}
        assignment={playingAssignment}
        onClose={() => { setPlayingModule(null); setPlayingAssignment(null); }}
        onComplete={() => { setPlayingModule(null); setPlayingAssignment(null); onRefresh(); }}
      />
    );
  }

  return (
    <div className="app-screen">
      <div className="app-page-narrow space-y-6 pb-28">
        <div>
          <h1 className="text-lg font-black text-foreground">My Training</h1>
          <p className="text-sm text-muted-foreground">Your assignments and available modules</p>
        </div>

        {openAssignments.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Assigned to You</h2>
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black">{openAssignments.length}</span>
            </div>
            <div className="space-y-3">
              {openAssignments.map(a => {
                const mod = modules.find(m => m.id === (a.moduleId || a.module_id));
                return (
                  <EmployeeAssignmentCard
                    key={a.id}
                    assignment={a}
                    module={mod}
                    isComplete={false}
                    onPlay={(m, asgn) => { setPlayingModule(m); setPlayingAssignment(asgn); }}
                  />
                );
              })}
            </div>
          </section>
        )}

        {availableModules.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Available</h2>
            <div className="space-y-2">
              {availableModules.map(mod => {
                const done = completedIds.has(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => !done && setPlayingModule(mod)}
                    className="w-full flex items-center gap-3 rounded-2xl border border-border/30 bg-card/60 px-4 py-3 text-left hover:border-border/60 transition-all"
                  >
                    <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', done ? 'bg-green-500/20' : 'bg-muted')}>
                      {done ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <BookOpen className="h-4 w-4 text-muted-foreground" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-foreground truncate">{mod.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[mod.category] || mod.category}
                        {mod.estimatedMinutes ? ` · ${mod.estimatedMinutes} min` : ''}
                        {done ? ' · Completed' : ''}
                      </p>
                    </div>
                    {!done && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    {done && <span className="text-[10px] font-black text-green-400 shrink-0">Done</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {doneAssignments.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Completed</h2>
            <div className="space-y-2">
              {doneAssignments.map(a => {
                const mod = modules.find(m => m.id === (a.moduleId || a.module_id));
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{mod?.title || a.moduleName || 'Training'}</p>
                      <p className="text-xs text-green-400/80">Completed</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {openAssignments.length === 0 && availableModules.length === 0 && doneAssignments.length === 0 && (
          <div className="py-16 text-center space-y-4 px-6">
            <div className="h-16 w-16 rounded-full bg-muted/30 border border-border/40 flex items-center justify-center mx-auto">
              <BookOpen className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-base font-black text-foreground">No training assigned yet</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-[240px] mx-auto leading-relaxed">
                Your manager hasn't assigned any modules. Check back later or ask them to set up your training plan.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Training() {
  const { isAdmin, user } = useCurrentUser();
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadData();
    return () => { isMounted.current = false; };
  }, []);

  const loadData = async () => {
    try {
      const [modData, assData, compData, certData] = await Promise.all([
        base44.entities.TrainingModule.list('title', 200).catch(() => []),
        base44.entities.TrainingAssignment.list('-assignedAt', 200).catch(() => []),
        base44.entities.TrainingCompletion.list('-completedAt', 200).catch(() => []),
        base44.entities.CertificationRecord.list('-issueDate', 100).catch(() => []),
      ]);
      if (isMounted.current) {
        setModules(modData);
        setAssignments(assData);
        setCompletions(compData);
        setCertifications(certData);
        setLoading(false);
      }
    } catch (err) {
      console.error('Training load error:', err);
      if (isMounted.current) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <EmployeeView
        modules={modules}
        assignments={assignments}
        completions={completions}
        user={user}
        onRefresh={loadData}
      />
    );
  }

  return (
    <div className="flex h-screen bg-background lg:overflow-hidden pb-40 lg:pb-0">
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminView
          modules={modules}
          assignments={assignments}
          completions={completions}
          certifications={certifications}
          onRefresh={loadData}
        />
      </div>
    </div>
  );
}

export const hideBase44Index = true;

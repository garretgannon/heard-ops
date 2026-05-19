import { useState } from 'react';
import { X, Plus, Trash2, ChevronUp, ChevronDown, BookOpen, Star, ClipboardList, AlertTriangle, HelpCircle, CheckCircle2, Save, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BLOCK_TYPES = [
  { id: 'text', label: 'Text', description: 'Paragraph or section of information', icon: BookOpen, color: 'text-blue-400' },
  { id: 'step', label: 'Step', description: 'Numbered procedural step', icon: Star, color: 'text-purple-400' },
  { id: 'checklist', label: 'Checklist', description: 'Items employees check off', icon: ClipboardList, color: 'text-green-400' },
  { id: 'safety_warning', label: 'Safety Warning', description: 'Caution or critical notice', icon: AlertTriangle, color: 'text-amber-400' },
  { id: 'quiz_question', label: 'Quiz Question', description: 'Multiple choice knowledge check', icon: HelpCircle, color: 'text-orange-400' },
  { id: 'acknowledgement', label: 'Acknowledgement', description: 'Employee sign-off statement', icon: CheckCircle2, color: 'text-primary' },
];

const CATEGORIES = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'role_training', label: 'Role Training' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'food_safety', label: 'Food Safety' },
  { value: 'system_training', label: 'System Training' },
  { value: 'skill_development', label: 'Skill Development' },
  { value: 'certification', label: 'Certification' },
  { value: 'other', label: 'Other' },
];

const MODULE_TYPES = [
  { value: 'reading', label: 'Reading / SOP' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'video', label: 'Video + Notes' },
  { value: 'certification', label: 'Certification' },
  { value: 'learning_path', label: 'Learning Path' },
];

function makeId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeBlock(type) {
  return {
    id: makeId(),
    type,
    title: '',
    content: '',
    order: 0,
    required: true,
    items: type === 'checklist' ? [''] : [],
    options: type === 'quiz_question' ? ['', '', '', ''] : [],
    correctAnswer: 0,
  };
}

// ─── Block Editors ───────────────────────────────────────────────────────────

function TextEditor({ block, onChange }) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Section title (optional)"
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60"
      />
      <textarea
        placeholder="Content…"
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        rows={4}
        className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none"
      />
    </div>
  );
}

function StepEditor({ block, onChange }) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Step title"
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60"
      />
      <textarea
        placeholder="Step description…"
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none"
      />
    </div>
  );
}

function ChecklistEditor({ block, onChange }) {
  const items = block.items?.length ? block.items : [''];
  const updateItem = (i, val) => {
    const next = [...items];
    next[i] = val;
    onChange({ ...block, items: next });
  };
  const addItem = () => onChange({ ...block, items: [...items, ''] });
  const removeItem = i => onChange({ ...block, items: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Checklist title (optional)"
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60"
      />
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              placeholder={`Item ${i + 1}`}
              value={item}
              onChange={e => updateItem(i, e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border/40 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60"
            />
            {items.length > 1 && (
              <button onClick={() => removeItem(i)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={addItem} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
        <Plus className="h-3 w-3" /> Add item
      </button>
    </div>
  );
}

function SafetyEditor({ block, onChange }) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Warning title (optional)"
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-500/5 text-foreground text-sm focus:outline-none focus:border-amber-500/60"
      />
      <textarea
        placeholder="Safety notice or caution…"
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-500/5 text-foreground text-sm focus:outline-none focus:border-amber-500/60 resize-none"
      />
    </div>
  );
}

function QuizEditor({ block, onChange }) {
  const options = block.options?.length === 4 ? block.options : ['', '', '', ''];
  const updateOption = (i, val) => {
    const next = [...options];
    next[i] = val;
    onChange({ ...block, options: next });
  };

  return (
    <div className="space-y-3">
      <textarea
        placeholder="Question text…"
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none"
      />
      <div className="space-y-1.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Answer Choices</p>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2 items-center">
            <button
              onClick={() => onChange({ ...block, correctAnswer: i })}
              className={cn(
                'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                block.correctAnswer === i ? 'border-green-500 bg-green-500/20' : 'border-border/50'
              )}
            >
              {block.correctAnswer === i && <span className="w-2 h-2 rounded-full bg-green-500" />}
            </button>
            <input
              type="text"
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border/40 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60"
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">Tap the circle to mark the correct answer (green = correct).</p>
    </div>
  );
}

function AckEditor({ block, onChange }) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Acknowledgement title (optional)"
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60"
      />
      <textarea
        placeholder="Statement employees must acknowledge…"
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none"
      />
    </div>
  );
}

function BlockCard({ block, index, total, onChange, onDelete, onMove }) {
  const [expanded, setExpanded] = useState(true);
  const meta = BLOCK_TYPES.find(t => t.id === block.type);
  const Icon = meta?.icon || BookOpen;

  return (
    <div className="rounded-xl border border-border/30 bg-card/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <Icon className={cn('h-3.5 w-3.5 shrink-0', meta?.color)} />
        <span className="text-xs font-bold text-foreground/80 flex-1 truncate">
          {block.title || meta?.label || 'Block'}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0 mr-1">{index + 1}/{total}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={e => { e.stopPropagation(); onMove(-1); }} disabled={index === 0} className="p-1 hover:bg-muted rounded disabled:opacity-30 transition-all">
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={e => { e.stopPropagation(); onMove(1); }} disabled={index === total - 1} className="p-1 hover:bg-muted rounded disabled:opacity-30 transition-all">
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 hover:bg-destructive/10 text-destructive rounded transition-all">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border/20 pt-3 space-y-3">
          {block.type === 'text' && <TextEditor block={block} onChange={onChange} />}
          {block.type === 'step' && <StepEditor block={block} onChange={onChange} />}
          {block.type === 'checklist' && <ChecklistEditor block={block} onChange={onChange} />}
          {block.type === 'safety_warning' && <SafetyEditor block={block} onChange={onChange} />}
          {block.type === 'quiz_question' && <QuizEditor block={block} onChange={onChange} />}
          {block.type === 'acknowledgement' && <AckEditor block={block} onChange={onChange} />}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={block.required}
              onChange={e => onChange({ ...block, required: e.target.checked })}
              className="rounded w-3.5 h-3.5"
            />
            Required to advance
          </label>
        </div>
      )}
    </div>
  );
}

function BlockTypePicker({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card rounded-t-2xl border-t border-border/30 p-4 pb-8 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Add Block</p>
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_TYPES.map(bt => {
            const Icon = bt.icon;
            return (
              <button
                key={bt.id}
                onClick={() => { onSelect(bt.id); onClose(); }}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-border/40 bg-background/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
              >
                <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', bt.color)} />
                <div>
                  <p className="text-xs font-bold text-foreground">{bt.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{bt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS = ['Info', 'Content', 'Settings'];

function StepInfo({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Title *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={e => onChange({ ...form, title: e.target.value })}
          placeholder="e.g., Knife Safety & Handling"
          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:border-primary/60"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Description</label>
        <textarea
          value={form.description}
          onChange={e => onChange({ ...form, description: e.target.value })}
          placeholder="What will employees learn?"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Category</label>
          <select
            value={form.category}
            onChange={e => onChange({ ...form, category: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:border-primary/60"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Type</label>
          <select
            value={form.moduleType}
            onChange={e => onChange({ ...form, moduleType: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:border-primary/60"
          >
            {MODULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Duration (minutes)</label>
        <input
          type="number"
          min="1"
          value={form.estimatedMinutes}
          onChange={e => onChange({ ...form, estimatedMinutes: parseInt(e.target.value) || 15 })}
          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:border-primary/60"
        />
      </div>
    </div>
  );
}

function StepContent({ blocks, setBlocks }) {
  const [showPicker, setShowPicker] = useState(false);

  const addBlock = (type) => {
    const b = makeBlock(type);
    b.order = blocks.length;
    setBlocks(prev => [...prev, b]);
  };

  const updateBlock = (id, updated) => {
    setBlocks(prev => prev.map(b => b.id === id ? updated : b));
  };

  const deleteBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (id, dir) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx + dir < 0 || idx + dir >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return next.map((b, i) => ({ ...b, order: i }));
    });
  };

  return (
    <div className="space-y-3">
      {blocks.length === 0 ? (
        <div className="py-10 text-center space-y-3">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No content blocks yet.</p>
          <button onClick={() => setShowPicker(true)} className="btn-primary px-5 py-2 text-xs">
            Add First Block
          </button>
        </div>
      ) : (
        <>
          {blocks.map((block, i) => (
            <BlockCard
              key={block.id}
              block={block}
              index={i}
              total={blocks.length}
              onChange={updated => updateBlock(block.id, updated)}
              onDelete={() => deleteBlock(block.id)}
              onMove={dir => moveBlock(block.id, dir)}
            />
          ))}
          <button
            onClick={() => setShowPicker(true)}
            className="w-full h-10 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary flex items-center justify-center gap-1.5 text-xs font-semibold transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Add Block
          </button>
        </>
      )}
      {showPicker && <BlockTypePicker onSelect={addBlock} onClose={() => setShowPicker(false)} />}
    </div>
  );
}

function StepSettings({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/30 bg-card/40 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">Required Training</p>
            <p className="text-xs text-muted-foreground">Employees must complete this module</p>
          </div>
          <button
            onClick={() => onChange({ ...form, required: !form.required })}
            className={cn(
              'w-10 h-6 rounded-full border transition-all relative',
              form.required ? 'bg-primary border-primary' : 'bg-muted border-border/50'
            )}
          >
            <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all', form.required ? 'left-4.5 translate-x-0' : 'left-0.5')} style={{ left: form.required ? 'calc(100% - 22px)' : '2px' }} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">Active</p>
            <p className="text-xs text-muted-foreground">Module visible to employees</p>
          </div>
          <button
            onClick={() => onChange({ ...form, active: !form.active })}
            className={cn(
              'w-10 h-6 rounded-full border transition-all relative',
              form.active ? 'bg-primary border-primary' : 'bg-muted border-border/50'
            )}
          >
            <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all')} style={{ left: form.active ? 'calc(100% - 22px)' : '2px' }} />
          </button>
        </div>
      </div>

      {(form.moduleType === 'quiz' || form.moduleType === 'certification') && (
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Passing Score (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.passingScore || 80}
            onChange={e => onChange({ ...form, passingScore: parseInt(e.target.value) })}
            className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:border-primary/60"
          />
        </div>
      )}

      <div className="rounded-xl border border-border/30 bg-card/40 p-4 space-y-2">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Summary</p>
        <p className="text-sm font-bold text-foreground">{form.title || '(Untitled)'}</p>
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">{form.category}</span>
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">{form.moduleType}</span>
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">{form.estimatedMinutes} min</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrainingBuilder({ module: editModule, initialData, onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState(() => {
    if (initialData?.blocks) return initialData.blocks;
    if (editModule?.content_blocks) {
      try { return JSON.parse(editModule.content_blocks); } catch {}
    }
    return [];
  });
  const [form, setForm] = useState(() => ({
    title: '',
    description: '',
    category: 'onboarding',
    moduleType: 'reading',
    estimatedMinutes: 15,
    required: false,
    active: true,
    passingScore: 80,
    status: 'draft',
    ...editModule,
    ...initialData,
  }));

  const handleSave = async (publish = false) => {
    if (!form.title.trim()) { toast.error('Add a title first.'); setStep(0); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        status: publish ? 'published' : 'draft',
        content_blocks: JSON.stringify(blocks.map((b, i) => ({ ...b, order: i }))),
        active: publish ? true : form.active,
      };
      if (editModule?.id) {
        await base44.entities.TrainingModule.update(editModule.id, payload);
        toast.success(publish ? 'Module published' : 'Draft saved');
      } else {
        await base44.entities.TrainingModule.create(payload);
        toast.success(publish ? 'Module published' : 'Saved as draft');
      }
      onSuccess?.();
    } catch (err) {
      toast.error('Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/30 flex items-center gap-3">
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-all">
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-foreground">{editModule ? 'Edit Module' : 'New Training Module'}</h1>
          <div className="flex items-center gap-1.5 mt-1">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={cn(
                  'text-[10px] font-bold transition-colors',
                  i === step ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="h-8 px-3 rounded-lg border border-border/50 bg-card/60 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !form.title.trim()}
            className="btn-primary h-8 px-3 text-xs flex items-center gap-1 disabled:opacity-40"
          >
            <Eye className="h-3.5 w-3.5" /> Publish
          </button>
        </div>
      </div>

      {/* Step progress bar */}
      <div className="h-0.5 bg-muted shrink-0">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl w-full mx-auto px-4 py-5">
          {step === 0 && <StepInfo form={form} onChange={setForm} />}
          {step === 1 && <StepContent blocks={blocks} setBlocks={setBlocks} />}
          {step === 2 && <StepSettings form={form} onChange={setForm} />}
        </div>
      </div>

      {/* Footer nav */}
      <div className="shrink-0 px-4 py-4 border-t border-border/30 flex gap-2 max-w-xl w-full mx-auto">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="h-11 px-4 rounded-xl border border-border/40 bg-card/60 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => {
              if (step === 0 && !form.title.trim()) { toast.error('Add a title to continue.'); return; }
              setStep(s => s + 1);
            }}
            className="flex-1 btn-primary h-11 text-sm"
          >
            Next: {STEPS[step + 1]}
          </button>
        ) : (
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !form.title.trim()}
            className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm disabled:opacity-40 transition-all"
          >
            {saving ? 'Publishing…' : 'Publish Module'}
          </button>
        )}
      </div>
    </div>
  );
}

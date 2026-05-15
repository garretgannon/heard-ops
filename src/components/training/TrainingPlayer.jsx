import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, BookOpen, ClipboardList, HelpCircle, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function parseBlocks(module) {
  try {
    if (module.content_blocks) return JSON.parse(module.content_blocks);
  } catch {}
  if (module.instructions) {
    return [{ id: 'intro', type: 'text', title: '', content: module.instructions, order: 0, required: true }];
  }
  return [];
}

function BlockIcon({ type }) {
  const icons = {
    text: BookOpen,
    step: Star,
    checklist: ClipboardList,
    safety_warning: AlertTriangle,
    quiz_question: HelpCircle,
    acknowledgement: CheckCircle2,
  };
  const Icon = icons[type] || BookOpen;
  return <Icon className="h-4 w-4" />;
}

function TextBlock({ block }) {
  return (
    <div className="space-y-3">
      {block.title && <h3 className="text-base font-bold text-foreground">{block.title}</h3>}
      <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{block.content}</p>
    </div>
  );
}

function StepBlock({ block, index }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-black shrink-0">
          {index + 1}
        </span>
        <h3 className="text-base font-bold text-foreground">{block.title || `Step ${index + 1}`}</h3>
      </div>
      <p className="text-sm text-foreground/85 leading-relaxed pl-11 whitespace-pre-wrap">{block.content}</p>
    </div>
  );
}

function SafetyBlock({ block }) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
      <div className="flex items-center gap-2 text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="text-xs font-black uppercase tracking-wider">Safety Note</span>
      </div>
      {block.title && <h3 className="text-sm font-bold text-foreground">{block.title}</h3>}
      <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{block.content}</p>
    </div>
  );
}

function ChecklistBlock({ block, checked, onToggle }) {
  const items = Array.isArray(block.items) ? block.items : (block.content || '').split('\n').filter(Boolean);
  return (
    <div className="space-y-3">
      {block.title && <h3 className="text-base font-bold text-foreground">{block.title}</h3>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className="w-full flex items-start gap-3 text-left group"
          >
            <span className={cn(
              'mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all',
              checked[i] ? 'bg-primary border-primary' : 'border-border/60 bg-card group-hover:border-primary/40'
            )}>
              {checked[i] && <CheckCircle2 className="h-3 w-3 text-white" />}
            </span>
            <span className={cn('text-sm leading-relaxed', checked[i] ? 'line-through text-muted-foreground' : 'text-foreground/85')}>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuizBlock({ block, answer, onAnswer }) {
  const options = Array.isArray(block.options) ? block.options : [];
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Knowledge Check</p>
          <h3 className="text-sm font-bold text-foreground leading-snug">{block.content || block.title}</h3>
        </div>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isSelected = answer === i;
          const isCorrect = block.correctAnswer === i;
          const showResult = answer !== null && answer !== undefined;
          return (
            <button
              key={i}
              onClick={() => answer === null || answer === undefined ? onAnswer(i) : null}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all',
                showResult
                  ? isCorrect
                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                    : isSelected
                      ? 'border-red-500/50 bg-red-500/10 text-red-400'
                      : 'border-border/30 bg-card/40 text-muted-foreground'
                  : isSelected
                    ? 'border-primary/60 bg-primary/10 text-foreground'
                    : 'border-border/40 bg-card/60 text-foreground/80 hover:border-primary/30 hover:bg-primary/5'
              )}
            >
              <span className="font-black text-xs mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      {answer !== null && answer !== undefined && (
        <p className={cn('text-xs font-semibold', answer === block.correctAnswer ? 'text-green-400' : 'text-amber-400')}>
          {answer === block.correctAnswer ? '✓ Correct! Keep going.' : 'Not quite — review the answer and continue.'}
        </p>
      )}
    </div>
  );
}

function AckBlock({ block, acknowledged, onAck }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/40 bg-card/60 p-4">
        {block.title && <h3 className="text-base font-bold text-foreground mb-2">{block.title}</h3>}
        <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{block.content}</p>
      </div>
      <button
        onClick={onAck}
        className={cn(
          'w-full py-3 rounded-xl font-bold text-sm transition-all border',
          acknowledged
            ? 'bg-green-500/20 border-green-500/40 text-green-400'
            : 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 active:scale-98'
        )}
      >
        {acknowledged ? '✓ Acknowledged' : 'I Acknowledge & Understand'}
      </button>
    </div>
  );
}

export default function TrainingPlayer({ module, assignment, onClose, onComplete }) {
  const { user } = useCurrentUser();
  const blocks = parseBlocks(module);
  const [current, setCurrent] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [checklistState, setChecklistState] = useState({});
  const [ackState, setAckState] = useState({});
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(false);

  if (blocks.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">This module has no content blocks yet.</p>
        <button onClick={onClose} className="btn-primary px-6 py-2 text-sm">Close</button>
      </div>
    );
  }

  const block = blocks[current];
  const total = blocks.length;
  const progress = Math.round(((current) / total) * 100);

  const canAdvance = () => {
    if (!block.required) return true;
    if (block.type === 'quiz_question') return quizAnswers[block.id] !== undefined;
    if (block.type === 'acknowledgement') return ackState[block.id];
    if (block.type === 'checklist') {
      const items = Array.isArray(block.items) ? block.items : (block.content || '').split('\n').filter(Boolean);
      const checked = checklistState[block.id] || [];
      return items.every((_, i) => checked[i]);
    }
    return true;
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await base44.entities.TrainingCompletion.create({
        moduleId: module.id,
        module_id: module.id,
        module_title: module.title,
        completedBy: user?.email,
        employee_email: user?.email,
        employee_name: user?.name || user?.email,
        completedAt: new Date().toISOString(),
        score: Object.keys(quizAnswers).length > 0
          ? Math.round(
              (Object.entries(quizAnswers).filter(([id, ans]) => {
                const b = blocks.find(bl => bl.id === id);
                return b?.correctAnswer === ans;
              }).length / Object.keys(quizAnswers).length) * 100
            )
          : 100,
        assignment_id: assignment?.id,
      });
      if (assignment?.id) {
        await base44.entities.TrainingAssignment.update(assignment.id, { status: 'complete' }).catch(() => {});
      }
      toast.success('Training completed!');
      setDone(true);
      onComplete?.();
    } catch (err) {
      toast.error('Failed to record completion');
    } finally {
      setCompleting(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground">{module.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">Training complete. Great work!</p>
        </div>
        <button onClick={onClose} className="btn-primary px-8 py-2.5 text-sm">Done</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 px-4 py-3 border-b border-border/30 flex items-center gap-3">
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-all">
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate text-foreground/80">{module.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">{current + 1}/{total}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground">
          <BlockIcon type={block.type} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-xl w-full mx-auto">
        {block.type === 'text' && <TextBlock block={block} />}
        {block.type === 'step' && <StepBlock block={block} index={current} />}
        {block.type === 'safety_warning' && <SafetyBlock block={block} />}
        {block.type === 'checklist' && (
          <ChecklistBlock
            block={block}
            checked={checklistState[block.id] || []}
            onToggle={i => {
              const cur = checklistState[block.id] || [];
              const next = [...cur];
              next[i] = !next[i];
              setChecklistState(s => ({ ...s, [block.id]: next }));
            }}
          />
        )}
        {block.type === 'quiz_question' && (
          <QuizBlock
            block={block}
            answer={quizAnswers[block.id] ?? null}
            onAnswer={ans => setQuizAnswers(s => ({ ...s, [block.id]: ans }))}
          />
        )}
        {block.type === 'acknowledgement' && (
          <AckBlock
            block={block}
            acknowledged={!!ackState[block.id]}
            onAck={() => setAckState(s => ({ ...s, [block.id]: true }))}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="shrink-0 px-4 py-4 border-t border-border/30 flex gap-2 max-w-xl w-full mx-auto">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="h-11 px-4 rounded-xl border border-border/40 bg-card/60 text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1 text-sm font-semibold transition-all"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {current < total - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            disabled={!canAdvance()}
            className="flex-1 btn-primary h-11 text-sm flex items-center justify-center gap-1 disabled:opacity-40"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={!canAdvance() || completing}
            className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all"
          >
            <CheckCircle2 className="h-4 w-4" />
            {completing ? 'Saving…' : 'Complete Training'}
          </button>
        )}
      </div>
    </div>
  );
}

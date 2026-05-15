import { useState } from 'react';
import { X, Wand2, FileText, AlertCircle } from 'lucide-react';
import { generateTrainingFromText } from '@/utils/trainingAI';

export default function TrainingImport({ onClose, onGenerated }) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!text.trim()) { setError('Paste some content first.'); return; }
    setGenerating(true);
    setError('');
    try {
      const result = await generateTrainingFromText(text, { title: title || undefined });
      onGenerated(result);
    } catch (err) {
      setError('Failed to generate training content.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div className="bg-card w-full max-h-[90vh] lg:max-w-xl rounded-t-2xl lg:rounded-2xl border border-border/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Import Training Content</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Paste any text — an SOP, recipe steps, equipment notes — and it'll be converted into a draft training module.
          </p>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Module Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Auto-generated from content if blank"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:border-primary/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-foreground/80">Content to Import *</label>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setError(''); }}
              placeholder={`Paste SOP, recipe steps, equipment manual, safety guidelines...\n\nEach line becomes a training block.`}
              rows={10}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none font-mono"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/30 flex gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !text.trim()}
            className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {generating ? 'Generating…' : 'Generate Module'}
          </button>
        </div>
      </div>
    </div>
  );
}

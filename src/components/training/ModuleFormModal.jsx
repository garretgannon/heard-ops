import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function ModuleFormModal({ module, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'onboarding',
    moduleType: 'video',
    estimatedMinutes: 30,
    contentUrl: '',
    instructions: '',
    passingScore: 80,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (module) {
      setForm(module);
    }
  }, [module]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (module?.id) {
        await base44.entities.TrainingModule.update(module.id, form);
        toast.success('Module updated');
      } else {
        await base44.entities.TrainingModule.create(form);
        toast.success('Module created');
      }
      onSuccess();
    } catch (err) {
      toast.error('Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end lg:items-center justify-center">
      <div className="bg-card w-full max-h-[90vh] lg:max-h-[95vh] lg:max-w-2xl rounded-t-2xl lg:rounded-xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border/30 bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-bold">{module ? 'Edit Module' : 'Create Module'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              placeholder="e.g., Food Safety Certification"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm min-h-20"
              placeholder="What is this training about?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                <option value="onboarding">Onboarding</option>
                <option value="role_training">Role Training</option>
                <option value="compliance">Compliance</option>
                <option value="food_safety">Food Safety</option>
                <option value="system_training">System Training</option>
                <option value="skill_development">Skill Development</option>
                <option value="certification">Certification</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Module Type</label>
              <select
                value={form.moduleType}
                onChange={(e) => setForm({ ...form, moduleType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                <option value="video">Video</option>
                <option value="checklist">Checklist</option>
                <option value="reading">Reading</option>
                <option value="quiz">Quiz</option>
                <option value="certification">Certification</option>
                <option value="learning_path">Learning Path</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Estimated Duration (minutes)</label>
            <input
              type="number"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Content URL</label>
            <input
              type="url"
              value={form.contentUrl}
              onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Instructions / Learning Objectives</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm min-h-20"
              placeholder="What should participants know or be able to do?"
            />
          </div>

          {(form.moduleType === 'quiz' || form.moduleType === 'certification') && (
            <div>
              <label className="block text-sm font-semibold mb-2">Passing Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.passingScore}
                onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="active" className="text-sm font-semibold">Active</label>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 border-t border-border/30 bg-card/95 backdrop-blur-sm flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Module'}
          </button>
        </div>
      </div>
    </div>
  );
}
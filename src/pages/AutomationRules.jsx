import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Power, Search } from 'lucide-react';
import AutomationTemplateBuilder from '@/components/automation/AutomationTemplateBuilder';
import DesktopPageHeader from '@/components/DesktopPageHeader';

export default function AutomationRules() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.AutomationTemplate.list();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
    setLoading(false);
  };

  const filtered = templates.filter(t =>
    t.template_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleActive = async (template) => {
    try {
      await base44.entities.AutomationTemplate.update(template.id, {
        is_active: !template.is_active,
      });
      await loadTemplates();
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this automation template?')) {
      try {
        await base44.entities.AutomationTemplate.delete(id);
        await loadTemplates();
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowBuilder(true);
  };

  const handleClose = async () => {
    setShowBuilder(false);
    setEditingTemplate(null);
    await loadTemplates();
  };

  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Automation Rules"
        subtitle="Create templates to auto-generate operational tasks"
        actions={
          <button onClick={() => { setEditingTemplate(null); setShowBuilder(true); }} className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Create Template
          </button>
        }
      />
      {/* Header */}
      <div className="lg:hidden sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/30 px-6 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Automation Rules</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Create templates to auto-generate operational tasks</p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 card-glass border border-border/40 rounded-2xl text-xs text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            onClick={() => { setEditingTemplate(null); setShowBuilder(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-2xl font-bold text-xs hover:brightness-110 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Template
          </button>
        </div>
      </div>

      {/* Template List */}
      <div className="app-page">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading templates...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {templates.length === 0 ? 'No templates yet. Create your first automation.' : 'No matching templates.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(template => (
            <div
              key={template.id}
              className="card-glass border border-border/40 rounded-2xl p-4 flex items-center justify-between group hover:border-border/60 transition-all"
            >
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">{template.template_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${template.category === 'temperature_check' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'}`}>
                    {template.category}
                  </span>
                  {template.applies_to_role?.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">Roles: {template.applies_to_role.join(', ')}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => handleToggleActive(template)}
                  className={`p-2 rounded-2xl transition-all ${template.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 hover:bg-muted rounded-2xl transition-all"
                >
                  <Edit2 className="h-4 w-4 text-secondary-text" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 hover:bg-muted rounded-2xl transition-all"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-card rounded-2xl overflow-hidden my-8">
            <AutomationTemplateBuilder
              template={editingTemplate}
              onClose={handleClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;
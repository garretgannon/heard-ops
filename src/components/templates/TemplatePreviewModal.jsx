import { X } from 'lucide-react';

const TEMPLATE_TYPES = [
  { id: 'prep', label: 'Prep' },
  { id: 'sidework', label: 'Side Work' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'temperature', label: 'Temperature Log' },
  { id: 'waste_86', label: 'Waste / 86' },
  { id: 'opening', label: 'Opening' },
  { id: 'closing', label: 'Closing' },
  { id: 'handoff', label: 'Handoff' },
  { id: 'beo_event', label: 'BEO / Event' },
  { id: 'custom', label: 'Custom' },
];

const DESTINATION_MAP = {
  prep: { page: 'Today', section: 'Prep Tab', description: 'Appears in prep list view and can be launched from Today command center' },
  sidework: { page: 'Today / Tasks', section: 'Side Work Tab', description: 'Assigned to FOH staff in side work section' },
  cleaning: { page: 'Logs', section: 'Cleaning Logs', description: 'Creates cleaning log entries, viewable in Logs center' },
  temperature: { page: 'Logs', section: 'Temperature Checks', description: 'Auto-generates recurring temperature check tasks and logs' },
  waste_86: { page: 'Logs', section: 'Waste & 86 Log', description: 'Creates waste/loss entries, reviewed in Logs center' },
  opening: { page: 'Shift', section: 'Opening Checklist', description: 'Appears in shift launch sequence, visible to opening shift staff' },
  closing: { page: 'Shift', section: 'Closing Checklist', description: 'Appears in shift close sequence, visible to closing shift staff' },
  handoff: { page: 'Shift / Logs', section: 'Shift Handoff', description: 'Creates handoff prompts and logs for shift transitions' },
  beo_event: { page: 'Planning', section: 'Event Tasks', description: 'Generates event-specific prep and setup tasks' },
  custom: { page: 'Dashboard', section: 'Custom', description: 'Custom template for specialized workflows' },
};

export default function TemplatePreviewModal({ template, onClose }) {
  const destination = DESTINATION_MAP[template.template_type] || {};
  const typeLabel = TEMPLATE_TYPES.find(t => t.id === template.template_type)?.label || 'Unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full lg:w-full lg:max-w-md bg-card border-t lg:border border-border rounded-t-2xl lg:rounded-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold text-foreground">Template Preview</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-all"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Template Summary */}
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">Template Name</p>
              <p className="font-bold text-foreground mt-0.5">{template.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">Type</p>
              <p className="font-bold text-foreground mt-0.5">{typeLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">Status</p>
              <p className="font-bold text-foreground mt-0.5">{template.is_active ? '✓ Active' : 'Draft'}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            {/* Assigned To */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-bold uppercase">Assigned To</p>
              <div className="space-y-1 text-sm">
                {template.assigned_role && <p className="text-foreground">👤 Role: <span className="font-bold">{template.assigned_role}</span></p>}
                {template.assigned_employee && <p className="text-foreground">📧 Employee: <span className="font-bold">{template.assigned_employee}</span></p>}
                {template.assigned_station && <p className="text-foreground">📍 Station: <span className="font-bold">{template.assigned_station}</span></p>}
                {!template.assigned_role && !template.assigned_employee && !template.assigned_station && (
                  <p className="text-red-400 text-xs">⚠️ Not assigned to any role or station</p>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-bold uppercase">Schedule</p>
              <div className="space-y-1 text-sm">
                <p className="text-foreground">📅 Recurrence: <span className="font-bold capitalize">{template.recurrence_type || 'On Demand'}</span></p>
                {template.due_time && <p className="text-foreground">⏰ Due Time: <span className="font-bold">{template.due_time}</span></p>}
                {template.shift && template.shift !== 'any' && <p className="text-foreground">🕐 Shift: <span className="font-bold capitalize">{template.shift}</span></p>}
              </div>
            </div>

            {/* Where It Appears */}
            <div className="space-y-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-xs text-muted-foreground font-bold uppercase">Where It Appears</p>
              <div className="space-y-1 text-sm">
                <p className="text-foreground">📄 Page: <span className="font-bold">{destination.page}</span></p>
                <p className="text-foreground">📋 Section: <span className="font-bold">{destination.section}</span></p>
                <p className="text-xs text-muted-foreground mt-2">{destination.description}</p>
              </div>
            </div>

            {/* Requirements */}
            {(template.photo_required || template.manager_review_required) && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-bold uppercase">Requirements</p>
                <div className="space-y-1 text-sm">
                  {template.photo_required && <p className="text-blue-400">📸 Photo Required</p>}
                  {template.manager_review_required && <p className="text-purple-400">✓ Manager Review Required</p>}
                </div>
              </div>
            )}

            {/* Temperature Specific */}
            {template.template_type === 'temperature' && (
              <div className="space-y-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <p className="text-xs text-cyan-400 font-bold uppercase">Temperature Monitoring</p>
                <div className="space-y-1 text-sm text-foreground">
                  {template.temp_category && <p>📦 Category: <span className="font-bold capitalize">{template.temp_category.replace('_', ' ')}</span></p>}
                  {template.temp_min !== undefined && template.temp_max !== undefined && (
                    <p>🌡️ Range: <span className="font-bold">{template.temp_min}°F - {template.temp_max}°F</span></p>
                  )}
                  {template.temp_check_frequency_minutes && (
                    <p>⏱️ Check Every: <span className="font-bold">{template.temp_check_frequency_minutes} min</span></p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {template.description && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-bold uppercase">Instructions</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.description}</p>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
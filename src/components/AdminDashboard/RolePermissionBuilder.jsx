import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, Save, RotateCcw } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const MODULES = [
  { id: 'today', label: 'Today' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'logs', label: 'Logs' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'more', label: 'More' },
  { id: 'prep', label: 'Prep Lists' },
  { id: 'sidework', label: 'Sidework' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'build_cards', label: 'Build Cards' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'sops', label: 'SOPs' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'reservations', label: 'Reservations & BEOs' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'food_safety', label: 'Food Safety' },
  { id: 'handoff', label: 'Shift Handoff' },
  { id: 'team', label: 'Team Directory' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'reports', label: 'Reports' },
];

const PERMISSION_LEVELS = [
  { value: 'hidden', label: 'Hidden', color: 'text-slate-400' },
  { value: 'view', label: 'View', color: 'text-blue-400' },
  { value: 'contribute', label: 'Contribute', color: 'text-amber-400' },
  { value: 'manage', label: 'Manage', color: 'text-green-400' },
  { value: 'admin', label: 'Admin', color: 'text-primary' },
];

const QUICK_ACTIONS = [
  'manager_log', 'add_task', 'temp_log', 'prep_command', 'issue',
  'sidework', 'specials', 'station_notes', 'guest_notes', 'review_handoff',
];

export default function RolePermissionBuilder({ jobCode, jobCodes, mode = 'permissions' }) {
  const [expanded, setExpanded] = useState({});
  const [permissions, setPermissions] = useState({});
  const [selectedJobCode, setSelectedJobCode] = useState(jobCode?.id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        // Load role definition from settings or create default
        const stored = await base44.entities.Settings.filter({ key: `role_permissions_${jobCode.id}` });
        if (stored.length > 0) {
          setPermissions(JSON.parse(stored[0].value || '{}'));
        } else {
          // Initialize with defaults
          const defaults = {};
          MODULES.forEach(m => {
            defaults[m.id] = jobCode.id === 'manager' ? 'manage' : 'view';
          });
          setPermissions(defaults);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadPermissions();
  }, [jobCode?.id]);

  const handlePermissionChange = (moduleId, level) => {
    haptics.light?.();
    setPermissions(prev => ({
      ...prev,
      [moduleId]: level,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    haptics.medium?.();
    try {
      // Find or create settings record
      const existing = await base44.entities.Settings.filter({ key: `role_permissions_${jobCode.id}` });
      const data = { key: `role_permissions_${jobCode.id}`, value: JSON.stringify(permissions) };
      
      if (existing.length > 0) {
        await base44.entities.Settings.update(existing[0].id, data);
      } else {
        await base44.entities.Settings.create(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const currentJobCode = jobCodes.find(j => j.id === selectedJobCode) || jobCode;

  if (mode === 'dashboard') {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-bold text-foreground mb-4">Dashboard Widgets</h3>
          <p className="text-sm text-muted-foreground">Configure which widgets appear on {currentJobCode?.name}'s Today page.</p>
          <div className="mt-4 p-4 bg-muted/40 border border-border rounded-lg text-center text-sm text-secondary-text">
            Dashboard builder coming soon...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Job Code Selector */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="text-xs font-bold text-secondary-text uppercase block mb-2">Select Job Code</label>
        <select
          value={selectedJobCode}
          onChange={e => setSelectedJobCode(e.target.value)}
          className="w-full p-2.5 rounded-lg bg-muted border border-border text-foreground font-semibold"
        >
          {jobCodes.filter(j => j.isActive).map(jc => (
            <option key={jc.id} value={jc.id}>{jc.name}</option>
          ))}
        </select>
      </div>

      {/* Permission Grid */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase text-secondary-text">Module Access Levels</h3>
        <div className="grid grid-cols-1 gap-2">
          {MODULES.map(module => (
            <div key={module.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
              <div
                onClick={() => setExpanded(prev => ({ ...prev, [module.id]: !prev[module.id] }))}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="font-semibold text-foreground text-sm">{module.label}</span>
                <ChevronDown
                  className={`h-4 w-4 text-secondary-text transition-transform ${expanded[module.id] ? 'rotate-180' : ''}`}
                />
              </div>

              {expanded[module.id] && (
                <div className="grid grid-cols-5 gap-1 pt-2 border-t border-border/50">
                  {PERMISSION_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => handlePermissionChange(module.id, level.value)}
                      className={cn(
                        'py-2 rounded text-[10px] font-bold transition-all active:scale-95',
                        permissions[module.id] === level.value
                          ? 'bg-primary/20 border border-primary'
                          : 'bg-muted border border-border/50 text-muted-foreground'
                      )}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 bg-card border-t border-border p-4 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>
    </div>
  );
}
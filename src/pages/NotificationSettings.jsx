import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Bell, Save, ChevronDown, Mail, Smartphone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ALERT_TYPES = {
  'Prep & Quality': [
    { key: 'missed_prep', label: 'Missed Prep', description: 'Prep item not completed on time' },
    { key: 'failed_temp_log', label: 'Failed Temperature Log', description: 'Temperature reading outside safe range' },
    { key: 'rejected_photo', label: 'Rejected Photo', description: 'Submitted photo failed quality check' },
  ],
  'Side Work & Tasks': [
    { key: 'missed_side_work', label: 'Missed Side Work', description: 'Side work task not completed' },
  ],
  'Maintenance & Incidents': [
    { key: 'urgent_maintenance', label: 'Urgent Maintenance Request', description: 'New urgent maintenance request submitted' },
    { key: 'incident_submitted', label: 'Incident Submitted', description: 'New incident report filed' },
  ],
  'Cash & Operations': [
    { key: 'cash_variance', label: 'Cash Variance', description: 'Drawer count variance detected' },
    { key: 'shift_handoff', label: 'Shift Handoff Created', description: 'New shift handoff notes added' },
  ],
};

export default function NotificationSettings() {
  const { isAdmin } = useCurrentUser();
  const [alerts, setAlerts] = useState({});
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('06:00');
  const [urgencyThreshold, setUrgencyThreshold] = useState('medium');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const dbSettings = await base44.entities.NotificationSettings.list();
        const loaded = {};
        
        Object.keys(ALERT_TYPES).forEach(group => {
          ALERT_TYPES[group].forEach(alert => {
            const dbAlert = dbSettings.find(s => s.key === alert.key);
            loaded[alert.key] = {
              email: true,
              push: true,
              inApp: true,
              ...JSON.parse(dbAlert?.value || '{}'),
            };
          });
        });

        const quietSettings = dbSettings.find(s => s.key === 'quiet_hours');
        if (quietSettings) {
          const { enabled, start, end } = JSON.parse(quietSettings.value);
          setQuietHoursEnabled(enabled);
          setQuietStart(start);
          setQuietEnd(end);
        }

        const urgency = dbSettings.find(s => s.key === 'urgency_threshold');
        if (urgency) setUrgencyThreshold(urgency.value);

        setAlerts(loaded);
      } catch (e) {
        console.error('Error loading settings:', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const toCreate = [];
      
      Object.entries(alerts).forEach(([key, value]) => {
        toCreate.push({ key, value: JSON.stringify(value) });
      });

      toCreate.push({
        key: 'quiet_hours',
        value: JSON.stringify({ enabled: quietHoursEnabled, start: quietStart, end: quietEnd }),
      });

      toCreate.push({
        key: 'urgency_threshold',
        value: urgencyThreshold,
      });

      const existing = await base44.entities.NotificationSettings.list();
      const keysToDelete = new Set(toCreate.map(t => t.key));
      
      for (const setting of existing) {
        if (keysToDelete.has(setting.key)) {
          await base44.entities.NotificationSettings.delete(setting.id);
        }
      }

      await base44.entities.NotificationSettings.bulkCreate(toCreate);
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Error saving settings');
    }
    setSaving(false);
  };

  const toggleChannel = (alertKey, channel) => {
    setAlerts(prev => ({
      ...prev,
      [alertKey]: {
        ...prev[alertKey],
        [channel]: !prev[alertKey]?.[channel],
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bell className="h-7 w-7 text-primary" /> Notification Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Managers control what alerts matter.</p>
      </div>

      {/* Alerts by Module */}
      <div className="space-y-4">
        {Object.entries(ALERT_TYPES).map(([group, groupAlerts]) => (
          <div key={group} className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-sm">{group}</h2>
            <div className="space-y-2">
              {groupAlerts.map(alert => (
                <div key={alert.key} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.label}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleChannel(alert.key, 'email')}
                      title="Email"
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        alerts[alert.key]?.email
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      )}
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleChannel(alert.key, 'push')}
                      title="Push"
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        alerts[alert.key]?.push
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      )}
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleChannel(alert.key, 'inApp')}
                      title="In-App"
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        alerts[alert.key]?.inApp
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quiet Hours & Urgency */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <h2 className="font-semibold text-sm">Quick Settings</h2>

        {/* Quiet Hours */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Quiet Hours</Label>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
            />
          </div>
          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-3 ml-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start</Label>
                <Input
                  type="time"
                  value={quietStart}
                  onChange={e => setQuietStart(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End</Label>
                <Input
                  type="time"
                  value={quietEnd}
                  onChange={e => setQuietEnd(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Suspend non-critical alerts during these hours.</p>
        </div>

        {/* Urgency Threshold */}
        <div className="border-t border-border pt-3 space-y-2">
          <Label className="text-sm font-medium">Alert if Urgency is</Label>
          <select
            value={urgencyThreshold}
            onChange={e => setUrgencyThreshold(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="low">Low or higher</option>
            <option value="medium">Medium or higher</option>
            <option value="high">High or critical</option>
            <option value="critical">Critical only</option>
          </select>
          <p className="text-xs text-muted-foreground">Ignore alerts below this urgency level.</p>
        </div>
      </div>

      {/* Advanced */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
        >
          <span className="font-medium text-sm">Advanced Settings</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
        </button>
        {advancedOpen && (
          <div className="px-4 py-3 border-t border-border space-y-3 bg-secondary/20">
            <p className="text-xs text-muted-foreground">Role-based defaults and custom rules coming soon.</p>
            {isAdmin && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-900">Admin-only: Role templates and escalation rules will be available here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <p className="text-xs text-muted-foreground">Changes apply to your account immediately.</p>
      </div>
    </motion.div>
  );
}

export const hideBase44Index = true;
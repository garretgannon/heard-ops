import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Bell, Save } from 'lucide-react';

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    reminder_before_due_minutes: 30,
    reminder_before_shift_end_minutes: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const dbSettings = await base44.entities.NotificationSettings.list();
        const loaded = { ...settings };
        dbSettings.forEach(s => {
          if (s.key === 'notifications_enabled') loaded.notifications_enabled = s.value !== 'false';
          if (s.key === 'reminder_before_due_minutes') loaded.reminder_before_due_minutes = parseInt(s.value || 30);
          if (s.key === 'reminder_before_shift_end_minutes') loaded.reminder_before_shift_end_minutes = parseInt(s.value || 30);
        });
        setSettings(loaded);
      } catch (e) {
        console.error('Error loading settings:', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      // Delete existing and recreate
      const existing = await base44.entities.NotificationSettings.list();
      for (const s of existing) {
        if (['notifications_enabled', 'reminder_before_due_minutes', 'reminder_before_shift_end_minutes'].includes(s.key)) {
          await base44.entities.NotificationSettings.delete(s.id);
        }
      }

      // Create new settings
      await base44.entities.NotificationSettings.bulkCreate([
        { key: 'notifications_enabled', value: settings.notifications_enabled.toString() },
        { key: 'reminder_before_due_minutes', value: settings.reminder_before_due_minutes.toString() },
        { key: 'reminder_before_shift_end_minutes', value: settings.reminder_before_shift_end_minutes.toString() },
      ]);

      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setMessage('Error saving settings: ' + e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground mt-1">Configure task reminder notifications</p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          Task reminders help your team stay on top of deadlines and reduce missed tasks. Notifications are sent to users' browsers when they're actively viewing the app.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-6 max-w-2xl">
        {/* Enable Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold cursor-pointer">Enable Task Reminders</Label>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, notifications_enabled: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground pl-8">When enabled, users receive notifications for upcoming and incomplete tasks</p>
        </div>

        {settings.notifications_enabled && (
          <>
            {/* Reminder Before Due */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Label htmlFor="due_minutes" className="text-base font-semibold">
                Remind before task is due
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="due_minutes"
                  type="number"
                  min="5"
                  max="120"
                  value={settings.reminder_before_due_minutes}
                  onChange={(e) => setSettings({ ...settings, reminder_before_due_minutes: parseInt(e.target.value) || 30 })}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">minutes before due time</span>
              </div>
              <p className="text-xs text-muted-foreground">Default: 30 minutes</p>
            </div>

            {/* Shift End Reminder */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Label htmlFor="shift_minutes" className="text-base font-semibold">
                Remind before shift ends
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="shift_minutes"
                  type="number"
                  min="5"
                  max="120"
                  value={settings.reminder_before_shift_end_minutes}
                  onChange={(e) => setSettings({ ...settings, reminder_before_shift_end_minutes: parseInt(e.target.value) || 30 })}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">minutes before shift ends</span>
              </div>
              <p className="text-xs text-muted-foreground">Users get a final reminder if tasks are incomplete</p>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-border flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          {message && (
            <span className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
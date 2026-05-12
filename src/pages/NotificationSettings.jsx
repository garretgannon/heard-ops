import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCircle2, ChevronLeft, AlertCircle, ArrowLeftRight, Clock, Zap, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

const cardStyle = {
  background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)',
};

const CATEGORIES = [
  {
    key: 'approvals',
    label: 'Approval Requests',
    description: 'New items waiting for your review',
    icon: CheckCircle2,
    color: 'text-primary',
    bg: 'bg-primary/15',
    border: 'border-primary/25',
  },
  {
    key: 'criticalAlerts',
    label: 'Critical Alerts',
    description: 'Open issues and priority flags',
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/25',
  },
  {
    key: 'handoffs',
    label: 'Shift Handoffs',
    description: 'Notes from the outgoing manager',
    icon: ArrowLeftRight,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/25',
  },
  {
    key: 'overdueItems',
    label: 'Overdue Tasks',
    description: 'Items that have missed their deadline',
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/25',
  },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 rounded-full border transition-all duration-200 active:scale-95',
        checked ? 'border-primary/50 bg-primary/20' : 'border-border/50 bg-white/5'
      )}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full border',
          checked ? 'left-[22px] border-primary/70 bg-primary' : 'left-0.5 border-border/50 bg-muted-foreground/40'
        )}
        style={checked ? { boxShadow: '0 0 8px rgba(230,106,31,0.5)' } : undefined}
      />
    </button>
  );
}

function PermissionBanner({ permission, onRequest, requesting }) {
  if (permission === 'granted') return null;

  if (permission === 'denied') return (
    <div className="rounded-2xl border border-red-500/25 bg-red-500/8 px-4 py-3 flex items-start gap-3">
      <BellOff className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-bold text-red-400">Notifications blocked</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Open your browser settings to allow notifications from this site.</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/8 px-4 py-3 flex items-center gap-3">
      <Bell className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">Enable push notifications</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Stay on top of approvals and critical alerts even when you're away from the screen.</p>
      </div>
      <button
        onClick={onRequest}
        disabled={requesting}
        className="shrink-0 rounded-xl border border-primary/50 bg-primary/20 px-3 py-1.5 text-xs font-black text-primary transition-all active:scale-95 disabled:opacity-50"
      >
        {requesting ? '…' : 'Allow'}
      </button>
    </div>
  );
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { permission, isSupported, prefs, savePrefs, requestPermission, notify } = useNotifications();
  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setRequesting(true);
    const result = await requestPermission();
    setRequesting(false);
    if (result === 'granted') {
      toast.success('Notifications enabled');
    } else if (result === 'denied') {
      toast.error('Permission denied — check browser settings');
    }
  };

  const handleToggleEnabled = (val) => {
    if (val && permission !== 'granted') {
      handleRequestPermission();
    } else {
      savePrefs({ enabled: val });
    }
  };

  const handleTest = () => {
    if (permission !== 'granted') {
      toast.error('Grant notification permission first');
      return;
    }
    notify('heardOS Test', 'Notifications are working correctly.', { tag: 'test' });
    toast.success('Test notification sent');
  };

  if (!isSupported) {
    return (
      <div className="pb-24 px-4 py-4">
        <div className="text-center py-12">
          <BellOff className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Notifications not supported in this browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-0">
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-4 py-3.5 lg:hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(6,10,16,0.97) 0%, rgba(8,13,20,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-black tracking-tight text-foreground">Notifications</h1>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/30">
        <div>
          <p className="metric-label">Settings</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Notifications</h1>
        </div>
        <button
          onClick={handleTest}
          className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border/50 text-xs font-bold text-foreground transition-all active:scale-95"
          style={cardStyle}
        >
          <Send className="h-3 w-3" /> Send Test
        </button>
      </div>

      <div className="px-4 py-4 lg:px-8 lg:py-6 space-y-4 max-w-xl">

        <PermissionBanner
          permission={permission}
          onRequest={handleRequestPermission}
          requesting={requesting}
        />

        {/* Master toggle */}
        <div className="overflow-hidden rounded-2xl border border-border/40 p-4" style={cardStyle}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', prefs.enabled ? 'bg-primary/15' : 'bg-white/5 border border-border/40')}>
                {prefs.enabled
                  ? <Bell className="h-5 w-5 text-primary" style={{ filter: 'drop-shadow(0 0 4px rgba(230,106,31,0.5))' }} />
                  : <BellOff className="h-5 w-5 text-muted-foreground" />
                }
              </div>
              <div>
                <p className="text-sm font-black text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {prefs.enabled ? 'Alerts will appear even when you leave this tab' : 'Off — no alerts will be sent'}
                </p>
              </div>
            </div>
            <Toggle checked={prefs.enabled} onChange={handleToggleEnabled} />
          </div>
        </div>

        {/* Per-category toggles */}
        <AnimatePresence>
          {prefs.enabled && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <p className="metric-label px-1">Alert Categories</p>
              <div className="overflow-hidden rounded-2xl border border-border/40 divide-y divide-border/30" style={cardStyle}>
                {CATEGORIES.map(({ key, label, description, icon: Icon, color, bg }) => (
                  <div key={key} className="flex items-center gap-3 p-4">
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', bg)}>
                      <Icon className={cn('h-4 w-4', color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    <Toggle
                      checked={prefs[key] !== false}
                      onChange={val => savePrefs({ [key]: val })}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How it works */}
        <div className="overflow-hidden rounded-2xl border border-border/40 p-4 space-y-3" style={cardStyle}>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-black text-foreground">How alerts work</p>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            {[
              'Notifications fire when new approvals or critical issues appear while you\'re away from the screen.',
              'heardOS checks every 60 seconds when your browser tab is in the background.',
              'You\'ll only see each alert once — no repeat pings for the same item.',
            ].map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Test button (mobile) */}
        <button
          onClick={handleTest}
          className="lg:hidden flex w-full items-center justify-center gap-2 h-11 rounded-2xl border border-border/50 text-sm font-black text-foreground transition-all active:scale-[0.97]"
          style={cardStyle}
        >
          <Send className="h-4 w-4 text-muted-foreground" />
          Send Test Notification
        </button>

      </div>
    </div>
  );
}

export const hideBase44Index = true;

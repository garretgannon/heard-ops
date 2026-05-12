import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNotifications } from './useNotifications';

const POLL_MS = 60_000;
const SEEN_KEY = 'heardos-notif-seen';

function getSeenIds() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
}
function markSeen(ids) {
  const seen = getSeenIds();
  ids.forEach(id => seen.add(id));
  // Keep only last 200 to avoid unbounded growth
  const trimmed = [...seen].slice(-200);
  localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
}

export function usePushAlerts() {
  const { notify, prefs } = useNotifications();
  const timerRef = useRef(null);

  const poll = async () => {
    if (!prefs.enabled || document.visibilityState === 'visible') return;
    const seen = getSeenIds();
    const newIds = [];

    try {
      if (prefs.approvals) {
        const pending = await base44.entities.ApprovalQueue.filter({ status: 'pending' }).catch(() => []);
        const unseen = pending.filter(a => !seen.has(a.id));
        if (unseen.length > 0) {
          notify(
            unseen.length === 1 ? 'New Approval Request' : `${unseen.length} Pending Approvals`,
            unseen.length === 1
              ? `${unseen[0].title || unseen[0].item_name || 'Request'} needs your review`
              : `${unseen.length} items are waiting for your approval`,
            { tag: 'approvals', url: '/approvals', category: 'approvals' }
          );
          unseen.forEach(a => newIds.push(a.id));
        }
      }

      if (prefs.criticalAlerts) {
        const logs = await base44.entities.UnifiedLog.filter({ status: 'open' }).catch(() => []);
        const critical = logs.filter(l => l.priority === 'critical' && !seen.has(`log-${l.id}`));
        if (critical.length > 0) {
          notify(
            'Critical Alert',
            critical[0].title || critical[0].description || 'A critical issue needs attention',
            { tag: 'critical', url: '/logs', category: 'criticalAlerts' }
          );
          critical.forEach(l => newIds.push(`log-${l.id}`));
        }
      }

      if (newIds.length) markSeen(newIds);
    } catch {}
  };

  useEffect(() => {
    if (!prefs.enabled) return;
    poll();
    timerRef.current = setInterval(poll, POLL_MS);
    const onVisibility = () => { if (document.visibilityState === 'hidden') poll(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [prefs.enabled, prefs.approvals, prefs.criticalAlerts]);
}

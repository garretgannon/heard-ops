import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const [locations, entries, users, existingIssues] = await Promise.all([
    base44.asServiceRole.entities.TempLogLocation.list(),
    base44.asServiceRole.entities.TempLogEntry.list('-logged_at', 500),
    base44.asServiceRole.entities.User.list(),
    base44.asServiceRole.entities.Issue.list('-created_date', 100),
  ]);

  const admins = users.filter(u => u.role === 'admin' && u.email);
  const activeLocations = locations.filter(l => l.is_active !== false && l.check_interval_minutes);
  const now = Date.now();
  const overdueLocations = [];

  for (const loc of activeLocations) {
    const locEntries = entries.filter(e => e.location_id === loc.id);
    const latest = locEntries.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0];
    const intervalMs = loc.check_interval_minutes * 60 * 1000;
    const lastChecked = latest ? new Date(latest.logged_at).getTime() : 0;
    const minutesOverdue = Math.floor((now - lastChecked - intervalMs) / 60000);

    if (now - lastChecked > intervalMs) {
      overdueLocations.push({
        name: loc.name,
        type: loc.type,
        intervalMinutes: loc.check_interval_minutes,
        minutesOverdue: latest ? minutesOverdue : null,
        neverLogged: !latest,
      });
    }
  }

  if (overdueLocations.length === 0) {
    return Response.json({ message: 'All temperature checks are up to date' });
  }

  // ── Create/update an Issue so it surfaces in Today → Needs Attention ──
  const issueTitle = `Temperature Check Overdue — ${overdueLocations.length} location${overdueLocations.length > 1 ? 's' : ''}`;
  const locationLines = overdueLocations.map(l => {
    const overdueText = l.neverLogged ? '(never logged)' : `(${l.minutesOverdue} min overdue)`;
    return `• ${l.name} — check every ${l.intervalMinutes} min ${overdueText}`;
  }).join('\n');

  // Deduplicate: only create if no open issue with same title exists
  const alreadyOpen = existingIssues.find(i =>
    i.title?.startsWith('Temperature Check Overdue') &&
    ['open', 'in_progress', 'critical'].includes(i.status)
  );

  if (alreadyOpen) {
    await base44.asServiceRole.entities.Issue.update(alreadyOpen.id, {
      title: issueTitle,
      description: `As of ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })} (AZ time), the following temp locations are overdue:\n\n${locationLines}`,
    });
  } else {
    await base44.asServiceRole.entities.Issue.create({
      title: issueTitle,
      description: `As of ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })} (AZ time), the following temp locations are overdue:\n\n${locationLines}`,
      category: 'safety',
      status: 'open',
      logged_by: 'system',
    });
  }

  // ── Email admins ──
  if (admins.length > 0) {
    const subject = `⚠️ Temperature Check Overdue — ${overdueLocations.length} location(s) need attention`;
    const body = `Hello,\n\nThe following temperature locations are overdue for a reading:\n\n${locationLines}\n\nPlease log a temperature reading as soon as possible.\n\nThis is an automated alert from your restaurant ops system.`;
    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: admin.email, subject, body });
    }
  }

  return Response.json({
    message: `Flagged ${overdueLocations.length} overdue location(s), alerted ${admins.length} admin(s)`,
    overdue: overdueLocations.map(l => l.name),
  });
});
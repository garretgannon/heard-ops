import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Fetch all open/in-progress/critical issues
    const allIssues = await base44.asServiceRole.entities.Issue.list('-created_date', 200);
    const openIssues = allIssues.filter(i => ['open', 'in_progress', 'critical'].includes(i.status));

    if (!openIssues.length) {
      return Response.json({ ok: true, message: 'No open issues to sync' });
    }

    // Sort: critical first, then by age (oldest first)
    const sorted = openIssues.sort((a, b) => {
      if (a.status === 'critical' && b.status !== 'critical') return -1;
      if (b.status === 'critical' && a.status !== 'critical') return 1;
      return new Date(a.created_date) - new Date(b.created_date);
    });

    // Build the issues block for the handoff note
    const lines = sorted.map(issue => {
      const hoursOpen = Math.round((now - new Date(issue.created_date)) / 3600000);
      const timeLabel = hoursOpen < 1 ? 'just now' : hoursOpen === 1 ? '1 hr ago' : `${hoursOpen} hrs ago`;
      const assignee = issue.assigned_to_name || issue.assigned_to_email || 'Unassigned';
      const statusLabel = issue.status === 'critical' ? '🔴 CRITICAL' : issue.status === 'in_progress' ? '🟡 In Progress' : '🟠 Open';
      const pin = issue.status === 'critical' ? '📌 ' : '';
      return `${pin}${statusLabel} — ${issue.title} | Assigned: ${assignee} | Open: ${timeLabel}`;
    });

    const issueBlock = `[Open Issues as of ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}]\n${lines.join('\n')}`;

    // Get today's shift handoffs and update the most recent, or create one
    const handoffs = await base44.asServiceRole.entities.ShiftHandoff.filter({ date: todayStr });

    if (handoffs.length > 0) {
      const latest = handoffs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      // Replace any previous issue block, or append fresh
      const existing = latest.notes_for_next_manager || '';
      const cleanedExisting = existing.replace(/\[Open Issues as of[^\]]*\][^\[]*(?=\[|$)/gs, '').trim();
      const updated = cleanedExisting ? `${issueBlock}\n\n${cleanedExisting}` : issueBlock;
      await base44.asServiceRole.entities.ShiftHandoff.update(latest.id, {
        notes_for_next_manager: updated,
      });
    } else {
      // No handoff today yet — create a stub
      const currentHour = now.getHours();
      const shift = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
      await base44.asServiceRole.entities.ShiftHandoff.create({
        date: todayStr,
        shift,
        notes_for_next_manager: issueBlock,
        urgency: sorted.some(i => i.status === 'critical') ? 'critical' : 'high',
        department: 'All',
        logged_by: 'system',
      });
    }

    return Response.json({
      ok: true,
      issues_synced: sorted.length,
      critical: sorted.filter(i => i.status === 'critical').length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
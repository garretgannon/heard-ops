import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const azTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' });

    // ── Issues ──────────────────────────────────────────────────
    const allIssues = await base44.asServiceRole.entities.Issue.list('-created_date', 200);
    const openIssues = allIssues.filter(i => ['open', 'in_progress', 'critical'].includes(i.status));

    let issueBlock = '';
    if (openIssues.length > 0) {
      const sorted = openIssues.sort((a, b) => {
        if (a.status === 'critical' && b.status !== 'critical') return -1;
        if (b.status === 'critical' && a.status !== 'critical') return 1;
        return new Date(a.created_date) - new Date(b.created_date);
      });

      const lines = sorted.map(issue => {
        const hoursOpen = Math.round((now - new Date(issue.created_date)) / 3600000);
        const timeLabel = hoursOpen < 1 ? 'just now' : hoursOpen === 1 ? '1 hr ago' : `${hoursOpen} hrs ago`;
        const assignee = issue.assigned_to_name || issue.assigned_to_email || 'Unassigned';
        const statusLabel = issue.status === 'critical' ? '🔴 CRITICAL' : issue.status === 'in_progress' ? '🟡 In Progress' : '🟠 Open';
        return `${statusLabel} — ${issue.title} | ${assignee} | ${timeLabel}`;
      });

      issueBlock = `[Issues as of ${azTime}]\n${lines.join('\n')}`;
    }

    // ── Today's Prep Snapshot ────────────────────────────────────
    const [prepLists, allPrepItems] = await Promise.all([
      base44.asServiceRole.entities.PrepList.filter({ date: todayStr }),
      base44.asServiceRole.entities.PrepItem.list('-created_date', 500),
    ]);
    const todayListIds = new Set(prepLists.map(l => l.id));
    const todayPrep = allPrepItems.filter(i => todayListIds.has(i.prep_list_id));
    const overduePrepItems = todayPrep.filter(i => i.status === 'overdue');
    const atRiskPrepItems = todayPrep.filter(i => i.at_risk && !['completed', 'approved'].includes(i.status));
    const completedPrep = todayPrep.filter(i => ['completed', 'approved'].includes(i.status));

    let prepBlock = '';
    if (todayPrep.length > 0) {
      const pct = Math.round((completedPrep.length / todayPrep.length) * 100);
      prepBlock = `[Prep Snapshot — ${completedPrep.length}/${todayPrep.length} done (${pct}%)]`;
      if (overduePrepItems.length > 0) prepBlock += `\n🔴 Overdue: ${overduePrepItems.map(i => i.name).join(', ')}`;
      if (atRiskPrepItems.length > 0) prepBlock += `\n🟡 At Risk (inventory): ${atRiskPrepItems.map(i => i.name).join(', ')}`;
    }

    // ── Inventory Snapshot ───────────────────────────────────────
    const inventoryItems = await base44.asServiceRole.entities.InventoryItem.list('-updated_date', 200).catch(() => []);
    const critInv = inventoryItems.filter(i => ['critical', 'out'].includes(i.status));
    const lowInv = inventoryItems.filter(i => i.status === 'low');
    let invBlock = '';
    if (critInv.length > 0 || lowInv.length > 0) {
      invBlock = `[Inventory Alert]`;
      if (critInv.length > 0) invBlock += `\n🔴 Critical/Out: ${critInv.map(i => i.name).join(', ')}`;
      if (lowInv.length > 0) invBlock += `\n🟡 Low Stock: ${lowInv.map(i => i.name).join(', ')}`;
    }

    // ── Merge into Handoff ───────────────────────────────────────
    const blocks = [issueBlock, prepBlock, invBlock].filter(Boolean).join('\n\n');

    if (!blocks) {
      return Response.json({ ok: true, message: 'Nothing to sync — all clear' });
    }

    const handoffs = await base44.asServiceRole.entities.ShiftHandoff.filter({ date: todayStr });

    if (handoffs.length > 0) {
      const latest = handoffs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      const existing = latest.notes_for_next_manager || '';
      // Strip previous auto-blocks to avoid duplication
      const cleaned = existing
        .replace(/\[Issues as of[^\]]*\][\s\S]*?(?=\n\[|$)/g, '')
        .replace(/\[Prep Snapshot[^\]]*\][\s\S]*?(?=\n\[|$)/g, '')
        .replace(/\[Inventory Alert\][\s\S]*?(?=\n\[|$)/g, '')
        .trim();
      const updated = cleaned ? `${blocks}\n\n${cleaned}` : blocks;
      await base44.asServiceRole.entities.ShiftHandoff.update(latest.id, {
        notes_for_next_manager: updated,
        urgency: openIssues.some(i => i.status === 'critical') ? 'critical' : 'high',
      });
    } else {
      const currentHour = now.getHours();
      const shift = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
      await base44.asServiceRole.entities.ShiftHandoff.create({
        date: todayStr,
        shift,
        notes_for_next_manager: blocks,
        urgency: openIssues.some(i => i.status === 'critical') ? 'critical' : 'high',
        department: 'All',
        logged_by: 'system',
      });
    }

    return Response.json({
      ok: true,
      issues_synced: openIssues.length,
      overdue_prep: overduePrepItems.length,
      inv_critical: critInv.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
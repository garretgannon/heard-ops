import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Phoenix' });

    const prepLists = await base44.asServiceRole.entities.PrepList.filter({ date: todayStr });
    const activeLists = prepLists.filter(l => l.status !== 'archived' && l.due_time);

    if (!activeLists.length) return Response.json({ ok: true, message: 'No active lists with due times today' });

    const allItems = await base44.asServiceRole.entities.PrepItem.list('-created_date', 500);
    const todayListIds = new Set(activeLists.map(l => l.id));
    const todayItems = allItems.filter(i => todayListIds.has(i.prep_list_id));

    const overdueItems = [];
    const escalatedItems = [];

    for (const list of activeLists) {
      if (!list.due_time) continue;
      const isPastDue = currentTime > list.due_time;
      if (!isPastDue) continue;

      const listItems = todayItems.filter(i => i.prep_list_id === list.id);
      const incomplete = listItems.filter(i => !['completed', 'approved'].includes(i.status));

      for (const item of incomplete) {
        if (item.status === 'overdue') {
          if (item.priority !== 'high') {
            await base44.asServiceRole.entities.PrepItem.update(item.id, { priority: 'high' });
            escalatedItems.push(item.name);
          }
        } else {
          await base44.asServiceRole.entities.PrepItem.update(item.id, {
            status: 'overdue',
            overdue_flagged_at: now.toISOString(),
          });
          overdueItems.push(item.name);
        }
      }
    }

    // Auto-resolve any "Unfinished Prep" issues if all prep is now done
    const totalIncomplete = todayItems.filter(i => !['completed', 'approved'].includes(i.status)).length;
    if (totalIncomplete === 0 && todayItems.length > 0) {
      const openPrepIssues = await base44.asServiceRole.entities.Issue.list('-created_date', 50);
      const stale = openPrepIssues.filter(i =>
        i.logged_by === 'system' &&
        i.title?.startsWith('Unfinished Prep') &&
        ['open', 'in_progress'].includes(i.status)
      );
      for (const issue of stale) {
        await base44.asServiceRole.entities.Issue.update(issue.id, {
          status: 'resolved',
          resolution_notes: `Auto-resolved at ${currentTime} — all prep items completed.`,
          resolved_at: now.toISOString(),
        });
      }
    }

    // Newly overdue → write to Shift Handoff + create Issue
    if (overdueItems.length > 0) {
      const overdueSummary = `Unfinished Prep (auto-flagged at ${currentTime}): ${overdueItems.join(', ')}`;

      const handoffs = await base44.asServiceRole.entities.ShiftHandoff.filter({ date: todayStr });
      if (handoffs.length > 0) {
        const latest = handoffs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        const existing = latest.prep_concerns || '';
        await base44.asServiceRole.entities.ShiftHandoff.update(latest.id, {
          prep_concerns: existing ? `${existing}\n${overdueSummary}` : overdueSummary,
        });
      } else {
        await base44.asServiceRole.entities.ShiftHandoff.create({
          date: todayStr,
          shift: 'afternoon',
          prep_concerns: overdueSummary,
          urgency: 'high',
          department: 'BOH',
          logged_by: 'system',
        });
      }

      await base44.asServiceRole.entities.Issue.create({
        title: `Unfinished Prep — ${overdueItems.length} item${overdueItems.length > 1 ? 's' : ''} overdue`,
        description: `Not completed by due time: ${overdueItems.join(', ')}. Added to Shift Handoff.`,
        category: 'other',
        status: 'open',
        logged_by: 'system',
      });
    }

    return Response.json({
      ok: true,
      newly_overdue: overdueItems,
      escalated_to_high: escalatedItems,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
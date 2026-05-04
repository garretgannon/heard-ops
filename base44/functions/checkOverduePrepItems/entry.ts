import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    // Fetch today's active prep lists that have a due_time
    const prepLists = await base44.asServiceRole.entities.PrepList.filter({ date: todayStr });
    const activeLists = prepLists.filter(l => l.status !== 'archived' && l.due_time);

    if (!activeLists.length) return Response.json({ ok: true, message: 'No active lists with due times today' });

    // Fetch all prep items for today's lists
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
      const incomplete = listItems.filter(i => i.status !== 'completed');

      for (const item of incomplete) {
        // Already overdue — escalate to high priority
        if (item.status === 'overdue') {
          if (item.priority !== 'high') {
            await base44.asServiceRole.entities.PrepItem.update(item.id, { priority: 'high' });
            escalatedItems.push(item.name);
          }
        } else {
          // First time flagging overdue
          await base44.asServiceRole.entities.PrepItem.update(item.id, {
            status: 'overdue',
            overdue_flagged_at: now.toISOString(),
          });
          overdueItems.push(item.name);
        }
      }
    }

    // If any items newly went overdue, add them to today's shift handoff prep concerns
    if (overdueItems.length > 0) {
      const overdueSummary = `Unfinished Prep (auto-flagged at ${currentTime}): ${overdueItems.join(', ')}`;

      // Get today's latest shift handoff or create one
      const handoffs = await base44.asServiceRole.entities.ShiftHandoff.filter({ date: todayStr });
      if (handoffs.length > 0) {
        const latest = handoffs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        const existing = latest.prep_concerns || '';
        const updated = existing
          ? `${existing}\n${overdueSummary}`
          : overdueSummary;
        await base44.asServiceRole.entities.ShiftHandoff.update(latest.id, { prep_concerns: updated });
      } else {
        await base44.asServiceRole.entities.ShiftHandoff.create({
          date: todayStr,
          shift: 'afternoon',
          prep_concerns: overdueSummary,
          urgency: 'high',
          department: 'BOH',
        });
      }

      // Create an Issue so it surfaces in Needs Attention
      await base44.asServiceRole.entities.Issue.create({
        title: `Unfinished Prep — ${overdueItems.length} item${overdueItems.length > 1 ? 's' : ''} overdue`,
        description: `The following prep items passed their due time and are not completed: ${overdueItems.join(', ')}. Added to Shift Handoff.`,
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
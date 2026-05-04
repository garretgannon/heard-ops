import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Current time as HH:MM in Arizona time
    const azTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Phoenix'
    });

    // Fetch today's side work that is still pending or in_progress
    const allToday = await base44.asServiceRole.entities.SideWorkAssignment.filter({ date: todayStr });
    const incomplete = allToday.filter(t => ['pending', 'in_progress'].includes(t.status));

    if (!incomplete.length) {
      return Response.json({ ok: true, message: 'No incomplete side work tasks today' });
    }

    const overdueTasks = [];

    for (const task of incomplete) {
      const dueTime = task.due_time || task.shift_end_time;
      if (!dueTime) continue;

      // Compare HH:MM strings directly (works within same day)
      if (azTime >= dueTime) {
        // Skip recurring tasks that are already flagged overdue — don't reset until completed
        if (task.status === 'overdue') continue;

        await base44.asServiceRole.entities.SideWorkAssignment.update(task.id, {
          status: 'overdue',
          overdue_flagged_at: now.toISOString(),
          completion_status: 'missed',
          priority: 'high',
        });

        overdueTasks.push(task);
      }
    }

    // If any tasks went overdue, surface an Issue in Needs Attention
    if (overdueTasks.length > 0) {
      const taskList = overdueTasks.map(t => `• ${t.task_name} (${t.role})`).join('\n');
      await base44.asServiceRole.entities.Issue.create({
        title: `${overdueTasks.length} Side Work Task${overdueTasks.length > 1 ? 's' : ''} Overdue`,
        description: `The following side work tasks were not completed by their due time:\n${taskList}\n\nFlagged at ${azTime} (AZ time).`,
        category: 'other',
        status: 'open',
        logged_by: 'system',
      });

      // Also append to today's shift handoff
      const handoffs = await base44.asServiceRole.entities.ShiftHandoff.filter({ date: todayStr });
      const overdueNote = `[Overdue Side Work — ${azTime}]\n${taskList}`;

      if (handoffs.length > 0) {
        const latest = handoffs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        const existing = latest.prep_concerns || '';
        await base44.asServiceRole.entities.ShiftHandoff.update(latest.id, {
          prep_concerns: existing ? `${existing}\n\n${overdueNote}` : overdueNote,
        });
      } else {
        const hour = now.getHours();
        const shift = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        await base44.asServiceRole.entities.ShiftHandoff.create({
          date: todayStr,
          shift,
          prep_concerns: overdueNote,
          urgency: 'high',
          department: 'All',
          logged_by: 'system',
        });
      }
    }

    return Response.json({
      ok: true,
      checked: incomplete.length,
      flagged_overdue: overdueTasks.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
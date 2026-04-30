import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStart = sevenDaysAgo.toISOString().split('T')[0];
    const weekEnd = now.toISOString().split('T')[0];

    // Fetch prep items and side work from last 7 days
    const [prepItems, sideWork, users] = await Promise.all([
      base44.asServiceRole.entities.PrepItem.list('-created_date', 500),
      base44.asServiceRole.entities.SideWorkAssignment.list('-created_date', 500),
      base44.asServiceRole.entities.User.list(),
    ]);

    // Filter to last 7 days
    const prepItemsWeek = prepItems.filter(p => {
      const d = new Date(p.created_date).toISOString().split('T')[0];
      return d >= weekStart && d <= weekEnd;
    });

    const sideWorkWeek = sideWork.filter(s => {
      const d = s.date;
      return d >= weekStart && d <= weekEnd;
    });

    // Totals
    const prepCompleted = prepItemsWeek.filter(p => p.status === 'completed').length;
    const prepMissed = prepItemsWeek.filter(p => p.status !== 'completed' && p.completed_at).length;
    const prepPending = prepItemsWeek.filter(p => p.status !== 'completed' && !p.completed_at).length;

    const swCompleted = sideWorkWeek.filter(s => s.status === 'approved').length;
    const swMissed = sideWorkWeek.filter(s => s.status === 'pending' || s.status === 'rejected').length;
    const swInReview = sideWorkWeek.filter(s => s.status === 'completed').length;

    // Employee performance
    const employeeStats = {};

    prepItemsWeek.forEach(p => {
      const key = p.completed_by || 'Unassigned';
      if (!employeeStats[key]) {
        employeeStats[key] = { prep: { total: 0, completed: 0, missed: 0, onTime: 0, late: 0 }, sidework: { total: 0, completed: 0, missed: 0 } };
      }
      employeeStats[key].prep.total++;
      if (p.status === 'completed') employeeStats[key].prep.completed++;
      else employeeStats[key].prep.missed++;
      if (p.completion_status === 'on_time') employeeStats[key].prep.onTime++;
      if (p.completion_status === 'late') employeeStats[key].prep.late++;
    });

    sideWorkWeek.forEach(s => {
      const key = s.completed_by || s.assigned_to_name || s.assigned_to_email || 'Unassigned';
      if (!employeeStats[key]) {
        employeeStats[key] = { prep: { total: 0, completed: 0, missed: 0, onTime: 0, late: 0 }, sidework: { total: 0, completed: 0, missed: 0 } };
      }
      employeeStats[key].sidework.total++;
      if (s.status === 'approved') employeeStats[key].sidework.completed++;
      else employeeStats[key].sidework.missed++;
    });

    // Repeat missed tasks
    const missedTasks = prepItemsWeek.filter(p => p.status !== 'completed');
    const taskCounts = {};
    missedTasks.forEach(t => {
      taskCounts[t.name] = (taskCounts[t.name] || 0) + 1;
    });
    const repeatMissedTasks = Object.entries(taskCounts)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Trends (daily breakdown)
    const dailyTrends = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dailyTrends[dateStr] = { completed: 0, missed: 0, total: 0 };
    }

    prepItemsWeek.forEach(p => {
      const d = new Date(p.created_date).toISOString().split('T')[0];
      if (dailyTrends[d]) {
        dailyTrends[d].total++;
        if (p.status === 'completed') dailyTrends[d].completed++;
        else dailyTrends[d].missed++;
      }
    });

    return Response.json({
      weekStart,
      weekEnd,
      summary: {
        prep: { completed: prepCompleted, missed: prepMissed, pending: prepPending, total: prepItemsWeek.length },
        sidework: { completed: swCompleted, missed: swMissed, inReview: swInReview, total: sideWorkWeek.length },
        totalCompleted: prepCompleted + swCompleted,
        totalMissed: prepMissed + swMissed,
      },
      employeeStats,
      repeatMissedTasks,
      dailyTrends: Object.entries(dailyTrends).map(([date, data]) => ({ date, ...data })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
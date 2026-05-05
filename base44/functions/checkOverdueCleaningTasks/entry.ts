import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Shift change windows (24h format) — tasks not done by these times roll into handoff
const SHIFT_CHANGE_HOURS = [11, 16, 22];

function isShiftChangePeriod() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  // Consider "shift change" as the 30-minute window starting at each shift change hour
  return SHIFT_CHANGE_HOURS.some(h => hour === h && min < 30);
}

function isPastDue(dueTime) {
  if (!dueTime) return false;
  const now = new Date();
  const [h, m] = dueTime.split(":").map(Number);
  const due = new Date();
  due.setHours(h, m || 0, 0, 0);
  return now > due;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const todayStr = new Date().toISOString().split("T")[0];

    // Fetch all today's side work assignments that are cleaning-related
    const allAssignments = await base44.asServiceRole.entities.SideWorkAssignment.filter({ date: todayStr });

    const cleaningTasks = allAssignments.filter(t =>
      ["daily", "weekly", "monthly", "deep_clean"].includes(t.shift_type) ||
      /clean|mop|sweep|sanitiz|wipe|scrub|restroom|trash|restock/i.test(t.task_name || "")
    );

    const overdueTasks = cleaningTasks.filter(t =>
      !["completed", "approved", "overdue"].includes(t.status) && isPastDue(t.due_time)
    );

    const stillMissed = cleaningTasks.filter(t =>
      !["completed", "approved"].includes(t.status) && isPastDue(t.due_time)
    );

    // 1. Mark overdue tasks
    const markedOverdue = [];
    for (const task of overdueTasks) {
      await base44.asServiceRole.entities.SideWorkAssignment.update(task.id, {
        status: "overdue",
        overdue_flagged_at: new Date().toISOString(),
      });
      markedOverdue.push(task.task_name);
    }

    // 2. Create/update "Needs Attention" issue for overdue cleaning tasks
    if (stillMissed.length > 0) {
      const existingIssues = await base44.asServiceRole.entities.Issue.filter({ category: "safety" });
      const cleaningIssue = existingIssues.find(i =>
        i.title?.includes("Cleaning Tasks Overdue") && ["open", "in_progress", "critical"].includes(i.status)
      );

      const taskList = stillMissed.map(t => `• ${t.task_name}${t.due_time ? ` (due ${t.due_time})` : ""}`).join("\n");
      const description = `${stillMissed.length} cleaning task(s) past due as of ${new Date().toLocaleTimeString()}:\n\n${taskList}`;

      if (cleaningIssue) {
        await base44.asServiceRole.entities.Issue.update(cleaningIssue.id, {
          description,
          status: stillMissed.length >= 3 ? "critical" : "open",
        });
      } else {
        await base44.asServiceRole.entities.Issue.create({
          title: `Cleaning Tasks Overdue — ${todayStr}`,
          description,
          category: "safety",
          status: stillMissed.length >= 3 ? "critical" : "open",
          logged_by: "System",
        });
      }
    } else {
      // Auto-resolve if all cleaning tasks are done
      const existingIssues = await base44.asServiceRole.entities.Issue.filter({ category: "safety" });
      const cleaningIssue = existingIssues.find(i =>
        i.title?.includes("Cleaning Tasks Overdue") && i.title?.includes(todayStr) &&
        ["open", "in_progress", "critical"].includes(i.status)
      );
      if (cleaningIssue) {
        await base44.asServiceRole.entities.Issue.update(cleaningIssue.id, {
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolution_notes: "All cleaning tasks completed.",
        });
      }
    }

    // 3. At shift change — add missed tasks to ShiftHandoff
    if (isShiftChangePeriod() && stillMissed.length > 0) {
      const handoffs = await base44.asServiceRole.entities.ShiftHandoff.filter({ date: todayStr });
      const missedBlock = `\n\n[MISSED CLEANING — ${new Date().toLocaleTimeString()}]\n` +
        stillMissed.map(t => `• ${t.task_name}${t.assigned_to_name ? ` (${t.assigned_to_name})` : ""}`).join("\n");

      if (handoffs.length > 0) {
        const latest = handoffs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        const existing = latest.notes_for_next_manager || "";
        const cleaned = existing.replace(/\n\n\[MISSED CLEANING[^\]]*\][^\[]*/g, "").trim();
        await base44.asServiceRole.entities.ShiftHandoff.update(latest.id, {
          notes_for_next_manager: cleaned + missedBlock,
          urgency: "high",
        });
      } else {
        await base44.asServiceRole.entities.ShiftHandoff.create({
          date: todayStr,
          shift: "evening",
          urgency: "high",
          logged_by: "System",
          notes_for_next_manager: `[MISSED CLEANING — ${new Date().toLocaleTimeString()}]\n` +
            stillMissed.map(t => `• ${t.task_name}${t.assigned_to_name ? ` (${t.assigned_to_name})` : ""}`).join("\n"),
          tags: ["FOH", "BOH"],
        });
      }
    }

    // 4. Track daily stats — compute completion % and missed count
    const totalCleaning = cleaningTasks.length;
    const completedCleaning = cleaningTasks.filter(t => ["completed", "approved"].includes(t.status)).length;
    const completionPct = totalCleaning > 0 ? Math.round((completedCleaning / totalCleaning) * 100) : 100;
    const missedCount = cleaningTasks.filter(t => t.status === "overdue" || (isPastDue(t.due_time) && !["completed","approved"].includes(t.status))).length;

    return Response.json({
      success: true,
      date: todayStr,
      total_cleaning_tasks: totalCleaning,
      newly_marked_overdue: markedOverdue.length,
      still_missed: stillMissed.length,
      completion_pct: completionPct,
      missed_count: missedCount,
      shift_change_handoff: isShiftChangePeriod() && stillMissed.length > 0,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Auto-generate ApprovalQueue entries for items requiring review
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all data in parallel — use asServiceRole to avoid user-context rate limits
    const [pendingTasks, failedChecks, existingApprovals] = await Promise.all([
      base44.asServiceRole.entities.GeneratedTask?.filter?.({ status: 'completed', requires_approval: true }, '-completed_at', 50).catch(() => []),
      base44.asServiceRole.entities.OperationalCheck?.filter?.({ status: 'failed' }, '-completed_at', 50).catch(() => []),
      base44.asServiceRole.entities.ApprovalQueue?.filter?.({ status: 'pending' }, '-submitted_at', 200).catch(() => []),
    ]);

    // Build a set of already-queued source IDs to avoid duplicates without extra API calls
    const queuedSourceIds = new Set((existingApprovals || []).map(a => a.source_id));

    const toCreate = [];

    for (const task of pendingTasks || []) {
      if (!queuedSourceIds.has(task.id)) {
        toCreate.push({
          submission_type: 'prep_completion',
          source_id: task.id,
          submitted_by_email: task.completed_by || 'system@heardos.local',
          submitted_by_name: task.assigned_role || 'Unknown',
          summary: task.task_title || 'Task completion',
          priority: task.priority || 'medium',
          submitted_at: task.completed_at || new Date().toISOString(),
          status: 'pending',
        });
      }
    }

    for (const check of failedChecks || []) {
      if (!queuedSourceIds.has(check.id)) {
        toCreate.push({
          submission_type: 'temperature_log',
          source_id: check.id,
          submitted_by_email: check.completed_by || 'system@heardos.local',
          submitted_by_name: check.equipment_name || check.station_name || 'Station',
          station_id: check.station_id,
          station_name: check.station_name,
          summary: `${check.check_name}: Out of acceptable range`,
          priority: 'high',
          submitted_at: check.completed_at || new Date().toISOString(),
          status: 'pending',
        });
      }
    }

    // Create all new entries sequentially to avoid rate limits
    for (const entry of toCreate) {
      await base44.asServiceRole.entities.ApprovalQueue?.create?.(entry).catch(() => null);
    }

    return Response.json({ success: true, created: toCreate.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
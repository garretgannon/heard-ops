import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Auto-generate ApprovalQueue entries for items requiring review
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check for completed GeneratedTasks requiring approval
    const pendingTasks = await base44.entities.GeneratedTask?.filter?.({ status: 'completed', requires_approval: true }, '-completed_at', 100).catch(() => []);
    for (const task of pendingTasks || []) {
      const existing = await base44.entities.ApprovalQueue?.filter?.({ source_id: task.id, submission_type: 'prep_completion' }).catch(() => []);
      if (existing?.length === 0) {
        await base44.entities.ApprovalQueue?.create?.({
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

    // Check for failed OperationalChecks requiring approval
    const failedChecks = await base44.entities.OperationalCheck?.filter?.({ status: 'failed' }, '-completed_at', 100).catch(() => []);
    for (const check of failedChecks || []) {
      const existing = await base44.entities.ApprovalQueue?.filter?.({ source_id: check.id, submission_type: 'temperature_log' }).catch(() => []);
      if (existing?.length === 0) {
        await base44.entities.ApprovalQueue?.create?.({
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

    return Response.json({ success: true, processed: (pendingTasks?.length || 0) + (failedChecks?.length || 0) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
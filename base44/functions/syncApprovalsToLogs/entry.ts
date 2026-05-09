import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { approval_id, status } = await req.json();

    if (!approval_id || !status) {
      return Response.json({ error: 'Missing approval_id or status' }, { status: 400 });
    }

    // Fetch the approval record
    const approval = await base44.entities.ApprovalQueue.get(approval_id).catch(() => null);
    if (!approval) {
      return Response.json({ error: 'Approval not found' }, { status: 404 });
    }

    // Map submission type to log type
    const logTypeMap = {
      'temperature_log': 'temperature_check',
      'prep_completion': 'custom',
      'maintenance_request': 'maintenance_request',
      'incident_report': 'incident',
      'waste_log': 'custom',
      'shift_handoff': 'custom',
      'task_exception': 'custom',
    };

    const logType = logTypeMap[approval.submission_type] || 'custom';

    // Create UnifiedLog entry
    const logEntry = {
      log_type: logType,
      source_task_id: approval.source_id,
      completed_by_email: approval.approved_by_email,
      completed_at: approval.approved_at,
      notes: `[APPROVAL] ${approval.submission_type}: ${status.toUpperCase()}${approval.denial_reason ? ' - ' + approval.denial_reason : ''}`,
      pass_fail_status: status === 'approved' ? 'pass' : 'fail',
      approval_status: status === 'approved' ? 'approved' : 'rejected',
      requires_approval: false,
      submitted_values: {
        approval_id: approval.id,
        submitted_by: approval.submitted_by_email,
        summary: approval.summary,
        priority: approval.priority,
        location: approval.location,
      },
    };

    // Add photo if available
    if (approval.photo_url) {
      logEntry.photo_urls = [approval.photo_url];
    }

    const created = await base44.entities.UnifiedLog.create(logEntry).catch((e) => {
      console.error('Failed to create log entry:', e);
      return null;
    });

    return Response.json({ 
      success: !!created, 
      log_id: created?.id,
      approval_id,
      status,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
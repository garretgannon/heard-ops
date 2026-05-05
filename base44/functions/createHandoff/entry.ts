import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { shift_id, location_id, from_manager_email, from_manager_name } = await req.json();

    if (!shift_id || !location_id) {
      return Response.json({ error: 'Missing shift_id or location_id' }, { status: 400 });
    }

    // Get all incomplete tasks for this shift
    const incompleteTasks = await base44.asServiceRole.entities.Task.filter({
      shift_id,
      status: { $ne: 'completed' },
    }).catch(() => []);

    const incompleteTasksData = incompleteTasks.map(t => ({
      task_id: t.id,
      title: t.title,
      station: t.station_name,
      due_time: t.due_time,
      assigned_to: t.assigned_to_name,
    }));

    // Get all open issues for this shift
    const openIssues = await base44.asServiceRole.entities.Issue.filter({
      shift_id,
      status: { $ne: 'resolved' },
    }).catch(() => []);

    const openIssuesData = openIssues.map(i => ({
      issue_id: i.id,
      title: i.title,
      priority: i.priority,
      assigned_to: i.assigned_to_name,
    }));

    // Create handoff
    const handoff = await base44.asServiceRole.entities.Handoff.create({
      shift_id,
      date: new Date().toISOString().split('T')[0],
      location_id,
      from_manager_email,
      from_manager_name,
      incomplete_tasks: incompleteTasksData,
      open_issues: openIssuesData,
      created_at: new Date().toISOString(),
    });

    return Response.json({ success: true, handoff });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
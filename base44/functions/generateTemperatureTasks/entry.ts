import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active monitored items
    const monitoredItems = await base44.asServiceRole.entities.MonitoredTemperatureItem.filter({
      status: 'active',
    });

    if (!monitoredItems || monitoredItems.length === 0) {
      return Response.json({ generated: 0, message: 'No monitored items found' });
    }

    const now = new Date();
    const generatedTasks = [];

    for (const item of monitoredItems) {
      // Check if task was recently generated
      const recentTasks = await base44.asServiceRole.entities.Task.filter({
        linked_log_id: item.id,
        type: 'temperature',
        created_date: { $gte: new Date(now.getTime() - item.check_frequency_hours * 60 * 60 * 1000).toISOString() },
      });

      if (recentTasks && recentTasks.length > 0) {
        // Task already generated for this frequency window
        continue;
      }

      // Calculate due time based on current time + frequency
      const dueDate = new Date(now.getTime() + item.check_frequency_hours * 60 * 60 * 1000);
      const dueTime = dueDate.toTimeString().slice(0, 5);

      // Create task
      const task = await base44.asServiceRole.entities.Task.create({
        type: 'temperature',
        title: item.name,
        description: `Check temperature: ${item.min_temperature}°F - ${item.max_temperature}°F`,
        assigned_role: item.assigned_role,
        assigned_employee_id: item.assigned_employee_id || undefined,
        assigned_employee_name: item.assigned_employee_name || undefined,
        station: item.station,
        due_date: dueDate.toISOString().split('T')[0],
        due_time: dueTime,
        status: 'not_started',
        priority: 'high',
        visibility: 'team_only',
        custom_metadata: {
          equipment: item.name,
          location: item.location,
          type: item.type,
          minTemperature: item.min_temperature,
          maxTemperature: item.max_temperature,
          correctiveActionRequired: item.corrective_action_required,
          managerReviewRequired: item.manager_review_required,
          monitoredItemId: item.id,
        },
        created_by_user: user.email,
      });

      generatedTasks.push(task.id);

      // Update last_checked timestamp
      await base44.asServiceRole.entities.MonitoredTemperatureItem.update(item.id, {
        last_checked: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      generated: generatedTasks.length,
      taskIds: generatedTasks,
    });
  } catch (error) {
    console.error('Temperature task generation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
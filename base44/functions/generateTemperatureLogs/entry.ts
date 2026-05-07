/**
 * Auto-generate temperature logs from monitored items
 * Runs on schedule, creates UnifiedLog entries with due dates/times
 * Staff scan or enter temps, system auto-passes/fails vs thresholds
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch active monitored items
    const items = await base44.asServiceRole.entities.MonitoredTemperatureItem.list('-created_date', 200);
    const activeItems = items.filter((i) => i.status === 'active');

    if (activeItems.length === 0) {
      return Response.json({ message: 'No active monitored items', count: 0 });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const logsCreated = [];

    for (const item of activeItems) {
      // Determine if this item should be logged today based on shift assignment
      const shouldLog = await shouldLogItemToday(item, base44);
      if (!shouldLog) continue;

      // Check if already logged in the last check_frequency_hours
      const lastLog = await base44.asServiceRole.entities.UnifiedLog.filter(
        {
          type: 'temperature',
          custom_metadata: { monitored_item_id: item.id },
        },
        '-created_date',
        1
      );

      if (lastLog.length > 0) {
        const lastTime = new Date(lastLog[0].created_date);
        const hoursSinceLastLog = (now - lastTime) / (1000 * 60 * 60);
        if (hoursSinceLastLog < item.check_frequency_hours) {
          continue; // Too soon
        }
      }

      // Create a new temperature log entry
      const dueTime = item.due_time || '09:00';
      const [dueHour, dueMinute] = dueTime.split(':').map(Number);
      const isOverdue = currentHour > dueHour || (currentHour === dueHour && currentMinute >= dueMinute);

      const logEntry = await base44.asServiceRole.entities.UnifiedLog.create({
        type: 'temperature',
        title: `${item.name} Temperature Check`,
        description: `Check temperature of ${item.name} at ${item.location}. Safe range: ${item.min_temperature}°F - ${item.max_temperature}°F`,
        location: item.location,
        employee_name: item.assigned_employee_name,
        status: 'open',
        priority: item.priority || 'medium',
        created_by: 'system@base44.local',
        photo_urls: [],
        requires_review: item.manager_review_required || false,
        visibility: 'team_only',
        custom_metadata: {
          monitored_item_id: item.id,
          min_temperature: item.min_temperature,
          max_temperature: item.max_temperature,
          grace_period_minutes: item.grace_period_minutes,
          corrective_action_required: item.corrective_action_required,
          equipment_type: item.type,
          assigned_role: item.assigned_role,
          assigned_station: item.station,
        },
      });

      logsCreated.push({
        id: logEntry.id,
        item: item.name,
        status: isOverdue ? 'overdue' : 'pending',
      });
    }

    return Response.json({
      message: `Generated ${logsCreated.length} temperature logs`,
      count: logsCreated.length,
      logs: logsCreated,
    });
  } catch (error) {
    console.error('Temperature log generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function shouldLogItemToday(item, base44) {
  // Check shift assignment
  if (item.shift_assignment === 'opening') {
    const hour = new Date().getHours();
    return hour < 12; // Morning hours
  }
  if (item.shift_assignment === 'closing') {
    const hour = new Date().getHours();
    return hour >= 16; // Afternoon/evening
  }
  if (item.shift_assignment === 'mid') {
    const hour = new Date().getHours();
    return hour >= 12 && hour < 16;
  }
  return true; // all_day
}
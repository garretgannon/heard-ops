import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notification settings
    const settings = await base44.asServiceRole.entities.NotificationSettings.list();
    const notificationsEnabledSetting = settings.find(s => s.key === 'notifications_enabled');
    const reminderBeforeDueSetting = settings.find(s => s.key === 'reminder_before_due_minutes');
    const shiftEndReminderSetting = settings.find(s => s.key === 'reminder_before_shift_end_minutes');

    const notificationsEnabled = notificationsEnabledSetting?.value !== 'false';
    const reminderBeforeDueMinutes = parseInt(reminderBeforeDueSetting?.value || '30');
    const shiftEndReminderMinutes = parseInt(shiftEndReminderSetting?.value || '30');

    if (!notificationsEnabled) {
      return Response.json({ message: 'Notifications disabled' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Get today's prep items and side work assignments
    const [prepItems, sideWorkAssignments, prepLists] = await Promise.all([
      base44.asServiceRole.entities.PrepItem.filter({ status: 'pending' }),
      base44.asServiceRole.entities.SideWorkAssignment.filter({ date: todayStr, status: 'pending' }),
      base44.asServiceRole.entities.PrepList.list(),
    ]);

    const reminders = [];

    // Check prep items
    for (const item of prepItems) {
      const prepList = prepLists.find(pl => pl.id === item.prep_list_id);
      if (!prepList || prepList.date !== todayStr) continue;

      if (prepList.due_time) {
        const [dueHour, dueMinute] = prepList.due_time.split(':').map(Number);
        const dueDate = new Date();
        dueDate.setHours(dueHour, dueMinute, 0);

        const timeTillDue = (dueDate - now) / 60000; // minutes
        const timeFromShiftEnd = prepList.shift_end_time
          ? (() => {
              const [endHour, endMinute] = prepList.shift_end_time.split(':').map(Number);
              const endDate = new Date();
              endDate.setHours(endHour, endMinute, 0);
              return (endDate - now) / 60000;
            })()
          : null;

        // 30 minutes before due
        if (timeTillDue > 0 && timeTillDue <= reminderBeforeDueMinutes && timeTillDue > reminderBeforeDueMinutes - 1) {
          reminders.push({
            type: 'prep_due_soon',
            title: 'Task Due Soon',
            message: `"${item.name}" is due in 30 minutes`,
            task_id: item.id,
            assigned_to: user.email,
          });
        }

        // Near shift end reminder
        if (timeFromShiftEnd !== null && timeFromShiftEnd > 0 && timeFromShiftEnd <= shiftEndReminderMinutes) {
          reminders.push({
            type: 'shift_ending_incomplete',
            title: 'Shift Ending Soon',
            message: `Complete "${item.name}" before shift ends`,
            task_id: item.id,
            assigned_to: user.email,
          });
        }
      }
    }

    // Check side work assignments
    for (const assignment of sideWorkAssignments) {
      if (assignment.assigned_to_email !== user.email) continue;

      if (assignment.due_time) {
        const [dueHour, dueMinute] = assignment.due_time.split(':').map(Number);
        const dueDate = new Date();
        dueDate.setHours(dueHour, dueMinute, 0);

        const timeTillDue = (dueDate - now) / 60000;
        const timeFromShiftEnd = assignment.shift_end_time
          ? (() => {
              const [endHour, endMinute] = assignment.shift_end_time.split(':').map(Number);
              const endDate = new Date();
              endDate.setHours(endHour, endMinute, 0);
              return (endDate - now) / 60000;
            })()
          : null;

        if (timeTillDue > 0 && timeTillDue <= reminderBeforeDueMinutes && timeTillDue > reminderBeforeDueMinutes - 1) {
          reminders.push({
            type: 'sidework_due_soon',
            title: 'Task Due Soon',
            message: `"${assignment.task_name}" is due in 30 minutes`,
            task_id: assignment.id,
            assigned_to: user.email,
          });
        }

        if (timeFromShiftEnd !== null && timeFromShiftEnd > 0 && timeFromShiftEnd <= shiftEndReminderMinutes) {
          reminders.push({
            type: 'shift_ending_incomplete',
            title: 'Shift Ending Soon',
            message: `Complete "${assignment.task_name}" before shift ends`,
            task_id: assignment.id,
            assigned_to: user.email,
          });
        }
      }
    }

    // Log reminders sent (optional - for audit)
    for (const reminder of reminders) {
      try {
        await base44.asServiceRole.entities.NotificationLog.create({
          user_email: reminder.assigned_to,
          notification_type: reminder.type,
          title: reminder.title,
          message: reminder.message,
          task_id: reminder.task_id,
          sent_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Error logging notification:', e.message);
      }
    }

    return Response.json({ 
      reminders_checked: prepItems.length + sideWorkAssignments.length,
      reminders_sent: reminders.length,
      reminders: reminders 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
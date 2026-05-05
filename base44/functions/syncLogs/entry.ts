import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { logType, logId, isOutOfRange, location, temperature, notes, corrective_action } = payload;

    if (!logType || !logId || !isOutOfRange) {
      return Response.json({ success: true, message: 'No action needed' });
    }

    // Check if issue already exists for this log
    const existingIssues = await base44.entities.Issue.filter({
      description: `Log: ${logId}`,
    }).catch(() => []);

    if (existingIssues.length > 0) {
      return Response.json({ success: true, message: 'Issue already exists' });
    }

    // Create issue for out-of-range condition
    const title = `${logType === 'temp' ? 'Temperature' : 'Log'} Alert: ${location || 'Unknown'}`;
    const description = `Out-of-range condition detected.\nValue: ${temperature}\n${corrective_action ? `Action: ${corrective_action}` : ''}\nLog ID: ${logId}`;

    await base44.entities.Issue.create({
      title,
      description,
      category: logType === 'temp' ? 'equipment' : 'other',
      status: 'critical',
      notes: notes || corrective_action || '',
    });

    // Update shift session if one is active today
    const todayStr = new Date().toISOString().split('T')[0];
    const activeSessions = await base44.entities.ShiftSession.filter({
      date: todayStr,
      status: 'in_progress',
    }).catch(() => []);

    if (activeSessions.length > 0) {
      const session = activeSessions[0];
      // Increment incident count
      await base44.entities.ShiftSession.update(session.id, {
        incidents_count: (session.incidents_count || 0) + 1,
      });
    }

    return Response.json({ success: true, issueCreated: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
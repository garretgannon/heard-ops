import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = [];
    const logTypes = ['temperature', 'maintenance', 'incident', 'waste', 'cleaning', 'manager_note', 'bathroom', 'employee'];
    const statuses = ['open', 'resolved', 'failed', 'flagged'];
    const locations = ['Line 1', 'Prep Area', 'Walk-in', 'Dish Station', 'Office', 'Front of House', 'Bar', 'Storage'];
    const employees = ['Sarah Johnson', 'Marcus Chen', 'Emma Rodriguez', 'David Lee', 'Jessica Brown', 'Alex Martinez'];

    const titles = {
      temperature: ['Walk-in Cooler High', 'Freezer Temperature Alert', 'Hot Line Temp Check', 'Refrigerator Low Temp'],
      maintenance: ['Broken Door Handle', 'Dishwasher Leak', 'Prep Table Issue', 'Equipment Repair Needed'],
      incident: ['Staff Incident Report', 'Customer Complaint', 'Minor Injury', 'Safety Concern'],
      waste: ['Expired Inventory Found', 'Spoiled Produce', 'Broken Equipment Disposal', 'Waste Log Entry'],
      cleaning: ['Deep Clean Needed', 'Equipment Sanitization', 'Floor Cleaning Complete', 'Surface Disinfection'],
      manager_note: ['Staffing Update', 'Daily Meeting Note', 'Shift Reminder', 'Performance Note'],
      bathroom: ['Bathroom Check', 'Restroom Inventory', 'Cleaning Required', 'Inspection Complete'],
      employee: ['Employee Training', 'Certification Update', 'Performance Review', 'Schedule Change'],
    };

    // Generate 25 dummy logs
    for (let i = 0; i < 25; i++) {
      const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const titleList = titles[logType] || titles.manager_note;
      const title = titleList[Math.floor(Math.random() * titleList.length)];

      // Vary created dates - some recent, some older
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - daysAgo);
      createdDate.setHours(createdDate.getHours() - hoursAgo);

      const logData = {
        title,
        type: logType,
        description: `${title} - ${new Date().toLocaleTimeString()}`,
        location,
        employee_name: employee,
        status,
        requires_review: Math.random() > 0.7,
        created_date: createdDate.toISOString(),
        visibility: 'everyone',
      };

      // Add temperature for temperature logs
      if (logType === 'temperature') {
        logData.temperature = Math.floor(Math.random() * 10) + 35;
      }

      // Add follow-up for maintenance
      if (logType === 'maintenance') {
        logData.follow_up_required = status === 'open';
      }

      logs.push(logData);
    }

    // Create all logs
    const created = await base44.entities.UnifiedLog.bulkCreate(logs);

    return Response.json({
      success: true,
      count: created.length,
      message: `Created ${created.length} dummy logs for testing`,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const targetDate = body.date || new Date().toISOString().split('T')[0];
    
    // If specific template provided, process it; otherwise process all active templates
    const templateId = body.sideWorkTemplateId || body.data?.id || body.event?.entity_id;
    const templates = templateId
      ? [await base44.asServiceRole.entities.SideWorkTemplate.get(templateId)]
      : await base44.asServiceRole.entities.SideWorkTemplate.filter({ isActive: true });

    if (!templates || templates.length === 0) {
      return Response.json({ skipped: true, reason: 'No active templates found' });
    }

    let totalCreated = 0;
    const results = [];

    // Process each template
    for (const template of templates) {
      // Check if this template should run today (based on repeatDays)
      const targetDateObj = new Date(targetDate);
      const dayOfWeek = targetDateObj.getDay();
      
      if (template.repeatType === 'weekly' && !template.repeatDays?.includes(dayOfWeek)) {
        continue; // Skip this template for this day
      }

      // Get template items
      const items = await base44.asServiceRole.entities.SideWorkTemplateItem.filter({
        sideWorkTemplateId: template.id
      });

      let created = 0;

      // Create DailySideWorkTasks for each item
      for (const item of items) {
        // Check if task already exists
        const existing = await base44.asServiceRole.entities.DailySideWorkTask.filter({
          sideWorkTemplateId: template.id,
          sideWorkTemplateItemId: item.id,
          date: targetDate
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.DailySideWorkTask.create({
            sideWorkTemplateId: template.id,
            sideWorkTemplateItemId: item.id,
            date: targetDate,
            shift: template.shift,
            department: template.department,
            station: template.station,
            jobCode: template.jobCode,
            taskName: item.taskName,
            description: item.description,
            dueTime: item.dueTime,
            shiftPhase: item.shiftPhase,
            priority: item.priority,
            status: 'pending',
            requiresPhoto: item.requiresPhoto || template.requiresPhoto || false,
            requiresManagerReview: item.requiresManagerReview || template.requiresManagerReview || false,
            notes: item.instructions || template.notes
          });
          created++;
        }
      }

      if (created > 0) {
        results.push({ template: template.name, created });
        totalCreated += created;
      }
    }

    return Response.json({
      success: true,
      totalCreated,
      results,
      date: targetDate
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
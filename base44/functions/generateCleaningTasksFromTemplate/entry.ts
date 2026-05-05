import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const targetDate = body.date || new Date().toISOString().split('T')[0];
    
    const templateId = body.cleaningTemplateId || body.data?.id || body.event?.entity_id;
    const templates = templateId
      ? [await base44.asServiceRole.entities.CleaningTemplate.get(templateId)]
      : await base44.asServiceRole.entities.CleaningTemplate.filter({ isActive: true });

    if (!templates || templates.length === 0) {
      return Response.json({ skipped: true, reason: 'No active templates found' });
    }

    let totalCreated = 0;
    const results = [];

    for (const template of templates) {
      const targetDateObj = new Date(targetDate);
      const dayOfWeek = targetDateObj.getDay();
      
      if (template.repeatType === 'weekly' && !template.repeatDays?.includes(dayOfWeek)) {
        continue;
      }

      const items = await base44.asServiceRole.entities.CleaningTemplateItem.filter({
        cleaningTemplateId: template.id
      });

      let created = 0;

      for (const item of items) {
        const existing = await base44.asServiceRole.entities.DailyCleaningTask.filter({
          cleaningTemplateId: template.id,
          cleaningTemplateItemId: item.id,
          date: targetDate
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.DailyCleaningTask.create({
            cleaningTemplateId: template.id,
            cleaningTemplateItemId: item.id,
            date: targetDate,
            shift: template.shift,
            department: template.department,
            area: template.area,
            station: template.station,
            jobCode: template.jobCode,
            taskName: item.taskName,
            description: item.description,
            dueTime: item.dueTime,
            shiftPhase: item.shiftPhase,
            frequency: item.frequency,
            priority: item.priority,
            suppliesNeeded: item.suppliesNeeded,
            safetyNotes: item.safetyNotes,
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
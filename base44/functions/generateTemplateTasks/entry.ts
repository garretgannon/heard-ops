import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Called from automation (entity event) or directly with { template_id, date }
    const templateId = body.template_id || body.data?.id || body.event?.entity_id;
    const targetDate = body.date || new Date().toISOString().split('T')[0];

    if (!templateId) {
      return Response.json({ error: 'No template_id provided' }, { status: 400 });
    }

    const template = await base44.asServiceRole.entities.Template.get(templateId);
    if (!template || !template.is_active) {
      return Response.json({ skipped: true, reason: 'Template inactive or not found' });
    }

    const tasks = template.tasks || [];
    if (tasks.length === 0) {
      return Response.json({ skipped: true, reason: 'No tasks defined' });
    }

    // Check if tasks already generated for today for this template
    const today = targetDate;
    let created = 0;

    if (template.category === 'prep') {
      // Create a PrepList for today, then PrepItems
      const existingLists = await base44.asServiceRole.entities.PrepList.filter({
        name: template.name,
        date: today
      });

      let prepListId;
      if (existingLists.length > 0) {
        prepListId = existingLists[0].id;
      } else {
        const prepList = await base44.asServiceRole.entities.PrepList.create({
          name: template.name,
          date: today,
          status: 'active',
          source_template_id: templateId,
        });
        prepListId = prepList.id;
      }

      for (const task of tasks) {
        const existing = await base44.asServiceRole.entities.PrepItem.filter({
          prep_list_id: prepListId,
          name: task.name,
          source_template_id: templateId,
        });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.PrepItem.create({
            name: task.name,
            prep_list_id: prepListId,
            station_id: task.station || 'general',
            status: 'pending',
            priority: 'medium',
            requires_photo: task.photo_required || false,
            role_assignment: task.role || template.assigned_role || '',
            source_template_id: templateId,
          });
          created++;
        }
      }
    } else if (template.category === 'opening') {
      for (const task of tasks) {
        const existing = await base44.asServiceRole.entities.OpeningChecklist.filter({
          task_name: task.name,
          date: today,
          source_template_id: templateId,
        });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.OpeningChecklist.create({
            task_name: task.name,
            date: today,
            area: task.station || 'General',
            status: 'pending',
            is_template: true,
            assigned_to_name: task.role || template.assigned_role || '',
            source_template_id: templateId,
          });
          created++;
        }
      }
    } else if (template.category === 'closing') {
      for (const task of tasks) {
        const existing = await base44.asServiceRole.entities.ClosingChecklist.filter({
          task_name: task.name,
          date: today,
          source_template_id: templateId,
        });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.ClosingChecklist.create({
            task_name: task.name,
            date: today,
            area: task.station || 'General',
            status: 'pending',
            is_template: true,
            assigned_to_name: task.role || template.assigned_role || '',
            source_template_id: templateId,
          });
          created++;
        }
      }
    } else if (template.category === 'cleaning' || template.category === 'side_work') {
      for (const task of tasks) {
        const existing = await base44.asServiceRole.entities.SideWorkAssignment.filter({
          task_name: task.name,
          date: today,
          source_template_id: templateId,
        });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.SideWorkAssignment.create({
            task_name: task.name,
            description: task.station || '',
            date: today,
            role: task.role || template.assigned_role || 'General',
            shift_type: 'all',
            status: 'pending',
            due_time: task.due_time || template.due_time || '',
            requires_photo: task.photo_required || template.photo_required || false,
            source_template_id: templateId,
          });
          created++;
        }
      }
    }

    return Response.json({ success: true, template: template.name, category: template.category, created, date: today });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
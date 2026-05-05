import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { shift_id, shift_type, station_ids, location_id } = await req.json();

    if (!shift_id || !shift_type) {
      return Response.json({ error: 'Missing shift_id or shift_type' }, { status: 400 });
    }

    // Get templates for this shift type and stations
    const templates = await base44.asServiceRole.entities.TaskTemplate.filter({
      shift_type: shift_type,
      is_active: true,
    });

    const createdTasks = [];
    for (const template of templates) {
      // Only create tasks for matching stations
      if (station_ids && !station_ids.includes(template.station_id)) continue;

      if (!template.tasks || template.tasks.length === 0) continue;

      for (const taskDef of template.tasks) {
        const task = await base44.asServiceRole.entities.Task.create({
          title: taskDef.title,
          description: taskDef.description || '',
          shift_id,
          station_id: template.station_id,
          station_name: template.station_name || '',
          location_id,
          status: 'pending',
          priority: taskDef.priority || 'medium',
          due_time: taskDef.due_time || '',
          requires_photo: taskDef.requires_photo || false,
          requires_approval: taskDef.requires_approval || false,
          recipe_id: taskDef.recipe_id || '',
          created_from_template: true,
          is_required_for_close: taskDef.is_required_for_close || false,
        });
        createdTasks.push(task);
      }
    }

    return Response.json({ created: createdTasks.length, tasks: createdTasks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
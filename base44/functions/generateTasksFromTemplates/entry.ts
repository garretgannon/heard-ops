import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Scheduled function to generate tasks/logs from active templates
 * Runs daily/on-shift to create recurring tasks without duplicates
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date().toISOString().split('T')[0];
    const templates = await base44.entities.Template.filter({
      is_active: true,
    });

    const results = {
      generated: 0,
      skipped: 0,
      errors: [],
    };

    for (const template of templates) {
      // Check if already generated today
      if (template.last_generated_date === today) {
        results.skipped++;
        continue;
      }

      // Check recurrence rules
      const shouldGenerate = checkRecurrence(template);
      if (!shouldGenerate) {
        results.skipped++;
        continue;
      }

      try {
        // Generate based on template type
        if (['prep', 'sidework', 'cleaning', 'waste_86', 'maintenance'].includes(template.template_type)) {
          // Create Task entity
          await base44.entities.Task.create({
            type: template.template_type === 'waste_86' ? 'waste' : template.template_type,
            title: template.name,
            description: template.description,
            assigned_role: template.assigned_role,
            station: template.assigned_station,
            due_time: template.due_time,
            due_date: today,
            status: 'not_started',
            priority: template.priority,
            photo_required: template.photo_required,
            manager_review_required: template.manager_review_required,
            visibility: template.visibility,
            from_template: true,
            template_id: template.id,
            created_by_user: 'system@app.local',
          });

          results.generated++;
        } else if (['temperature', 'opening_checklist', 'closing_checklist'].includes(template.template_type)) {
          // Create UnifiedLog entity
          const logTypeMap = {
            temperature: 'temperature',
            opening_checklist: 'custom',
            closing_checklist: 'custom',
          };

          await base44.entities.UnifiedLog.create({
            type: logTypeMap[template.template_type],
            title: template.name,
            description: template.description,
            location: template.assigned_station,
            status: 'open',
            priority: template.priority,
            visibility: template.visibility,
            requires_review: template.manager_review_required,
            created_by: 'system@app.local',
            custom_metadata: {
              template_id: template.id,
              checklist_items: template.checklist_items || [],
            },
          });

          results.generated++;
        } else if (template.template_type === 'shift_handoff') {
          // Shift handoff is special — create as a Log entry
          await base44.entities.UnifiedLog.create({
            type: 'custom',
            title: `${template.name} - Shift Handoff`,
            description: template.description,
            status: 'open',
            priority: template.priority,
            visibility: 'team_only',
            created_by: 'system@app.local',
            custom_metadata: {
              template_id: template.id,
              template_type: 'shift_handoff',
              checklist_items: template.checklist_items || [],
            },
          });

          results.generated++;
        } else if (template.template_type === 'beo_event') {
          // BEO event tasks are pre-event task lists
          await base44.entities.Task.create({
            type: 'custom',
            title: template.name,
            description: template.description,
            assigned_role: template.assigned_role,
            station: template.assigned_station,
            due_time: template.due_time,
            due_date: today,
            status: 'not_started',
            priority: template.priority,
            visibility: template.visibility,
            from_template: true,
            template_id: template.id,
            created_by_user: 'system@app.local',
          });

          results.generated++;
        }

        // Mark template as generated today
        await base44.entities.Template.update(template.id, {
          last_generated_date: today,
        });
      } catch (err) {
        results.errors.push({
          template_id: template.id,
          template_name: template.name,
          error: err.message,
        });
      }
    }

    return Response.json({
      status: 'success',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Check if template should generate based on recurrence rules
 */
function checkRecurrence(template) {
  if (!template.recurrence_type) return false;

  const now = new Date();
  const dayOfWeek = now.getDay();

  if (template.recurrence_type === 'daily') return true;

  if (template.recurrence_type === 'weekly' && template.recurrence_days) {
    return template.recurrence_days.includes(dayOfWeek);
  }

  if (template.recurrence_type === 'every_shift') {
    // Generate every shift period (morning, afternoon, evening, night)
    return true;
  }

  if (template.recurrence_type === 'on_demand') return false;

  return false;
}
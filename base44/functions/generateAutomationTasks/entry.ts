import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { shift_type, shift_date, area_id, station_id, employee_email, role_id } = body;

    if (!shift_type || !shift_date) {
      return Response.json({ error: 'Missing shift_type or shift_date' }, { status: 400 });
    }

    // Fetch active templates
    const templates = await base44.asServiceRole.entities.AutomationTemplate.filter({
      is_active: true,
    });

    // Filter templates that apply to this shift
    const applicableTemplates = templates.filter(t => 
      t.applies_to_shift_type.includes(shift_type) ||
      t.applies_to_shift_type.includes('any')
    );

    // Filter by area/station if provided
    const relevantTemplates = applicableTemplates.filter(t => {
      const areaMatch = !area_id || !t.applies_to_area?.length || t.applies_to_area.includes(area_id);
      const stationMatch = !station_id || !t.applies_to_station?.length || t.applies_to_station.includes(station_id);
      return areaMatch && stationMatch;
    });

    // Generate tasks
    const createdTasks = [];
    for (const template of relevantTemplates) {
      // Check for duplicates
      const duplicateKey = `${template.id}-${shift_date}-${shift_type}`;
      const existing = await base44.asServiceRole.entities.GeneratedTask.filter({
        duplicate_prevention_key: duplicateKey,
      });

      if (existing.length > 0) {
        continue; // Skip if already generated
      }

      const taskData = {
        task_title: template.template_name,
        task_type: template.category,
        source_template_id: template.id,
        assigned_user_email: employee_email || null,
        assigned_role: role_id || null,
        area_id: area_id || null,
        station_id: station_id || null,
        due_date: shift_date,
        due_time: template.due_time || '09:00',
        shift_type: shift_type,
        priority: template.priority || 'medium',
        status: 'pending',
        required_proof: template.required_proof_type || [],
        requires_approval: template.requires_manager_approval || false,
        escalation_status: 'none',
        description: template.description || '',
        duplicate_prevention_key: duplicateKey,
      };

      const created = await base44.asServiceRole.entities.GeneratedTask.create(taskData);
      createdTasks.push(created);
    }

    return Response.json({
      success: true,
      created: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error('Task generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
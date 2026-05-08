import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prep_plan_id } = await req.json();

    // Get the prep plan
    const plan = await base44.asServiceRole.entities.PrepPlan.get(prep_plan_id);
    if (!plan) {
      return Response.json({ error: 'Prep plan not found' }, { status: 404 });
    }

    // Check for existing tasks
    const existingTasks = await base44.asServiceRole.entities.Task.filter({
      date: plan.date,
      shift: plan.shift,
      task_type: 'prep',
      station: plan.station,
    }, '-created_date', 100);

    if (existingTasks?.length > 0) {
      // Tasks already exist - don't duplicate
      return Response.json({
        success: false,
        message: 'Tasks already exist for this date/shift/station',
        existing_count: existingTasks.length,
      });
    }

    // Create prep tasks for approved items
    const createdTasks = [];
    for (const item of plan.items || []) {
      if (!item.approved) continue;

      const task = await base44.asServiceRole.entities.Task.create({
        title: item.item_name,
        date: plan.date,
        shift: plan.shift,
        task_type: 'prep',
        station: plan.station,
        assigned_role: item.assigned_role,
        assigned_to_individual: item.assigned_employee,
        status: 'pending',
        priority: 'high',
        due_time: null,
        
        // Prep-specific fields
        prep_plan_id: prep_plan_id,
        prep_template_id: item.template_id,
        par_quantity: item.par_quantity,
        on_hand_quantity: item.on_hand_quantity,
        beo_addon_quantity: item.beo_addon_quantity,
        manager_adjustment_quantity: item.manager_adjustment_quantity,
        calculated_prep_quantity: item.recommended_prep,
        final_prep_quantity: item.final_prep_quantity,
        unit: item.unit,
        linked_recipe_id: item.linked_recipe_id,
        requires_photo: item.requires_photo,
        requires_manager_review: item.requires_manager_review,
        
        description: `Prepare ${item.final_prep_quantity} ${item.unit} of ${item.item_name}. ${item.reason}`,
      });

      createdTasks.push(task.id);
    }

    // Update prep plan status
    await base44.asServiceRole.entities.PrepPlan.update(prep_plan_id, {
      status: 'tasks_generated',
    });

    return Response.json({
      success: true,
      tasks_created: createdTasks.length,
      task_ids: createdTasks,
    });
  } catch (error) {
    console.error('Error generating prep tasks:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
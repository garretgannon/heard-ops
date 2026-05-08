import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inventory_count_id, date, shift, station } = await req.json();

    // Get the inventory count
    const count = await base44.asServiceRole.entities.PrepInventoryCount.get(inventory_count_id);
    if (!count) {
      return Response.json({ error: 'Count not found' }, { status: 404 });
    }

    // Get all active prep templates for this shift/station
    const templates = await base44.asServiceRole.entities.PrepPlanTemplate.filter({
      is_active: true,
      shift: { $in: [shift, 'any'] },
      station,
    }, 'item_name', 100);

    // Get BEO add-ons for this date/shift
    const beoAddons = await base44.asServiceRole.entities.BEOPrepAddon.filter({
      event_date: date,
      shift,
      is_active: true,
    }, '-created_date', 100);

    // Calculate prep for each item
    const items = [];
    for (const template of templates) {
      const countItem = count.items?.find(ci => ci.template_id === template.id);
      const onHand = countItem?.on_hand_quantity || 0;
      const par = template.default_par || 0;
      
      // Sum BEO add-ons for this item
      const beoAddon = beoAddons
        .filter(ba => ba.prep_template_id === template.id)
        .reduce((sum, ba) => sum + (ba.quantity_needed || 0), 0);

      // Calculate recommended prep
      let recommended = par + beoAddon - onHand;
      if (recommended <= 0) recommended = 0;

      // Round up to batch size if defined
      let final = recommended;
      if (template.batch_size && template.batch_size > 0) {
        final = Math.ceil(recommended / template.batch_size) * template.batch_size;
      }

      items.push({
        template_id: template.id,
        item_name: template.item_name,
        par_quantity: par,
        on_hand_quantity: onHand,
        beo_addon_quantity: beoAddon,
        manager_adjustment_quantity: 0,
        recommended_prep: recommended,
        final_prep_quantity: final,
        unit: template.unit,
        reason: `Par ${par} + BEO ${beoAddon} - On-Hand ${onHand} = ${recommended}${template.batch_size ? ` (rounded to ${final})` : ''}`,
        linked_recipe_id: template.linked_recipe_id || null,
        requires_photo: template.requires_photo || false,
        requires_manager_review: template.requires_manager_review || false,
        assigned_role: template.assigned_role || null,
        assigned_employee: template.assigned_employee || null,
        approved: true,
      });
    }

    // Create prep plan
    const plan = await base44.asServiceRole.entities.PrepPlan.create({
      inventory_count_id,
      date,
      shift,
      station,
      status: 'ready_for_review',
      created_by: user.email,
      items,
    });

    // Update count status
    await base44.asServiceRole.entities.PrepInventoryCount.update(inventory_count_id, {
      status: 'needs_review',
    });

    return Response.json({
      success: true,
      prep_plan_id: plan.id,
      items_count: items.length,
    });
  } catch (error) {
    console.error('Error generating prep plan:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
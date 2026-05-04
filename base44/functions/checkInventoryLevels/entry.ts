import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const azTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Phoenix'
    });

    // Fetch all inventory items
    const allItems = await base44.asServiceRole.entities.InventoryItem.list();

    const lowItems = [];
    const criticalItems = [];

    for (const item of allItems) {
      if (item.par_level == null || item.par_level <= 0) continue;

      const stock = item.current_stock ?? 0;
      let newStatus = 'ok';

      if (stock <= 0) newStatus = 'out';
      else if (stock <= item.par_level * 0.5) newStatus = 'critical';
      else if (stock < item.par_level) newStatus = 'low';

      if (newStatus !== 'ok' && item.status !== newStatus) {
        await base44.asServiceRole.entities.InventoryItem.update(item.id, {
          status: newStatus,
          alert_triggered: true,
        });
      }

      if (newStatus === 'out' || newStatus === 'critical') criticalItems.push({ ...item, newStatus });
      else if (newStatus === 'low') lowItems.push({ ...item, newStatus });
    }

    const alertItems = [...criticalItems, ...lowItems];
    if (!alertItems.length) {
      return Response.json({ ok: true, message: 'All inventory at or above par' });
    }

    // Flag related prep items as "at_risk"
    const prepItemsAtRisk = [];
    const prepRequired = alertItems.filter(i => i.required_for_prep && (i.prep_item_names || []).length > 0);

    if (prepRequired.length > 0) {
      const todayPrepLists = await base44.asServiceRole.entities.PrepList.filter({ date: todayStr });
      if (todayPrepLists.length > 0) {
        const prepListIds = todayPrepLists.map(pl => pl.id);
        const allPrepItems = await base44.asServiceRole.entities.PrepItem.list('-created_date', 300);
        const todayPrepItems = allPrepItems.filter(pi =>
          prepListIds.includes(pi.prep_list_id) && !['completed', 'approved'].includes(pi.status)
        );

        for (const invItem of prepRequired) {
          const linked = todayPrepItems.filter(pi =>
            (invItem.prep_item_names || []).some(name =>
              pi.name?.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(pi.name?.toLowerCase())
            )
          );
          for (const pi of linked) {
            if (!pi.at_risk) {
              await base44.asServiceRole.entities.PrepItem.update(pi.id, {
                at_risk: true,
                at_risk_reason: `Low inventory: ${invItem.name} (${invItem.current_stock} ${invItem.unit} — par: ${invItem.par_level})`,
              });
              prepItemsAtRisk.push(pi.name);
            }
          }
        }
      }
    }

    // Create a single consolidated Issue for Needs Attention
    const itemLines = alertItems.map(i => {
      const label = i.newStatus === 'out' ? '🔴 OUT' : i.newStatus === 'critical' ? '🟠 Critical' : '🟡 Low';
      return `${label} — ${i.name}: ${i.current_stock} ${i.unit} (par: ${i.par_level})`;
    }).join('\n');

    const atRiskLine = prepItemsAtRisk.length > 0
      ? `\n\nAt-Risk Prep Items:\n${prepItemsAtRisk.map(n => `• ${n}`).join('\n')}`
      : '';

    await base44.asServiceRole.entities.Issue.create({
      title: `${alertItems.length} Inventory Item${alertItems.length > 1 ? 's' : ''} Below Par`,
      description: `Flagged at ${azTime} (AZ time)\n\n${itemLines}${atRiskLine}`,
      category: 'other',
      status: criticalItems.length > 0 ? 'critical' : 'open',
      logged_by: 'system',
    });

    return Response.json({
      ok: true,
      low: lowItems.length,
      critical: criticalItems.length,
      prep_items_at_risk: prepItemsAtRisk.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
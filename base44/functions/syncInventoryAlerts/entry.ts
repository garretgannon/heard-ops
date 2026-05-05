import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all data
    const [inventory, prepItems, wasteEntries, existingLogs] = await Promise.all([
      base44.asServiceRole.entities.InventoryItem.list('-updated_date', 500),
      base44.asServiceRole.entities.PrepItem.list('-updated_date', 500),
      base44.asServiceRole.entities.WasteEntry.list('-logged_at', 300),
      base44.asServiceRole.entities.ManagerLog.list('-created_date', 200),
    ]);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. LOW STOCK ITEMS
    const lowStockItems = inventory.filter(item => item.par_level && item.current_stock < item.par_level);
    for (const item of lowStockItems) {
      // Check if log already exists today
      const exists = existingLogs.some(log =>
        log.category === 'prep_issue' &&
        log.title.includes(item.name) &&
        log.created_date?.startsWith(todayStr)
      );

      if (!exists) {
        // Create ManagerLog entry
        await base44.asServiceRole.entities.ManagerLog.create({
          title: `Low Stock: ${item.name}`,
          category: 'prep_issue',
          shift: 'morning',
          notes: `Current: ${item.current_stock} ${item.unit} | Par: ${item.par_level} ${item.unit}`,
          priority: item.current_stock / item.par_level <= 0.25 ? 'critical' : 'medium',
          status: 'open',
        });
      }

      // Flag related prep items as at-risk
      if (item.prep_item_names && item.prep_item_names.length > 0) {
        for (const prepName of item.prep_item_names) {
          const prep = prepItems.find(p => p.name === prepName);
          if (prep && !prep.at_risk) {
            await base44.asServiceRole.entities.PrepItem.update(prep.id, {
              at_risk: true,
              at_risk_reason: `Ingredient low: ${item.name}`,
            });
          }
        }
      }
    }

    // 2. 86'D ITEMS
    const eighty6 = await base44.asServiceRole.entities.EightySixItem.filter({ is_active: true });
    for (const item of eighty6) {
      // Check if log already exists today
      const exists = existingLogs.some(log =>
        log.category === 'incident' &&
        log.title.includes(item.item_name) &&
        log.created_date?.startsWith(todayStr)
      );

      if (!exists) {
        // Create ManagerLog entry
        await base44.asServiceRole.entities.ManagerLog.create({
          title: `86: ${item.item_name}`,
          category: 'incident',
          shift: 'evening',
          notes: item.reason || 'Item unavailable',
          priority: item.severity || 'high',
          status: 'open',
        });
      }
    }

    // 3. FREQUENTLY WASTED ITEMS
    const wasteMap = {};
    wasteEntries.forEach(w => {
      const key = w.item_name;
      wasteMap[key] = wasteMap[key] || { count: 0, total: 0, reasons: [] };
      wasteMap[key].count += 1;
      wasteMap[key].total += w.dollar_value || 0;
      if (w.reason) wasteMap[key].reasons.push(w.reason);
    });

    // High risk = wasted 3+ times in past week OR high dollar value
    const highRiskWaste = Object.entries(wasteMap)
      .filter(([name, data]) => data.count >= 3 || data.total > 100)
      .slice(0, 5); // Top 5

    for (const [itemName, data] of highRiskWaste) {
      const exists = existingLogs.some(log =>
        log.category === 'waste' &&
        log.title.includes(itemName) &&
        log.created_date?.startsWith(todayStr)
      );

      if (!exists) {
        // Create ManagerLog entry
        await base44.asServiceRole.entities.ManagerLog.create({
          title: `High Waste Risk: ${itemName}`,
          category: 'waste',
          shift: 'evening',
          notes: `${data.count} waste entries | $${data.total.toFixed(2)} loss | Reasons: ${[...new Set(data.reasons)].join(', ')}`,
          priority: data.total > 150 ? 'critical' : 'high',
          status: 'open',
        });
      }
    }

    return Response.json({
      success: true,
      synced: {
        lowStockAlerts: lowStockItems.length,
        eighty6Alerts: eighty6.length,
        wasteAlerts: highRiskWaste.length,
      },
    });
  } catch (error) {
    console.error('syncInventoryAlerts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
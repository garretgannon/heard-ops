import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    const entityName = event?.entity_name;
    const eventType = event?.type;

    // ── WASTE ENTRY CREATED ──────────────────────────────
    if (entityName === 'WasteEntry' && eventType === 'create') {
      const todayStr = new Date().toISOString().split('T')[0];
      const itemName = data?.item_name;
      if (!itemName) return Response.json({ ok: true });

      // Count how many times this item has been wasted today
      const todayEntries = await base44.asServiceRole.entities.WasteEntry.filter({
        item_name: itemName,
      });
      const todayCount = todayEntries.filter(e =>
        (e.logged_at || e.created_date || '').startsWith(todayStr)
      ).length;

      // Flag as high-risk if wasted 2+ times today — create/update an Issue
      if (todayCount >= 2) {
        const existingIssues = await base44.asServiceRole.entities.Issue.filter({
          title: `High-Risk Waste: ${itemName}`,
          status: 'open',
        });

        if (existingIssues.length === 0) {
          await base44.asServiceRole.entities.Issue.create({
            title: `High-Risk Waste: ${itemName}`,
            description: `"${itemName}" has been wasted ${todayCount}x today. Investigate over-prep or handling.`,
            category: 'other',
            status: 'open',
            logged_by: data?.reported_by || 'Waste Tracker',
          });
        } else {
          // Update description with latest count
          await base44.asServiceRole.entities.Issue.update(existingIssues[0].id, {
            description: `"${itemName}" has been wasted ${todayCount}x today. Investigate over-prep or handling.`,
          });
        }
      }
    }

    // ── EIGHTY SIX ITEM CREATED ──────────────────────────
    if (entityName === 'EightySixItem' && eventType === 'create') {
      const itemName = data?.item_name;
      const severity = data?.severity || 'medium';
      if (!itemName) return Response.json({ ok: true });

      // Always create an Issue for 86'd items so they surface in Today
      const existingIssues = await base44.asServiceRole.entities.Issue.filter({
        title: `86'd: ${itemName}`,
        status: 'open',
      });

      if (existingIssues.length === 0) {
        await base44.asServiceRole.entities.Issue.create({
          title: `86'd: ${itemName}`,
          description: `Item "${itemName}" has been marked 86. Category: ${data?.category || 'Unknown'}. Reason: ${data?.reason || 'Not specified'}.`,
          category: 'other',
          status: severity === 'high' ? 'critical' : 'open',
          logged_by: data?.marked_by || '86 Tracker',
        });
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
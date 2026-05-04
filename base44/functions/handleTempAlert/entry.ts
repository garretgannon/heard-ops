import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data } = body;

    if (!data) return Response.json({ ok: true, skipped: "no data" });

    const outOfRange = data.is_above_range || data.is_below_range;
    if (!outOfRange) return Response.json({ ok: true, skipped: "in range" });

    if (data.alert_triggered) return Response.json({ ok: true, skipped: "already triggered" });

    const equipmentName = data.location_name || data.equipment_name || "Unknown Equipment";
    const direction = data.is_above_range ? "High" : "Low";
    const temp = data.value ?? data.temperature ?? "?";
    const issueTitle = `Temperature Alert – ${equipmentName} (${direction}: ${temp}°F)`;

    await base44.asServiceRole.entities.Issue.create({
      title: issueTitle,
      description: `Temperature reading of ${temp}°F is outside the safe range. Logged at ${data.logged_at || data.created_date}. Temp Log ID: ${data.id}`,
      category: "safety",
      status: "critical",
      logged_by: data.logged_by || "system",
    });

    await base44.asServiceRole.entities.TempLogEntry.update(data.id, {
      alert_triggered: true,
    });

    return Response.json({ ok: true, issued: issueTitle });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called daily at ~5am to generate today's tasks from all active templates
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().split('T')[0];
    const templates = await base44.asServiceRole.entities.Template.filter({ is_active: true });

    const results = [];
    for (const template of templates) {
      const res = await base44.asServiceRole.functions.invoke('generateTemplateTasks', {
        template_id: template.id,
        date: today,
      });
      results.push({ id: template.id, name: template.name, ...res });
    }

    return Response.json({ success: true, date: today, processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
// This automation should be triggered by a scheduled task every 30 minutes
// It calls generateTemperatureTasks to create new temperature check tasks

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Call the main temperature task generation function
    const result = await base44.asServiceRole.functions.invoke('generateTemperatureTasks', {});

    return Response.json({
      success: true,
      message: `Generated ${result.generated} temperature tasks`,
      generatedTasks: result.taskIds || [],
    });
  } catch (error) {
    console.error('Schedule temperature task generation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a professional recipe parser for a restaurant operations system. Parse the user's raw text and extract all recipes into structured JSON.

For each recipe, extract:
- name (string, required)
- category: one of "prep", "sauce", "protein", "pantry", "bakery", "bar", "dessert", "other"
- station (string, e.g. "Grill", "Saute", "Pastry")
- yieldAmount (number, e.g. 1, 12, 2.5)
- yieldUnit (string, e.g. "qt", "portions", "lbs", "each")
- portionSize (string, e.g. "4 oz", "1 cup")
- prepTime (number, minutes)
- cookTime (number, minutes)
- shelfLife (string, e.g. "3 days", "1 week")
- storageLocation (string, e.g. "Walk-in cooler", "Dry storage")
- notes (string, any additional notes)
- allergens (array of strings, e.g. ["gluten", "dairy", "nuts"])
- dietaryFlags (array of strings, e.g. ["vegan", "gluten-free"])
- ingredients: array of { ingredientName, quantity (number), unit, prepNote }
- steps: array of { instruction } in order

Rules:
- Only include fields you can confidently extract; omit others
- If multiple recipes are present, parse all of them
- Normalize units (tbsp, tsp, oz, lb, qt, gal, each, bunch, etc.)
- Return ONLY valid JSON with no markdown, no explanation, no extra text
- Format: { "recipes": [ { ...recipe fields... }, ... ] }`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me();

    const { rawText } = await req.json();
    if (!rawText?.trim()) {
      return Response.json({ error: 'rawText is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: rawText,
        },
      ],
    });

    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';

    let parsed: { recipes: unknown[] };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return Response.json(
        { error: 'Failed to parse AI response as JSON', raw: responseText },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed?.recipes)) {
      return Response.json(
        { error: 'Unexpected response structure', raw: responseText },
        { status: 500 }
      );
    }

    return Response.json({ recipes: parsed.recipes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});

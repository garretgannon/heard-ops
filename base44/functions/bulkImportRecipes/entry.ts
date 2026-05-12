import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a professional recipe parser for a restaurant operations system. Parse all recipes from the provided content — which may include plain text, images of recipe cards, or PDF documents.

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
- If multiple recipes are present across text and files, parse all of them
- Normalize units (tbsp, tsp, oz, lb, qt, gal, each, bunch, etc.)
- For images, carefully read all text visible in the photo
- Return ONLY valid JSON with no markdown, no explanation, no extra text
- Format: { "recipes": [ { ...recipe fields... }, ... ] }`;

type FileAttachment = {
  name: string;
  type: string;
  data: string; // base64
};

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

    const { rawText = '', files = [] }: { rawText: string; files: FileAttachment[] } = await req.json();

    const hasText = rawText.trim().length > 0;
    const hasFiles = Array.isArray(files) && files.length > 0;

    if (!hasText && !hasFiles) {
      return Response.json({ error: 'Provide text or upload files to parse' }, { status: 400 });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    // Build the user message content array
    const userContent: Anthropic.MessageParam['content'] = [];

    if (hasText) {
      userContent.push({ type: 'text', text: rawText.trim() });
    }

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf' || file.name?.endsWith('.pdf');

      if (isImage) {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const mediaType = allowedImageTypes.includes(file.type) ? file.type : 'image/jpeg';
        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: file.data,
          },
        });
      } else if (isPDF) {
        userContent.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: file.data,
          },
        } as Anthropic.DocumentBlockParam);
      }
    }

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
          content: userContent,
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

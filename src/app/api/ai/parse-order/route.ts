import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });

    const systemPrompt = `You are an AI order parser for a Bangladeshi F-Commerce business called Puspaloy.
Your job is to extract order information from raw customer messages (Facebook Messenger, WhatsApp, etc.).
Messages may be in Bengali, English, or mixed (Banglish).

Extract the following fields:
- customerName: Full name of the customer
- phone: Bangladeshi phone number (starts with 01, 11 digits total)
- address: Full delivery address
- product: Product name they want to order
- quantity: Number of items (default 1 if not mentioned)

Return ONLY valid JSON in this exact format:
{
  "customerName": "string or null",
  "phone": "string or null",
  "address": "string or null",
  "product": "string or null",
  "quantity": number,
  "missingFields": ["array of missing required field names"]
}

Required fields are: customerName, phone.
If address is missing add "address" to missingFields.
Do not include any explanation outside the JSON.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://puspaloy.netlify.app',
        'X-Title': 'Puspaloy Business OS',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this order message:\n\n${text}` },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';

    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Parse order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

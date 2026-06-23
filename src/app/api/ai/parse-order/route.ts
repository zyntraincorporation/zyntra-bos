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
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return NextResponse.json({ error: 'Failed to connect to AI parsing service. Please try again.' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'AI returned an empty response. Please try again.' }, { status: 500 });
    }

    try {
      const parsed = JSON.parse(content);
      
      // Safety checks for required fields
      if (!parsed.missingFields) parsed.missingFields = [];
      if (!parsed.customerName && !parsed.missingFields.includes('customerName')) parsed.missingFields.push('customerName');
      if (!parsed.phone && !parsed.missingFields.includes('phone')) parsed.missingFields.push('phone');

      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, content);
      return NextResponse.json({ error: 'Failed to understand the message. Please enter the details manually.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Parse order error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while parsing. Please enter manually.' }, { status: 500 });
  }
}

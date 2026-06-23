import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/firestore/orders';
import { getProducts } from '@/lib/firestore/products';
import { getExpenses } from '@/lib/firestore/expenses';
import { getAdSpend } from '@/lib/firestore/adSpend';
import { getInvestments } from '@/lib/firestore/investments';
import { getCustomers } from '@/lib/firestore/customers';
import { getReturns } from '@/lib/firestore/returns';
import { computeDashboardStats } from '@/lib/calculations/dashboard';

const TIMEOUT_MS = 25000;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: 'No messages provided.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[AI Assistant] OPENROUTER_API_KEY is not set');
      return NextResponse.json({
        reply: '⚙️ AI is not configured yet. Please set the OPENROUTER_API_KEY environment variable in Netlify.',
      });
    }

    // Fetch live Firestore data with individual error isolation
    const [orders, products, expenses, adSpends, investments, customers, returns_] =
      await Promise.all([
        getOrders(500).catch(e => { console.error('[AI] orders fetch failed:', e); return []; }),
        getProducts().catch(e  => { console.error('[AI] products fetch failed:', e); return []; }),
        getExpenses(500).catch(e => { console.error('[AI] expenses fetch failed:', e); return []; }),
        getAdSpend(500).catch(e => { console.error('[AI] adSpend fetch failed:', e); return []; }),
        getInvestments().catch(e => { console.error('[AI] investments fetch failed:', e); return []; }),
        getCustomers().catch(e  => { console.error('[AI] customers fetch failed:', e); return []; }),
        getReturns().catch(e   => { console.error('[AI] returns fetch failed:', e); return []; }),
      ]);

    const stats = computeDashboardStats(orders, products, expenses, adSpends, investments);
    const now   = new Date();
    const monthName = now.toLocaleString('en-BD', { month: 'long', year: 'numeric' });

    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    const pendingOrders   = orders.filter(o => o.status === 'Pending');
    const lowStock        = products.filter(p => p.stock <= p.lowStockThreshold);
    const topCustomers    = [...customers].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5);

    // Ad spend by product
    const adByProduct: Record<string, number> = {};
    adSpends.forEach(a => { adByProduct[a.productName] = (adByProduct[a.productName] ?? 0) + a.amount; });
    const topAdProducts = Object.entries(adByProduct).sort(([, a], [, b]) => b - a).slice(0, 3);

    // Best-selling products by units
    const unitsByProduct: Record<string, number> = {};
    deliveredOrders.forEach(o => { unitsByProduct[o.productName] = (unitsByProduct[o.productName] ?? 0) + o.quantity; });
    const topProducts = Object.entries(unitsByProduct).sort(([, a], [, b]) => b - a).slice(0, 5);

    const context = `
You are the AI Business Assistant for Puspaloy Business OS — a Bangladeshi F-Commerce business selling cosmetics, gifts, and fashion products.
You have access to LIVE business data fetched right now (${now.toLocaleString('en-BD')}).
Answer in the same language the user asks (Bengali or English). Be concise and use actual numbers from the data.
Do NOT hallucinate data. If data is zero or missing, say so honestly.

=== DASHBOARD (Live) ===
- Orders Today: ${stats.ordersToday}
- Revenue Today: ৳${stats.revenueToday.toLocaleString()}
- Profit Today: ৳${stats.profitToday.toLocaleString()}
- Ad Spend Today: ৳${stats.adSpendToday.toLocaleString()}
- Cash Balance (All-Time): ৳${stats.currentCashBalance.toLocaleString()}
- Inventory Value: ৳${stats.inventoryValue.toLocaleString()}

=== ${monthName} ===
- Revenue: ৳${stats.monthlyRevenue.toLocaleString()}
- Expenses: ৳${stats.monthlyExpenses.toLocaleString()}
- Net Profit: ৳${stats.monthlyProfit.toLocaleString()}

=== ORDERS ===
- Total: ${orders.length} | Delivered: ${deliveredOrders.length} | Pending: ${pendingOrders.length} | Returned: ${returns_.length}
- Return Rate: ${deliveredOrders.length > 0 ? ((returns_.length / (deliveredOrders.length + returns_.length)) * 100).toFixed(1) : 0}%

=== TOP SELLING PRODUCTS (by units) ===
${topProducts.length ? topProducts.map(([n, u]) => `- ${n}: ${u} units`).join('\n') : '- No delivered orders yet'}

=== INVENTORY (${products.length} products) ===
${products.slice(0, 10).map(p => `- ${p.name}: ${p.stock} pcs | Buy ৳${p.purchasePrice} | Sell ৳${p.sellingPrice}`).join('\n')}
${lowStock.length > 0 ? `\n⚠️ LOW STOCK: ${lowStock.map(p => `${p.name} (${p.stock} left)`).join(', ')}` : '\n✅ All stock levels OK'}

=== TOP CUSTOMERS ===
${topCustomers.length ? topCustomers.map(c => `- ${c.name} (${c.phone}): ${c.totalOrders} orders, ৳${c.totalSpending.toLocaleString()}`).join('\n') : '- No customers yet'}

=== AD SPEND (Top Products) ===
${topAdProducts.length ? topAdProducts.map(([n, a]) => `- ${n}: ৳${a.toLocaleString()} total`).join('\n') : '- No ad spend recorded'}

=== INVESTMENTS ===
- Nirob: ৳${investments.filter(i => i.person === 'Nirob').reduce((s, i) => s + i.amount, 0).toLocaleString()}
- Partner: ৳${investments.filter(i => i.person === 'Partner').reduce((s, i) => s + i.amount, 0).toLocaleString()}
`.trim();

    // Call OpenRouter with a timeout
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let aiResponse: Response;
    try {
      aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type':  'application/json',
          'HTTP-Referer':  process.env.NEXT_PUBLIC_APP_URL ?? 'https://puspaloy.netlify.app',
          'X-Title':       'Puspaloy Business OS',
        },
        body: JSON.stringify({
          model:       'openai/gpt-4o-mini',
          messages:    [{ role: 'system', content: context }, ...messages],
          temperature: 0.3,
          max_tokens:  600,
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text().catch(() => 'Unknown error');
      console.error('[AI Assistant] OpenRouter error:', aiResponse.status, errText);

      if (aiResponse.status === 401) {
        return NextResponse.json({ reply: '🔑 Invalid API key. Please check the OPENROUTER_API_KEY in Netlify settings.' });
      }
      if (aiResponse.status === 429) {
        return NextResponse.json({ reply: '⏳ AI rate limit reached. Please wait a moment and try again.' });
      }
      return NextResponse.json({ reply: '⚠️ AI service is temporarily unavailable. Please try again shortly.' });
    }

    const data   = await aiResponse.json();
    const reply  = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json({ reply: 'I received an empty response. Please rephrase your question.' });
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return NextResponse.json({ reply: '⏱️ The request timed out. Please try a simpler question.' });
    }
    console.error('[AI Assistant] Unexpected error:', error);
    return NextResponse.json({ reply: '❌ Something went wrong. Please try again.' });
  }
}

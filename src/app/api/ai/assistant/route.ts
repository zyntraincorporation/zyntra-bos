import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/firestore/orders';
import { getProducts } from '@/lib/firestore/products';
import { getExpenses } from '@/lib/firestore/expenses';
import { getAdSpend } from '@/lib/firestore/adSpend';
import { getInvestments } from '@/lib/firestore/investments';
import { getCustomers } from '@/lib/firestore/customers';
import { getReturns } from '@/lib/firestore/returns';
import { computeDashboardStats } from '@/lib/calculations/dashboard';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });

    // Fetch live data from Firestore (limit to recent 500 for performance while keeping monthly stats accurate)
    const [orders, products, expenses, adSpends, investments, customers, returns_] = await Promise.all([
      getOrders(500).catch(() => []), 
      getProducts().catch(() => []), 
      getExpenses(500).catch(() => []), 
      getAdSpend(500).catch(() => []), 
      getInvestments().catch(() => []), 
      getCustomers().catch(() => []), 
      getReturns().catch(() => []),
    ]);

    const stats = computeDashboardStats(orders, products, expenses, adSpends, investments);

    // Build business context string
    const now = new Date();
    const monthName = now.toLocaleString('en-BD', { month: 'long', year: 'numeric' });
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    const pendingOrders = orders.filter(o => o.status === 'Pending');
    const topProducts = [...products].sort((a, b) => b.stock - a.stock).slice(0, 5);
    const lowStock = products.filter(p => p.stock <= p.lowStockThreshold);
    const topCustomers = [...customers].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5);

    // Ad spend by product
    const adByProduct: Record<string, number> = {};
    adSpends.forEach(a => { adByProduct[a.productName] = (adByProduct[a.productName] ?? 0) + a.amount; });
    const topAdProducts = Object.entries(adByProduct).sort(([, a], [, b]) => b - a).slice(0, 3);

    const context = `
You are the AI Business Assistant for Puspaloy Business OS — a Bangladeshi F-Commerce business selling cosmetics, gifts, and fashion products.
You have access to LIVE business data fetched right now (${now.toLocaleString('en-BD')}).
Answer questions in the same language the user asks (Bengali or English).
Be concise, specific, and use the actual numbers from the data below.

=== DASHBOARD STATS ===
- Orders Today: ${stats.ordersToday}
- Revenue Today: ৳${stats.revenueToday.toLocaleString()}
- Profit Today: ৳${stats.profitToday.toLocaleString()}
- Ad Spend Today: ৳${stats.adSpendToday.toLocaleString()}
- Current Cash Balance: ৳${stats.currentCashBalance.toLocaleString()}
- Inventory Value: ৳${stats.inventoryValue.toLocaleString()}
- ${monthName} Revenue: ৳${stats.monthlyRevenue.toLocaleString()}
- ${monthName} Expenses: ৳${stats.monthlyExpenses.toLocaleString()}
- ${monthName} Profit: ৳${stats.monthlyProfit.toLocaleString()}

=== ORDERS ===
- Total Orders: ${orders.length}
- Delivered: ${deliveredOrders.length}
- Pending: ${pendingOrders.length}
- Returned: ${returns_.length}
- Return Rate: ${deliveredOrders.length > 0 ? ((returns_.length / (deliveredOrders.length + returns_.length)) * 100).toFixed(1) : 0}%

=== INVENTORY (${products.length} products) ===
${products.slice(0, 10).map(p => `- ${p.name}: ${p.stock} pcs in stock, Buy ৳${p.purchasePrice}, Sell ৳${p.sellingPrice}`).join('\n')}
${lowStock.length > 0 ? `\nLOW STOCK ALERT: ${lowStock.map(p => p.name + ' (' + p.stock + ' left)').join(', ')}` : ''}

=== TOP CUSTOMERS ===
${topCustomers.map(c => `- ${c.name}: ${c.totalOrders} orders, ৳${c.totalSpending.toLocaleString()} total`).join('\n')}

=== AD SPEND (Top Products) ===
${topAdProducts.map(([name, amt]) => `- ${name}: ৳${amt.toLocaleString()} total ad spend`).join('\n')}

=== INVESTMENTS ===
- Nirob: ৳${investments.filter(i => i.person === 'Nirob').reduce((s, i) => s + i.amount, 0).toLocaleString()}
- Partner: ৳${investments.filter(i => i.person === 'Partner').reduce((s, i) => s + i.amount, 0).toLocaleString()}
`;

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
          { role: 'system', content: context },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return NextResponse.json({ reply: 'Sorry, the AI service is currently unavailable. Please try again later.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response. Please try asking in a different way.';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI assistant error:', error);
    return NextResponse.json({ reply: 'An internal error occurred while generating the response. Please try again.' });
  }
}

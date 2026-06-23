import { NextRequest, NextResponse } from 'next/server';

// Telegram webhook handler for order creation via bot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const text = message.text ?? '';
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return NextResponse.json({ ok: true });

    const sendReply = async (msg: string) => {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
      });
    };

    // Skip non-order commands
    if (text.startsWith('/start')) {
      await sendReply('👋 Welcome to Puspaloy Business OS Bot!\n\nSend your order info:\n\nName\nPhone\nAddress\nProduct name');
      return NextResponse.json({ ok: true });
    }

    // Parse the order with AI
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://puspaloy.netlify.app';
    const parseRes = await fetch(`${baseUrl}/api/ai/parse-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const parsed = await parseRes.json();

    // Validate required fields
    if (!parsed.customerName || !parsed.phone) {
      const missing = [];
      if (!parsed.customerName) missing.push('Customer Name');
      if (!parsed.phone) missing.push('Phone Number');
      await sendReply(
        `❌ <b>Order could not be created.</b>\n\nMissing: ${missing.join(', ')}\n\nPlease resend with all required info:\nName\nPhone\nAddress\nProduct`
      );
      return NextResponse.json({ ok: true });
    }

    // Create order in Firestore
    const orderId = `PSL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    
    // We import our internal functions dynamically or at the top
    const { addOrder } = await import('@/lib/firestore/orders');
    const { syncCustomerFromOrder } = await import('@/lib/firestore/customerSync');

    const orderData = {
      customerName: parsed.customerName,
      phone: parsed.phone,
      address: parsed.address ?? '',
      productId: '',
      productName: parsed.product ?? '',
      quantity: parsed.quantity ?? 1,
      sellingPrice: 0,
      status: 'Pending' as const,
      source: 'Telegram' as const,
      courierTracking: '',
      note: 'Via Telegram Bot',
    };

    await addOrder(orderData);
    
    // Sync customer CRM
    await syncCustomerFromOrder({ ...orderData, id: orderId, createdAt: new Date().toISOString() });

    await sendReply(
      `✅ <b>Order Added Successfully!</b>\n\n` +
      `📦 Order ID: <code>${orderId}</code>\n` +
      `👤 Customer: ${parsed.customerName}\n` +
      `📱 Phone: ${parsed.phone}\n` +
      `📍 Address: ${parsed.address ?? 'Not provided'}\n` +
      `🛍️ Product: ${parsed.product ?? 'To be confirmed'}\n` +
      `📊 Status: Pending`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

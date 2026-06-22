import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, customerName, phone, address, productName, quantity, amount } = body;

    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json({ error: 'Steadfast API credentials not configured' }, { status: 500 });
    }

    const payload = {
      invoice: orderId,
      recipient_name: customerName,
      recipient_phone: phone,
      recipient_address: address,
      cod_amount: amount,
      note: productName + ' x' + quantity,
    };

    const response = await fetch('https://portal.steadfast.com.bd/api/v1/create_order', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 200) {
      console.error('Steadfast error:', data);
      return NextResponse.json({ error: data.message ?? 'Steadfast submission failed' }, { status: 502 });
    }

    return NextResponse.json({
      trackingCode: data.consignment?.tracking_code ?? data.tracking_code,
      consignment_id: data.consignment?.id,
    });
  } catch (error) {
    console.error('Courier submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

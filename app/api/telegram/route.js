import { NextResponse } from 'next/server';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      type,
      productName,
      quantity,
      totalPrice,
      remainingStock,
      time,
    } = body;

    // ใช้ Server Environment ก่อน
    // ถ้ายังตั้งชื่อแบบ NEXT_PUBLIC_ ไว้ ก็รองรับเช่นกัน
    const TELEGRAM_BOT_TOKEN =
      process.env.TELEGRAM_BOT_TOKEN ||
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;

    const TELEGRAM_CHAT_ID =
      process.env.TELEGRAM_CHAT_ID ||
      process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบ TELEGRAM_BOT_TOKEN',
        },
        { status: 500 }
      );
    }

    if (!TELEGRAM_CHAT_ID) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบ TELEGRAM_CHAT_ID',
        },
        { status: 500 }
      );
    }

    let messageText = '';

    // ==========================================
    // New Order Alert
    // ==========================================

    if (type === 'new_order') {
      messageText = `
🛍️ <b>มีรายการขายใหม่!</b>

<b>สินค้า:</b> ${escapeHtml(productName)}
<b>จำนวน:</b> ${escapeHtml(quantity)} ชิ้น
<b>ราคารวม:</b> ${escapeHtml(
        Number(totalPrice || 0).toLocaleString()
      )} บาท
<b>สต๊อกคงเหลือปัจจุบัน:</b> ${escapeHtml(
        remainingStock
      )} ชิ้น
<b>เวลา:</b> ${escapeHtml(time)}
`.trim();
    }

    // ==========================================
    // Low Stock Alert
    // ==========================================

    else if (type === 'low_stock') {
      messageText = `
🚨 <b>[เตือนภัย] สต๊อกสินค้าใกล้หมด!</b>

<b>สินค้า:</b> ${escapeHtml(productName)}
<b>คงเหลือเพียง:</b> ${escapeHtml(
        remainingStock
      )} ชิ้น

⚠️ <b>กรุณาเติมสต๊อกสินค้าด่วน!</b>
`.trim();
    }

    else {
      return NextResponse.json(
        {
          success: false,
          error: 'ประเภทการแจ้งเตือนไม่ถูกต้อง',
        },
        { status: 400 }
      );
    }

    // ==========================================
    // Telegram API
    // ==========================================

    const telegramUrl =
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: messageText,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error(
        'Telegram API Error:',
        result
      );

      return NextResponse.json(
        {
          success: false,
          error:
            result?.description ||
            'Telegram API ส่งข้อความไม่สำเร็จ',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'Telegram Server Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

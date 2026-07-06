import axios from 'axios';

/**
 * Mengirim notifikasi ke bot Telegram
 */
export async function sendTelegramNotification(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === 'YOUR_TELEGRAM_BOT_TOKEN' || chatId === 'YOUR_TELEGRAM_CHAT_ID') {
    console.log('[Notification] Telegram configuration is missing. Logging mock message:');
    console.log(`[TELEGRAM MOCK] ${message}`);
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
    console.log('[Notification] Telegram notification sent successfully.');
  } catch (error: any) {
    console.error('[Notification] Error sending Telegram notification:', error.message || error);
  }
}

/**
 * Mengirim notifikasi ke WhatsApp Gateway (misal: Fonnte)
 */
export async function sendWhatsAppNotification(message: string): Promise<void> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;
  const target = process.env.WHATSAPP_TARGET_NUMBER;

  if (!apiUrl || !token || !target || token === 'YOUR_WHATSAPP_TOKEN' || target === 'YOUR_TARGET_PHONE_NUMBER') {
    console.log('[Notification] WhatsApp configuration is missing. Logging mock message:');
    console.log(`[WHATSAPP MOCK] ${message}`);
    return;
  }

  try {
    // Pengiriman menggunakan Fonnte API Gateway
    await axios.post(
      apiUrl,
      {
        target: target,
        message: message,
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );
    console.log('[Notification] WhatsApp notification sent successfully.');
  } catch (error: any) {
    console.error('[Notification] Error sending WhatsApp notification:', error.message || error);
  }
}

/**
 * Pemicu notifikasi perubahan status aset
 */
export async function sendAssetStatusNotification(
  assetName: string,
  skuCode: string,
  oldStatus: string,
  newStatus: string,
  updaterName: string
): Promise<void> {
  const formattedMessage = `<b>🚨 PERUBAHAN STATUS ASET 🚨</b>\n\n` +
    `<b>Nama Aset:</b> ${assetName}\n` +
    `<b>SKU Code:</b> <code>${skuCode}</code>\n` +
    `<b>Status Lama:</b> <i>${oldStatus}</i>\n` +
    `<b>Status Baru:</b> <b>${newStatus}</b>\n` +
    `<b>Diupdate Oleh:</b> ${updaterName}\n` +
    `<b>Waktu:</b> ${new Date().toLocaleString('id-ID')}`;

  await Promise.all([
    sendTelegramNotification(formattedMessage),
    sendWhatsAppNotification(formattedMessage.replace(/<[^>]*>/g, '')) // Kirim versi teks bersih ke WA
  ]);
}

/**
 * Pemicu notifikasi aset baru didaftarkan
 */
export async function sendAssetCreationNotification(
  assetName: string,
  skuCode: string,
  status: string,
  location: string,
  price: number,
  creatorName: string
): Promise<void> {
  const formattedMessage = `<b>🆕 ASET BARU DIDAFTARKAN 🆕</b>\n\n` +
    `<b>Nama Aset:</b> ${assetName}\n` +
    `<b>SKU Code:</b> <code>${skuCode}</code>\n` +
    `<b>Status:</b> <b>${status}</b>\n` +
    `<b>Lokasi:</b> ${location}\n` +
    `<b>Harga:</b> Rp ${price.toLocaleString('id-ID')}\n` +
    `<b>Didaftarkan Oleh:</b> ${creatorName}\n` +
    `<b>Waktu:</b> ${new Date().toLocaleString('id-ID')}`;

  await Promise.all([
    sendTelegramNotification(formattedMessage),
    sendWhatsAppNotification(formattedMessage.replace(/<[^>]*>/g, '')) // Kirim versi teks bersih ke WA
  ]);
}

/**
 * Mengirim data perubahan aset ke Google Spreadsheet via Apps Script Web App
 */
export async function sendToSpreadsheet(
  actionType: string,
  assetName: string,
  skuCode: string,
  status: string,
  location: string,
  price: number,
  updaterName: string
): Promise<void> {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!url || url === 'YOUR_GOOGLE_SHEET_WEBHOOK_URL') {
    console.log('[Spreadsheet] Webhook URL is missing. Skipping sync.');
    return;
  }

  try {
    await axios.post(url, {
      timestamp: new Date().toLocaleString('id-ID'),
      actionType,
      assetName,
      skuCode,
      status,
      location,
      price,
      updaterName
    });
    console.log('[Spreadsheet] Asset data synced successfully.');
  } catch (error: any) {
    console.error('[Spreadsheet] Error syncing to Google Sheet:', error.message || error);
  }
}



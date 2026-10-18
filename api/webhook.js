// api/webhook.js - TumblePro WhatsApp Cloud API Webhook Handler
// Compatible with Vercel Serverless Functions and standalone Node.js

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'tumblepro_secret_2026';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1368348453036390';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

const STORES = [
  { id: 'store_001', name: 'New Town Store Hub', manager: 'Vivek', rider: 'Sudu', areas: ['new town', 'rajarhat', 'action area', 'chinar park'] },
  { id: 'store_002', name: 'Salt Lake Sector V Hub', manager: 'Rahul', rider: 'Amit', areas: ['salt lake', 'sector 5', 'karunamoyee', 'bidhannagar'] },
  { id: 'store_003', name: 'Ballygunge Central Hub', manager: 'Priya', rider: 'Raju', areas: ['ballygunge', 'gariahat', 'park street', 'alipore'] },
];

function routeToStore(text = '', address = '') {
  const combined = (text + ' ' + address).toLowerCase();
  for (const store of STORES) {
    if (store.areas.some(area => combined.includes(area))) {
      return store;
    }
  }
  return STORES[0]; // Default to New Town Store Hub (Vivek & Sudu)
}

function sendJson(res, statusCode, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  if (typeof res.json === 'function') {
    return res.json(data);
  }
  return res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.statusCode = statusCode;
  if (typeof res.send === 'function') {
    return res.send(text);
  }
  return res.end(String(text));
}

async function sendWhatsAppReply(to, messageText) {
  if (!ACCESS_TOKEN) {
    console.log('[WhatsApp Webhook] No WHATSAPP_ACCESS_TOKEN set. Skipping outbound reply to:', to);
    return null;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: messageText },
      }),
    });
    const result = await response.json();
    console.log('[WhatsApp Webhook] Reply sent response:', result);
    return result;
  } catch (err) {
    console.error('[WhatsApp Webhook] Failed to send WhatsApp reply:', err.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // 1. GET: Meta Webhook Verification Handshake
  if (req.method === 'GET') {
    const query = req.query || {};
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    console.log('[WhatsApp Webhook] Handshake received. Mode:', mode, 'Token:', token);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ [WhatsApp Webhook] Verification successful!');
      return sendText(res, 200, challenge);
    } else {
      console.warn('❌ [WhatsApp Webhook] Token verification failed. Provided:', token, 'Expected:', VERIFY_TOKEN);
      return sendJson(res, 403, { error: 'Verification token mismatch' });
    }
  }

  // 2. POST: Inbound WhatsApp Message Notification from Meta
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      } else if (Buffer.isBuffer(body)) {
        try { body = JSON.parse(body.toString()); } catch(e) {}
      }
      body = body || {};

      console.log('[WhatsApp Webhook] Inbound Payload:', JSON.stringify(body, null, 2));

      if (body.object === 'whatsapp_business_account') {
        const entries = body.entry || [];
        for (const entry of entries) {
          const changes = entry.changes || [];
          for (const change of changes) {
            const value = change.value || {};
            const messages = value.messages || [];
            const contacts = value.contacts || [];

            for (let i = 0; i < messages.length; i++) {
              const msg = messages[i];
              const contact = contacts[i] || {};
              const senderPhone = msg.from;
              const senderName = contact.profile ? contact.profile.name : 'Valued Customer';
              const messageText = msg.text ? msg.text.body : (msg.type === 'location' ? 'Location Shared' : 'Order request');

              console.log(`📩 [WhatsApp Webhook] From: ${senderName} (${senderPhone}) -> "${messageText}"`);

              const assignedStore = routeToStore(messageText);

              const replyBody = 
`👋 Hello ${senderName}!

🧺 *Welcome to TumblePro Laundry!*
We received your message:
_\"${messageText}\"_

📍 *Assigned Hub*: ${assignedStore.name}
👤 *Store Owner*: ${assignedStore.manager}
🛵 *Assigned Rider*: ${assignedStore.rider}
⏱️ *Pickup Window*: Scheduled for today!

🔗 *Track your order & view live updates*:
https://tumblepro.in/customer-portal

Our rider will contact you prior to arrival at +${senderPhone}.`;

              await sendWhatsAppReply(senderPhone, replyBody);
            }
          }
        }

        return sendJson(res, 200, { status: 'EVENT_RECEIVED' });
      } else {
        return sendJson(res, 404, { error: 'Not a WhatsApp Business API event' });
      }
    } catch (error) {
      console.error('[WhatsApp Webhook Error]:', error);
      return sendJson(res, 500, { error: error.message });
    }
  }

  return sendJson(res, 405, { error: 'Method Not Allowed' });
};

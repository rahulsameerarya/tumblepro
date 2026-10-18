// api/health.js - Bulletproof health check endpoint for Vercel & Node.js

function sendJson(res, statusCode, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  if (typeof res.json === 'function') {
    return res.json(data);
  }
  return res.end(JSON.stringify(data, null, 2));
}

module.exports = (req, res) => {
  try {
    return sendJson(res, 200, {
      status: 'ONLINE',
      service: 'TumblePro WhatsApp Cloud API Webhook',
      timestamp: new Date().toISOString(),
      verify_token_configured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
      phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '1368348453036390',
    });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
};

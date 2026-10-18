// api/health.js - Quick health check endpoint for TumblePro Webhook
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ONLINE',
    service: 'TumblePro WhatsApp Cloud API Webhook',
    timestamp: new Date().toISOString(),
    verify_token_configured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN || true),
    phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '1368348453036390',
  });
};

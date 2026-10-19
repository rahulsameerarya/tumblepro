// server.js - Standalone Node.js server for Render, Railway, or local testing
// Uses native Node.js HTTP module - zero extra dependencies required!

const http = require('http');
const url = require('url');
const webhookHandler = require('./api/webhook');
const healthHandler = require('./api/health');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || '/', true);
  const rawPath = parsedUrl.pathname || '/';
  const cleanPath = rawPath.replace(/\.js$/, '').replace(/\/$/, '') || '/';

  // Polyfill Express/Vercel helpers on req and res
  req.query = parsedUrl.query;
  
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  
  res.json = function(data) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(data, null, 2));
    return this;
  };
  
  res.send = function(data) {
    this.end(data);
    return this;
  };

  // Route: Health Check
  if (cleanPath === '/api/health') {
    return healthHandler(req, res);
  }

  // Route: WhatsApp Webhook (GET handshake & POST messages)
  if (cleanPath === '/api/webhook') {
    if (req.method === 'GET' || req.method === 'OPTIONS') {
      return webhookHandler(req, res);
    }

    if (req.method === 'POST') {
      let bodyData = '';
      req.on('data', chunk => {
        bodyData += chunk.toString();
      });
      req.on('end', () => {
        try {
          req.body = bodyData ? JSON.parse(bodyData) : {};
        } catch (e) {
          req.body = {};
        }
        return webhookHandler(req, res);
      });
      return;
    }
  }

  // Root landing page
  if (cleanPath === '/' || cleanPath === '') {
    res.setHeader('Content-Type', 'text/html');
    return res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TumblePro WhatsApp Cloud API Webhook</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #1e293b; border-radius: 16px; padding: 32px; max-width: 520px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
            h1 { color: #38bdf8; margin-top: 0; font-size: 24px; display: flex; align-items: center; gap: 8px; }
            .badge { background: #059669; color: #fff; font-size: 12px; padding: 4px 10px; border-radius: 999px; font-weight: bold; }
            p { color: #94a3b8; line-height: 1.6; }
            .endpoint { background: #0f172a; padding: 12px 16px; border-radius: 8px; font-family: monospace; color: #4ade80; border: 1px solid #334155; word-break: break-all; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🧺 TumblePro Webhook <span class="badge">ONLINE</span></h1>
            <p>The Meta WhatsApp Cloud API webhook handler is running 24/7.</p>
            <p><strong>Configured Webhook Endpoint:</strong></p>
            <div class="endpoint">POST /api/webhook</div>
            <p><strong>Health Check Endpoint:</strong></p>
            <div class="endpoint">GET /api/health</div>
            <p style="font-size: 13px; color: #64748b; margin-top: 24px;">TumblePro Multi-Store Laundry & Dry Cleaning CRM Platform</p>
          </div>
        </body>
      </html>
    `);
  }

  // 404 Fallback
  res.status(404).json({ error: 'Endpoint Not Found', availableEndpoints: ['/api/webhook', '/api/health'] });
});

server.listen(PORT, () => {
  console.log(`🚀 [TumblePro Webhook Server] running on http://localhost:${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/api/webhook`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
});

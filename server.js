// server.js - Production server for TumblePro CRM App + WhatsApp Cloud API Webhook
// Zero external dependencies - uses native Node.js http, fs, and path modules.

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const webhookHandler = require('./api/webhook');
const healthHandler = require('./api/health');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res, pathname) {
  // If requesting root, default to index.html
  let targetPath = pathname === '/' || pathname === '' ? '/index.html' : pathname;
  let fullPath = path.join(DIST_DIR, targetPath);

  // Security check: stay within DIST_DIR
  if (!fullPath.startsWith(DIST_DIR)) {
    fullPath = path.join(DIST_DIR, 'index.html');
  }

  // 1. Direct file match in dist (JS bundles, CSS, images, etc.)
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    return fs.createReadStream(fullPath).pipe(res);
  }

  // 2. SPA Fallback: for any app route (/dashboard, /customer-portal, /orders/new) serve dist/index.html
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return fs.createReadStream(indexPath).pipe(res);
  }

  // 3. Fallback if dist hasn't finished building
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>TumblePro App</h1><p>Building production web assets...</p>');
}

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

  // All other routes: Serve TumblePro Frontend App (Single Page Application)
  return serveStatic(req, res, rawPath);
});

server.listen(PORT, () => {
  console.log(`🚀 [TumblePro Production Server] running on http://localhost:${PORT}`);
  console.log(`🌐 TumblePro CRM App: http://localhost:${PORT}`);
  console.log(`📱 Customer Portal: http://localhost:${PORT}/customer-portal`);
  console.log(`📡 WhatsApp Webhook: http://localhost:${PORT}/api/webhook`);
});

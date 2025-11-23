import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, payload) {
  setCorsHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function getStaticFilePath(publicDir, pathname) {
  const cleanPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(cleanPath).replace(/^\/+/, '');
  const filePath = path.join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) {
    return null;
  }
  return filePath;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };
  return map[ext] || 'application/octet-stream';
}

async function serveStatic(publicDir, req, res, pathname) {
  const filePath = getStaticFilePath(publicDir, pathname);
  if (!filePath) {
    sendError(res, 403, 'Forbidden');
    return;
  }

  try {
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      return sendError(res, 403, 'Forbidden');
    }
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    createReadStream(filePath).pipe(res);
  } catch (err) {
    if (err.code === 'ENOENT') {
      sendError(res, 404, 'Not found');
    } else {
      sendError(res, 500, 'Unable to serve file');
    }
  }
}

export { setCorsHeaders, sendJson, sendError, parseJsonBody, serveStatic };

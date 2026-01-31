const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const ROOT_DIR = __dirname;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function safeResolve(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const withoutQuery = decoded.split('?')[0].split('#')[0];
  const normalized = path.normalize(withoutQuery).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(ROOT_DIR, normalized);
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = req.url === '/' ? '/index.html' : req.url;
    const filePath = safeResolve(urlPath);

    // Ensure we only serve files from ROOT_DIR
    if (!filePath.startsWith(ROOT_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const type = contentTypes[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': type,
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
});


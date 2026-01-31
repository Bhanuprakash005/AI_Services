#!/usr/bin/env node
/**
 * Build script: injects PUBLIC_API_URL into config.js at build time.
 * Run before deploy so Vercel env vars are available.
 */
const fs = require('fs');
const path = require('path');

const apiUrl = process.env.PUBLIC_API_URL || process.env.API_URL || 'https://ai-services-xkpq.onrender.com';
const baseUrl = apiUrl.replace(/\/$/, '') + (apiUrl.includes('/api') ? '' : '/api');
const config = `// Auto-generated at build time - do not edit manually
window.__API_BASE_URL = "${baseUrl}";
`;

const outPath = path.join(__dirname, 'config.js');
fs.writeFileSync(outPath, config);
console.log('Wrote config.js with API_BASE_URL:', baseUrl);

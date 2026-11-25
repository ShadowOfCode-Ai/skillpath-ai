/**
 * @file server.ts
 * Production Node.js + Express entry point for SkillPath AI.
 * Listens on 0.0.0.0 and PORT, serves static frontend assets from dist/,
 * and mounts secure /api/* endpoints.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security and parse headers
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '200kb' }));

// Mount API routes
app.use('/api', apiRouter);

// Serve production static assets
app.use(express.static(path.join(__dirname, 'dist')));

// Single Page Application fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`SkillPath AI production server running at http://0.0.0.0:${PORT}`);
});

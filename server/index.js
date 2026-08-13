import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clientDist } from './lib/paths.js';
import { resolvePort } from './lib/port.js';
import { configRouter } from './routes/config.js';
import { coursesRouter } from './routes/courses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.argv.includes('--dev');

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/api/config', configRouter);
  app.use('/api/courses', coursesRouter);

  if (!isDev && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

export async function startServer({ openBrowser = false } = {}) {
  const app = createApp();
  const port = await resolvePort();

  return new Promise((resolve) => {
    const server = app.listen(port, async () => {
      const url = `http://localhost:${port}`;
      console.log(`Lesson Hunter running at ${url}`);
      if (openBrowser) {
        const { default: open } = await import('open');
        open(url).catch(() => {
          console.log('Could not auto-open your browser — open the URL above manually.');
        });
      }
      resolve({ server, port, url });
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer({ openBrowser: false });
}

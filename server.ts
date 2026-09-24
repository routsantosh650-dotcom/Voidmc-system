import express from 'express';
import path from 'path';
import fs from 'fs';
import apiRouter from './server/api';
import { db } from './server/db';

async function startServer() {
  const app = express();
  await db.init();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Body parsing for JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount API router
  app.use('/api', apiRouter);

  const distDir = path.resolve(process.cwd(), 'dist');
  const hasBuiltDist = fs.existsSync(path.join(distDir, 'index.html'));

  if (!isProd || !hasBuiltDist) {
    console.log('[VoidMC Server] Mounting dynamic Vite middleware (Development / On-the-fly mode)...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[VoidMC Server] Serving static built assets from dist directory...');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VoidMC Server] Ready on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[VoidMC Server] Failed to start server:', err);
  process.exit(1);
});

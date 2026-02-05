import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin that serves /api/assets from the public/ directory.
 * Used as a fallback when the render API server (framely preview) isn't running.
 */
function assetsApiPlugin() {
  return {
    name: 'framely-assets-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/api/assets') return next();

        const publicDir = path.resolve(__dirname, 'src/public');
        if (!fs.existsSync(publicDir)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ assets: [] }));
          return;
        }

        const assets = [];
        const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.bmp', '.ico'];
        const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
        const audioExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
        const fontExts = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
        const dataExts = ['.json', '.csv', '.xml', '.txt'];

        function getType(ext) {
          if (imageExts.includes(ext)) return 'image';
          if (videoExts.includes(ext)) return 'video';
          if (audioExts.includes(ext)) return 'audio';
          if (fontExts.includes(ext)) return 'font';
          if (dataExts.includes(ext)) return 'data';
          return 'other';
        }

        function walk(dir, prefix) {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
              walk(full, rel);
            } else {
              const stat = fs.statSync(full);
              const ext = path.extname(entry.name).toLowerCase();
              assets.push({
                name: entry.name,
                path: rel,
                size: stat.size,
                extension: ext,
                type: getType(ext),
              });
            }
          }
        }

        walk(publicDir, '');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ assets }));
      });
    },
  };
}

// Default API port is 3001 (frontend port + 1)
const apiPort = process.env.VITE_RENDER_API_PORT || '3001';

export default defineConfig({
  plugins: [react(), assetsApiPlugin()],
  server: {
    port: 3000,
    cors: true,
    host: '0.0.0.0',
    proxy: {
      '/api/render': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
      '/api/still': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
      '/api/templates': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
      '/outputs': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});

/**
 * Minimal static file server for the story-parity build
 * (`dist-story-parity/`). Playwright's `webServer` runs it.
 *
 * `astro preview` is not used because it serves the `dist/` directory from
 * `astro.config.mjs`, which any other `npm run build` in the repo overwrites
 * mid-run. The story-parity build goes to its own directory instead.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[3] ?? 'dist-story-parity');
const PORT = Number(process.argv[2] ?? 4322);

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt',
};

http
  .createServer((request, response) => {
    const urlPath = decodeURIComponent(request.url.split('?')[0]);
    const candidates = [
      path.join(ROOT, urlPath),
      path.join(ROOT, `${urlPath}.html`),
      path.join(ROOT, urlPath, 'index.html'),
    ];
    const file = candidates.find((candidate) => {
      if (!candidate.startsWith(ROOT) || !fs.existsSync(candidate)) return false;
      return fs.statSync(candidate).isFile();
    });
    if (!file) {
      response.writeHead(404);
      response.end('not found');
      return;
    }
    response.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  })
  .listen(PORT, () => console.log(`story-parity static server on http://localhost:${PORT} serving ${ROOT}`));

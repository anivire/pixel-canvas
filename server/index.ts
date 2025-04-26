import { readdirSync } from 'fs';
import { join } from 'path';

Bun.serve({
  port: 8888,
  routes: {
    '/api/sprites': () => {
      const spritesDir = join(process.cwd(), 'public', 'sprites');
      try {
        const files = readdirSync(spritesDir);
        const imageFiles = files
          .filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file))
          .map(file => `/sprites/${file}`);
        return new Response(JSON.stringify(imageFiles), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('Error reading sprites directory:', error);
        return new Response(
          JSON.stringify({ error: 'Unable to read sprites directory' }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    },
    '/api/status': () => {
      return new Response('Hello!', {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    },
  },
  fetch(req) {
    const url = new URL(req.url);
    const filePath = join(process.cwd(), 'public', url.pathname);
    try {
      const file = Bun.file(filePath);
      if (file.size > 0) {
        return new Response(file, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }
      return new Response('Not Found', { status: 404 });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  },
});

console.log('Server running on http://localhost:8888');

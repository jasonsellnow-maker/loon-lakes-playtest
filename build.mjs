import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const client = path.join(dist, 'client');
await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'server'), { recursive: true });
await mkdir(path.join(dist, '.openai'), { recursive: true });

for (const file of ['index.html','styles.css','puzzles.js','playtest.js','race.js','app.js','service-worker.js','manifest.webmanifest','ATTRIBUTIONS.md','loon-icon.svg','og.png']) {
  await cp(path.join(root, file), path.join(client, file));
}

const worker = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);
    if ((url.pathname === '/' || url.pathname === '/index.html') && response.ok) {
      const html = await response.text();
      return new Response(html.replaceAll('content="og.png"', 'content="' + url.origin + '/og.png"'), response);
    }
    return response;
  }
};\n`;
await writeFile(path.join(dist, 'server', 'index.js'), worker);

let hosting = '{}';
try { hosting = await readFile(path.join(root, '.openai', 'hosting.json'), 'utf8'); } catch (_) { /* created before hosting */ }
await writeFile(path.join(dist, '.openai', 'hosting.json'), hosting);
console.log('Built Loon Lakes playtest beta.');

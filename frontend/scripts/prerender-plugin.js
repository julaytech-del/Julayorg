/**
 * Static pre-render plugin for Vite.
 *
 * After the Vite build completes, this plugin spins up a local static file
 * server pointing at dist/, then uses Puppeteer (bundled with
 * vite-plugin-prerender) to visit each marketing route and saves the rendered
 * HTML as dist/<route>/index.html so nginx returns real content to bots and
 * social crawlers without any JS execution required.
 *
 * Hydration is handled in main.jsx via hydrateRoot / createRoot branching.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Routes to pre-render. Keep this list to lightweight pages only.
// Authenticated / dynamic routes must NOT be pre-rendered.
const PRERENDER_ROUTES = ['/', '/pricing', '/contact'];

export function createStaticPrerenderPlugin() {
  return {
    name: 'julay-prerender',
    apply: 'build',
    closeBundle: {
      sequential: true,
      async handler() {
        // Dynamic import so the plugin is only loaded when actually building
        let VitePluginPrerender;
        try {
          const mod = await import('vite-plugin-prerender');
          VitePluginPrerender = mod.default ?? mod;
        } catch {
          console.warn('[prerender] vite-plugin-prerender not found — skipping SSG.');
          return;
        }

        let PuppeteerRenderer;
        try {
          const mod = await import('vite-plugin-prerender/lib/PuppeteerRenderer.js');
          PuppeteerRenderer = mod.default ?? mod;
        } catch {
          // Try alternate path
          try {
            const mod2 = await import('vite-plugin-prerender');
            PuppeteerRenderer = mod2.PuppeteerRenderer;
          } catch {
            console.warn('[prerender] PuppeteerRenderer not found — skipping SSG.');
            return;
          }
        }

        const distDir = path.resolve(__dirname, '..', 'dist');

        console.log('[prerender] Pre-rendering routes:', PRERENDER_ROUTES.join(', '));

        try {
          // vite-plugin-prerender exposes a direct render function
          const { render } = await import('vite-plugin-prerender');
          await render({
            staticDir: distDir,
            routes: PRERENDER_ROUTES,
            renderer: new PuppeteerRenderer({
              maxConcurrentRoutes: 1,
              renderAfterTime: 3000,
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox'],
            }),
          });
          console.log('[prerender] Done ✓');
        } catch (err) {
          console.warn('[prerender] Skipped:', err.message);
        }
      },
    },
  };
}

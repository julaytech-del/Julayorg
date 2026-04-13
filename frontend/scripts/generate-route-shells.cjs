/**
 * generate-route-shells.cjs
 *
 * Post-build SSG step (no Puppeteer required).
 *
 * Reads dist/index.html and clones it for each public marketing route,
 * injecting route-specific <title>, <meta name="description">, <link rel="canonical">,
 * and OG/Twitter tags. nginx serves the static file directly, so bots and
 * social crawlers get correct metadata without waiting for JS execution.
 *
 * Full React content is still rendered client-side via hydration (hydrateRoot
 * in main.jsx). This gives instant metadata + SSR-quality SEO signals without
 * a full framework migration.
 */

const fs   = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const BASE = 'https://julay.org';

const ROUTES = [
  {
    path: '/pricing',
    title: 'Pricing — Julay AI Work Operating System',
    description: 'Flexible plans for every team. Start free, no credit card required. Upgrade to unlock AI project generation, automations, Gantt charts, and more.',
    canonical: `${BASE}/pricing`,
    ogTitle:  'Julay Pricing — Start Free',
    ogImage:  `${BASE}/og-image.png`,
    noindex: false,
  },
  {
    path: '/contact',
    title: 'Contact Us — Julay',
    description: 'Reach out to the Julay team for support, sales inquiries, or general questions. We typically respond within 24 hours.',
    canonical: `${BASE}/contact`,
    ogTitle:  'Contact Julay',
    ogImage:  `${BASE}/og-image.png`,
    noindex: false,
  },
  {
    path: '/about',
    title: 'About Julay — AI Work Operating System',
    description: 'Learn about Julay, the team building the future of AI-powered project management for modern teams.',
    canonical: `${BASE}/about`,
    ogTitle:  'About Julay',
    ogImage:  `${BASE}/og-image.png`,
    noindex: false,
  },
];

function patchHtml(html, route) {
  // Update <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  // Update description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${route.description}"`
  );

  // Update canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${route.canonical}"`
  );

  // Update OG title
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${route.ogTitle}"`
  );

  // Update OG description
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${route.description}"`
  );

  // Update OG URL
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${route.canonical}"`
  );

  // Update Twitter title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${route.ogTitle}"`
  );

  // Update Twitter description
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${route.description}"`
  );

  // Add/update robots meta
  if (route.noindex) {
    if (html.includes('<meta name="robots"')) {
      html = html.replace(/<meta name="robots" content="[^"]*"/, '<meta name="robots" content="noindex, follow"');
    } else {
      html = html.replace('<meta name="viewport"', '<meta name="robots" content="noindex, follow" />\n    <meta name="viewport"');
    }
  }

  return html;
}

function run() {
  const indexPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('[ssg] dist/index.html not found — run vite build first');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(indexPath, 'utf8');
  let generated = 0;

  for (const route of ROUTES) {
    const routeDir = path.join(DIST, route.path);
    const routeFile = path.join(routeDir, 'index.html');

    // Skip if a hand-crafted static HTML already exists (privacy, terms, cookies)
    if (fs.existsSync(routeFile)) {
      const existing = fs.readFileSync(routeFile, 'utf8');
      // Our hand-crafted pages don't have <div id="root"> — skip them
      if (!existing.includes('id="root"')) {
        console.log(`[ssg] Skipping ${route.path} (static HTML already exists)`);
        continue;
      }
    }

    fs.mkdirSync(routeDir, { recursive: true });
    const patched = patchHtml(baseHtml, route);
    fs.writeFileSync(routeFile, patched, 'utf8');
    console.log(`[ssg] Generated ${route.path}/index.html (${patched.length} bytes)`);
    generated++;
  }

  console.log(`[ssg] Done — ${generated} route(s) generated.`);
}

run();

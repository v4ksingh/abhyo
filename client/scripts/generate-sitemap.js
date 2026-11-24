/**
 * generate-sitemap.js  (ESM — works with "type": "module" in package.json)
 * Run: node scripts/generate-sitemap.js
 * or:  npm run sitemap
 *
 * Fetches dynamic slugs from the live API + local data and writes public/sitemap.xml
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EXAMS } from '../src/data/examsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const BASE_URL = process.env.VITE_CLIENT_URL || 'https://abhyo.com';
const API_URL  = process.env.VITE_API_URL    || 'https://abhyo.com/server/api';
const OUT_FILE = join(__dirname, '../public/sitemap.xml');

// Static public routes
const STATIC_ROUTES = [
  { path: '/',                priority: '1.0', changefreq: 'daily' },
  { path: '/tests',           priority: '0.9', changefreq: 'daily' },
  { path: '/exam-series',     priority: '0.9', changefreq: 'daily' },
  { path: '/video-series',    priority: '0.8', changefreq: 'weekly' },
  { path: '/upcoming-exams',  priority: '0.9', changefreq: 'daily' },
  { path: '/olympiad',        priority: '0.9', changefreq: 'daily' },
  { path: '/olympiad/awards', priority: '0.7', changefreq: 'weekly' },
  { path: '/categories',      priority: '0.8', changefreq: 'weekly' },
  { path: '/courses',         priority: '0.8', changefreq: 'weekly' },
  { path: '/institutes',      priority: '0.7', changefreq: 'weekly' },
  { path: '/ebooks',          priority: '0.8', changefreq: 'weekly' },
  { path: '/plans',           priority: '0.8', changefreq: 'monthly' },
  { path: '/about',           priority: '0.5', changefreq: 'monthly' },
  { path: '/blog',            priority: '0.8', changefreq: 'weekly' },
  { path: '/contact',         priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy-policy',  priority: '0.3', changefreq: 'yearly' },
  { path: '/terms',           priority: '0.3', changefreq: 'yearly' },
  { path: '/refund-policy',   priority: '0.3', changefreq: 'yearly' },
];

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function urlEntry(loc, priority = '0.7', changefreq = 'weekly', lastmod = null) {
  const today = lastmod || new Date().toISOString().split('T')[0];
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function generate() {
  console.log('🗺️  Generating sitemap.xml for', BASE_URL, 'using API', API_URL);
  const seenUrls = new Set();
  const entries = [];

  const addUrl = (loc, priority = '0.7', changefreq = 'weekly', lastmod = null) => {
    // Clean trailing slashes except for root
    const normalizedLoc = loc === `${BASE_URL}/` ? loc : loc.replace(/\/+$/, '');
    if (!seenUrls.has(normalizedLoc)) {
      seenUrls.add(normalizedLoc);
      entries.push(urlEntry(normalizedLoc, priority, changefreq, lastmod));
    }
  };

  // 1. Static routes
  for (const r of STATIC_ROUTES) {
    addUrl(`${BASE_URL}${r.path}`, r.priority, r.changefreq);
  }

  // 2. Upcoming Exams (from local data catalog)
  if (Array.isArray(EXAMS) && EXAMS.length > 0) {
    console.log(`  → ${EXAMS.length} upcoming exams`);
    for (const exam of EXAMS) {
      if (exam.slug) {
        addUrl(`${BASE_URL}/upcoming-exams/${exam.slug}`, '0.8', 'daily');
      }
    }
  }

  // 3. Exam series (dynamic from API)
  try {
    const res = await fetchJson(`${API_URL}/exam-series`);
    const series = res.data || [];
    console.log(`  → ${series.length} exam series`);
    for (const s of series) {
      if (s.slug) {
        addUrl(`${BASE_URL}/exam-series/${s.slug}`, '0.8', 'weekly', s.updatedAt ? s.updatedAt.split('T')[0] : null);
      }
    }
  } catch (e) { console.warn('  ⚠ exam-series:', e.message); }

  // 4. Video series (dynamic from API)
  try {
    const res = await fetchJson(`${API_URL}/video-series`);
    const series = res.data || [];
    console.log(`  → ${series.length} video series`);
    for (const s of series) {
      if (s.slug) {
        addUrl(`${BASE_URL}/video-series/${s.slug}`, '0.7', 'weekly', s.updatedAt ? s.updatedAt.split('T')[0] : null);
      }
    }
  } catch (e) { console.warn('  ⚠ video-series:', e.message); }

  // 5. Courses (dynamic from API)
  try {
    const res = await fetchJson(`${API_URL}/public/courses`);
    const courses = res.data || [];
    console.log(`  → ${courses.length} public courses`);
    for (const c of courses) {
      if (c.slug) {
        addUrl(`${BASE_URL}/c/${c.slug}`, '0.8', 'weekly', c.updatedAt ? c.updatedAt.split('T')[0] : null);
      }
    }
  } catch (e) { console.warn('  ⚠ courses:', e.message); }

  // 6. Institutes with landing pages (dynamic from API)
  try {
    const res = await fetchJson(`${API_URL}/public/institutes?limit=500`);
    const list = res.data || [];
    console.log(`  → ${list.length} institutes`);
    for (const inst of list) {
      if (inst.slug) {
        addUrl(`${BASE_URL}/i/${inst.slug}`, '0.7', 'monthly', inst.updatedAt ? inst.updatedAt.split('T')[0] : null);
      }
    }
  } catch (e) { console.warn('  ⚠ institutes:', e.message); }

  // 7. Olympiads (dynamic from API)
  try {
    const res = await fetchJson(`${API_URL}/olympiad/public/list`);
    const olympiads = res.data || [];
    console.log(`  → ${olympiads.length} public olympiads`);
    for (const o of olympiads) {
      if (o.slug || o.id) {
        addUrl(`${BASE_URL}/olympiad/${o.slug || o.id}`, '0.8', 'daily', o.updatedAt ? o.updatedAt.split('T')[0] : null);
      }
    }
  } catch (e) { console.warn('  ⚠ olympiads:', e.message); }

  // 8. E-Books (dynamic from API)
  try {
    const res = await fetchJson(`${API_URL}/ebooks/public`);
    const ebooks = res.data || [];
    console.log(`  → ${ebooks.length} public ebooks`);
    for (const eb of ebooks) {
      if (eb.slug) {
        addUrl(`${BASE_URL}/ebooks/${eb.slug}`, '0.7', 'weekly', eb.updatedAt ? eb.updatedAt.split('T')[0] : null);
      }
    }
  } catch (e) { console.warn('  ⚠ ebooks:', e.message); }

  // 9. Blog posts (dynamic from API)
  try {
    const res = await fetchJson(`${API_URL}/cms/blog`);
    const posts = res.data || [];
    console.log(`  → ${posts.length} blog posts`);
    for (const p of posts) {
      if (p.slug) {
        addUrl(`${BASE_URL}/blog/${p.slug}`, '0.7', 'weekly', p.updatedAt ? p.updatedAt.split('T')[0] : null);
      }
    }
  } catch (e) { console.warn('  ⚠ blog:', e.message); }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries.join('\n')}
</urlset>
`;

  writeFileSync(OUT_FILE, xml, 'utf8');
  console.log(`✅ sitemap.xml → ${OUT_FILE} (${entries.length} URLs generated)`);
}

generate().catch(err => {
  console.error('❌ Sitemap failed:', err.message);
  process.exit(1);
});

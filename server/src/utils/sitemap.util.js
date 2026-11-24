const fs = require('fs');
const path = require('path');
const { 
  ExamSeries, VideoSeries, Course, Institute, Olympiad, EBook, BlogPost, SiteSettings 
} = require('../models');

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

function urlEntry(loc, priority = '0.7', changefreq = 'weekly', lastmod = null) {
  const today = lastmod || new Date().toISOString().split('T')[0];
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function getUpcomingExamSlugs() {
  const candidatePath = path.resolve(__dirname, '../../../client/src/data/examsData.js');
  if (fs.existsSync(candidatePath)) {
    try {
      const content = fs.readFileSync(candidatePath, 'utf8');
      const matches = [...content.matchAll(/slug:\s*['"]([^'"]+)['"]/g)];
      return matches.map(m => m[1]);
    } catch {
      // fallback
    }
  }
  return [
    'ssc-cgl-2025', 'ssc-chsl-2025', 'ssc-mts-2025', 'ssc-cpo-2025',
    'rrb-ntpc-2025', 'rrb-group-d-2025', 'rrb-je-2025', 'rpf-constable-2025',
    'ibps-po-2025', 'ibps-clerk-2025', 'sbi-po-2025', 'sbi-clerk-2025',
    'rbi-grade-b-2025', 'cds-i-2025', 'nda-2-2025', 'afcat-2-2025',
    'uppsc-pcs-2025', 'bpsc-70th-cce-2025', 'mpsc-rajyaseva-2025',
    'ctet-july-2025', 'kvs-tgt-pgt-2025', 'up-police-constable-2025', 'delhi-police-constable-2025'
  ];
}

async function generateSitemapXml(baseUrlOverride) {
  const rawBase = baseUrlOverride || process.env.CLIENT_URL || 'https://abhyo.com';
  // Use first origin if comma-separated
  const baseUrl = rawBase.split(',')[0].trim().replace(/\/+$/, '');

  const seenUrls = new Set();
  const entries = [];
  const urlList = [];

  const addUrl = (loc, priority = '0.7', changefreq = 'weekly', lastmod = null) => {
    const normalizedLoc = loc === `${baseUrl}/` ? loc : loc.replace(/\/+$/, '');
    if (!seenUrls.has(normalizedLoc)) {
      seenUrls.add(normalizedLoc);
      urlList.push(normalizedLoc);
      entries.push(urlEntry(normalizedLoc, priority, changefreq, lastmod));
    }
  };

  // 1. Static Routes
  for (const r of STATIC_ROUTES) {
    addUrl(`${baseUrl}${r.path}`, r.priority, r.changefreq);
  }

  // 2. Upcoming Exams
  const examSlugs = getUpcomingExamSlugs();
  for (const slug of examSlugs) {
    addUrl(`${baseUrl}/upcoming-exams/${slug}`, '0.8', 'daily');
  }

  // 3. Exam Series
  try {
    const series = await ExamSeries.findAll({ attributes: ['slug', 'updatedAt'] });
    for (const s of series) {
      if (s.slug) {
        const lastmod = s.updatedAt ? new Date(s.updatedAt).toISOString().split('T')[0] : null;
        addUrl(`${baseUrl}/exam-series/${s.slug}`, '0.8', 'weekly', lastmod);
      }
    }
  } catch (err) {
    console.warn('[Sitemap] ExamSeries query failed:', err.message);
  }

  // 4. Video Series
  try {
    const vSeries = await VideoSeries.findAll({ attributes: ['slug', 'updatedAt'] });
    for (const s of vSeries) {
      if (s.slug) {
        const lastmod = s.updatedAt ? new Date(s.updatedAt).toISOString().split('T')[0] : null;
        addUrl(`${baseUrl}/video-series/${s.slug}`, '0.7', 'weekly', lastmod);
      }
    }
  } catch (err) {
    console.warn('[Sitemap] VideoSeries query failed:', err.message);
  }

  // 5. Courses
  try {
    const courses = await Course.findAll({ where: { isPublished: true }, attributes: ['slug', 'updatedAt'] });
    for (const c of courses) {
      if (c.slug) {
        const lastmod = c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : null;
        addUrl(`${baseUrl}/c/${c.slug}`, '0.8', 'weekly', lastmod);
      }
    }
  } catch (err) {
    console.warn('[Sitemap] Course query failed:', err.message);
  }

  // 6. Institutes
  try {
    const institutes = await Institute.findAll({ where: { status: 'approved' }, attributes: ['slug', 'updatedAt'] });
    for (const inst of institutes) {
      if (inst.slug) {
        const lastmod = inst.updatedAt ? new Date(inst.updatedAt).toISOString().split('T')[0] : null;
        addUrl(`${baseUrl}/i/${inst.slug}`, '0.7', 'monthly', lastmod);
      }
    }
  } catch (err) {
    console.warn('[Sitemap] Institute query failed:', err.message);
  }

  // 7. Olympiads
  try {
    const olympiads = await Olympiad.findAll({ attributes: ['slug', 'id', 'updatedAt'] });
    for (const o of olympiads) {
      const slugOrId = o.slug || o.id;
      if (slugOrId) {
        const lastmod = o.updatedAt ? new Date(o.updatedAt).toISOString().split('T')[0] : null;
        addUrl(`${baseUrl}/olympiad/${slugOrId}`, '0.8', 'daily', lastmod);
      }
    }
  } catch (err) {
    console.warn('[Sitemap] Olympiad query failed:', err.message);
  }

  // 8. E-Books
  try {
    const ebooks = await EBook.findAll({ where: { isActive: true }, attributes: ['slug', 'updatedAt'] });
    for (const eb of ebooks) {
      if (eb.slug) {
        const lastmod = eb.updatedAt ? new Date(eb.updatedAt).toISOString().split('T')[0] : null;
        addUrl(`${baseUrl}/ebooks/${eb.slug}`, '0.7', 'weekly', lastmod);
      }
    }
  } catch (err) {
    console.warn('[Sitemap] EBook query failed:', err.message);
  }

  // 9. Blog Posts
  try {
    const posts = await BlogPost.findAll({ where: { isPublished: true }, attributes: ['slug', 'updatedAt'] });
    for (const p of posts) {
      if (p.slug) {
        const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : null;
        addUrl(`${baseUrl}/blog/${p.slug}`, '0.7', 'weekly', lastmod);
      }
    }
  } catch (err) {
    console.warn('[Sitemap] BlogPost query failed:', err.message);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries.join('\n')}
</urlset>
`;

  return { xml, urlList, baseUrl };
}

function writeSitemapFiles(xmlContent) {
  const written = [];
  const publicPath = path.resolve(__dirname, '../../../client/public/sitemap.xml');
  const distPath   = path.resolve(__dirname, '../../../client/dist/sitemap.xml');

  // 1. Write to client/public/sitemap.xml
  try {
    const publicDir = path.dirname(publicPath);
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(publicPath, xmlContent, 'utf8');
    written.push(publicPath);
  } catch (e) {
    console.warn('[Sitemap] Failed to write public sitemap:', e.message);
  }

  // 2. Write to client/dist/sitemap.xml if dist exists
  try {
    const distDir = path.dirname(distPath);
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(distPath, xmlContent, 'utf8');
      written.push(distPath);
    }
  } catch (e) {
    console.warn('[Sitemap] Failed to write dist sitemap:', e.message);
  }

  return written;
}

async function recreateSitemap(baseUrlOverride) {
  const { xml, urlList, baseUrl } = await generateSitemapXml(baseUrlOverride);
  const writtenFiles = writeSitemapFiles(xml);

  const meta = {
    lastGeneratedAt: new Date().toISOString(),
    urlCount: urlList.length,
    baseUrl,
    filesWritten: writtenFiles.length,
  };

  // Persist to SiteSettings
  try {
    const [row, created] = await SiteSettings.findOrCreate({
      where: { key: 'sitemap_info' },
      defaults: { value: JSON.stringify(meta) },
    });
    if (!created) {
      row.value = JSON.stringify(meta);
      await row.save();
    }
  } catch (err) {
    console.warn('[Sitemap] Failed to save sitemap_info in SiteSettings:', err.message);
  }

  return {
    success: true,
    message: `Sitemap successfully recreated with ${urlList.length} URLs`,
    data: {
      ...meta,
      sampleUrls: urlList.slice(0, 10),
    }
  };
}

async function getSitemapInfo() {
  let meta = null;
  try {
    const row = await SiteSettings.findOne({ where: { key: 'sitemap_info' } });
    if (row && row.value) {
      meta = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    }
  } catch (e) {
    console.warn('[Sitemap] Error fetching sitemap_info:', e.message);
  }

  // If no DB record, inspect public/sitemap.xml file
  const publicPath = path.resolve(__dirname, '../../../client/public/sitemap.xml');
  let fileStats = null;
  let fileUrlCount = 0;
  if (fs.existsSync(publicPath)) {
    try {
      const stats = fs.statSync(publicPath);
      fileStats = {
        mtime: stats.mtime,
        size: stats.size,
      };
      const content = fs.readFileSync(publicPath, 'utf8');
      fileUrlCount = (content.match(/<url>/g) || []).length;
    } catch {}
  }

  const rawBase = process.env.CLIENT_URL || 'https://abhyo.com';
  const baseUrl = rawBase.split(',')[0].trim().replace(/\/+$/, '');

  return {
    success: true,
    data: {
      lastGeneratedAt: meta?.lastGeneratedAt || fileStats?.mtime?.toISOString() || null,
      urlCount: meta?.urlCount || fileUrlCount || 0,
      baseUrl: meta?.baseUrl || baseUrl,
      sitemapUrl: `${baseUrl}/sitemap.xml`,
      robotsUrl: `${baseUrl}/robots.txt`,
      fileExists: !!fileStats,
      fileSize: fileStats?.size || 0,
    }
  };
}

module.exports = {
  generateSitemapXml,
  writeSitemapFiles,
  recreateSitemap,
  getSitemapInfo,
};

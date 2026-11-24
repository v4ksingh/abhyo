const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

/**
 * Escapes unsafe HTML characters to prevent XSS / broken layout.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats date string to "DD Month YYYY" (e.g. "01 November 2026")
 */
function formatLastDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Formats qualification for concise card display while preventing overflow.
 */
function formatQualification(qual) {
  if (!qual) return null;
  let raw = '';
  if (Array.isArray(qual)) {
    if (qual.length === 0) return null;
    raw = String(qual[0]).trim();
  } else if (typeof qual === 'string') {
    raw = qual.trim();
  }
  if (!raw) return null;

  // Extract clean primary qualification
  const lower = raw.toLowerCase();
  if (lower.startsWith('graduation') || lower.includes('bachelor') || lower.includes('graduate')) {
    return 'Graduation';
  }
  if (lower.includes('post graduation') || lower.includes('master')) {
    return 'Post Graduation';
  }
  if (lower.includes('10th pass') || lower.includes('matriculation') || lower.includes('10th standard')) {
    return '10th Pass';
  }
  if (lower.includes('12th pass') || lower.includes('intermediate') || lower.includes('10+2') || lower.includes('12th standard')) {
    return '12th Pass';
  }
  if (lower.includes('b.e') || lower.includes('b.tech') || lower.includes('engineering')) {
    return 'B.E. / B.Tech';
  }
  if (lower.includes('diploma')) {
    return 'Diploma';
  }
  if (lower.includes('iti')) {
    return 'ITI';
  }

  // Fallback: If <= 24 characters, show as is, otherwise truncate cleanly
  if (raw.length <= 24) return raw;
  return raw.slice(0, 22).trim() + '...';
}

/**
 * Extracts or detects the recruitment year
 */
function extractYear(job) {
  // Check title for 4-digit year 202x
  if (job.title) {
    const match = job.title.match(/\b(202\d)\b/);
    if (match) return match[1];
  }
  if (job.shortName) {
    const match = job.shortName.match(/\b(202\d)\b/);
    if (match) return match[1];
  }
  if (job.applicationLastDate) {
    const d = new Date(job.applicationLastDate);
    if (!isNaN(d.getTime())) return String(d.getFullYear());
  }
  if (job.applicationStartDate) {
    const d = new Date(job.applicationStartDate);
    if (!isNaN(d.getTime())) return String(d.getFullYear());
  }
  return String(new Date().getFullYear());
}

/**
 * Calculates adaptive font size based on title length
 */
function getTitleFontSize(title) {
  const len = (title || '').length;
  if (len <= 35) return '46px';
  if (len <= 55) return '38px';
  if (len <= 75) return '32px';
  return '28px';
}

/**
 * Loads Abhyo logo as base64 data URL
 */
function getAbhyoLogoDataUrl() {
  const assetPaths = [
    path.join(__dirname, '../../assets/abhyo-logo.png'),
    path.join(__dirname, '../../../client/public/logo.png'),
    path.join(__dirname, '../../uploads/logo.png'),
  ];

  for (const p of assetPaths) {
    if (fs.existsSync(p)) {
      const buffer = fs.readFileSync(p);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
  }

  // Fallback to placeholder if file cannot be found
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><text y="28" font-size="28" font-weight="bold" fill="%232563eb">abhyo</text></svg>';
}

/**
 * Generates dynamic thumbnail HTML from template
 */
function renderThumbnailHtml(job) {
  const templatePath = path.join(__dirname, '../../templates/government-job-thumbnail.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Thumbnail template not found at ${templatePath}`);
  }

  let html = fs.readFileSync(templatePath, 'utf8');

  // 1. Logo
  const logoDataUrl = getAbhyoLogoDataUrl();
  html = html.replace('{{ABHYO_LOGO_SRC}}', logoDataUrl);

  // 2. Year
  const year = extractYear(job);
  html = html.replace('{{YEAR}}', escapeHtml(year));

  // 3. Category badge
  if (job.category && String(job.category).trim()) {
    html = html.replace(
      '{{CATEGORY_HTML}}',
      `<div class="badge-category">${escapeHtml(job.category)}</div>`
    );
  } else {
    html = html.replace('{{CATEGORY_HTML}}', '');
  }

  // 4. Organization Banner
  if (job.organization && String(job.organization).trim()) {
    html = html.replace(
      '{{ORGANIZATION_HTML}}',
      `<div class="org-banner">
        <span class="org-icon">🏛️</span>
        <span class="org-text">${escapeHtml(job.organization)}</span>
      </div>`
    );
  } else {
    html = html.replace('{{ORGANIZATION_HTML}}', '');
  }

  // 5. Title & Adaptive Font Size
  // If title has a trailing " - Apply Online for X Posts", keep shortName if available for cleaner layout
  const rawTitle = job.shortName || job.title || 'Government Job Notification';
  const displayTitle = escapeHtml(rawTitle);
  const fontSize = getTitleFontSize(rawTitle);

  html = html.replace('{{TITLE}}', displayTitle);
  html = html.replace('{{TITLE_FONT_SIZE}}', fontSize);

  // 6. Total Vacancies Card
  const vacanciesNum = Number(job.totalVacancies);
  if (vacanciesNum && vacanciesNum > 0) {
    const formattedVacancies = vacanciesNum.toLocaleString();
    html = html.replace(
      '{{VACANCIES_CARD_HTML}}',
      `<div class="info-card info-card-vacancies">
        <div class="card-top">
          <div class="card-icon icon-vacancies">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span class="card-label">Total Vacancies</span>
        </div>
        <div class="card-value val-vacancies">${escapeHtml(formattedVacancies)}</div>
      </div>`
    );
  } else {
    html = html.replace('{{VACANCIES_CARD_HTML}}', '');
  }

  // 7. Qualification Card
  const formattedQual = formatQualification(job.qualification);
  if (formattedQual) {
    html = html.replace(
      '{{QUALIFICATION_CARD_HTML}}',
      `<div class="info-card info-card-qualification">
        <div class="card-top">
          <div class="card-icon icon-qualification">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <span class="card-label">Qualification</span>
        </div>
        <div class="card-value val-qualification">${escapeHtml(formattedQual)}</div>
      </div>`
    );
  } else {
    html = html.replace('{{QUALIFICATION_CARD_HTML}}', '');
  }

  // 8. Application Last Date Card
  const formattedDate = formatLastDate(job.applicationLastDate);
  if (formattedDate) {
    html = html.replace(
      '{{LAST_DATE_CARD_HTML}}',
      `<div class="info-card info-card-lastdate">
        <div class="card-top">
          <div class="card-icon icon-lastdate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span class="card-label">Last Date to Apply</span>
        </div>
        <div class="card-value val-lastdate">${escapeHtml(formattedDate)}</div>
      </div>`
    );
  } else {
    html = html.replace('{{LAST_DATE_CARD_HTML}}', '');
  }

  // 9. Application Mode Card
  if (job.applicationMode && String(job.applicationMode).trim()) {
    html = html.replace(
      '{{APPLICATION_MODE_CARD_HTML}}',
      `<div class="info-card info-card-mode">
        <div class="card-top">
          <div class="card-icon icon-mode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <span class="card-label">Application Mode</span>
        </div>
        <div class="card-value val-mode">${escapeHtml(job.applicationMode)}</div>
      </div>`
    );
  } else {
    html = html.replace('{{APPLICATION_MODE_CARD_HTML}}', '');
  }

  return html;
}

/**
 * Launches a Playwright browser instance with appropriate fallbacks
 */
async function launchBrowser() {
  // Try launching Chrome channel first (fastest and pre-installed on host)
  try {
    return await playwright.chromium.launch({
      channel: 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (errChrome) {
    // Fallback to msedge channel
    try {
      return await playwright.chromium.launch({
        channel: 'msedge',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    } catch (errEdge) {
      // Fallback to default bundled chromium
      return await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }
  }
}

/**
 * Generates a 1200x630 PNG thumbnail for a given job and saves it to disk.
 * 
 * @param {Object} job - GovernmentJob instance or plain object
 * @param {Object} [options] - Optional custom options
 * @returns {Promise<{ filePath: string, imageUrl: string, filename: string }>}
 */
async function generateJobThumbnail(job, options = {}) {
  if (!job) {
    throw new Error('A valid GovernmentJob object is required for thumbnail generation.');
  }

  const plainJob = typeof job.toJSON === 'function' ? job.toJSON() : job;

  // 1. Populate the HTML template
  const populatedHtml = renderThumbnailHtml(plainJob);

  // 2. Ensure destination directory exists
  const uploadDir = options.outputDir || path.join(__dirname, '../../uploads/thumbnails');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = options.filename || `job-thumb-${plainJob.slug || plainJob.id || Date.now()}-${Date.now()}.png`;
  const filePath = path.join(uploadDir, filename);

  // 3. Render 1200x630 PNG using Playwright
  let browser = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1, // Clean 1:1 pixel rendering
    });

    await page.setContent(populatedHtml, {
      waitUntil: 'networkidle',
    });

    // Wait for fonts to finish loading
    try {
      await page.evaluateHandle('document.fonts.ready');
    } catch {
      // Non-fatal if font loading check is not supported
    }

    // Capture screenshot of the exact 1200x630 canvas
    await page.screenshot({
      path: filePath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    await page.close();
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  // 4. Return URL
  const imageUrl = `/uploads/thumbnails/${filename}`;

  return {
    filePath,
    imageUrl,
    filename,
  };
}

module.exports = {
  generateJobThumbnail,
  renderThumbnailHtml,
  formatLastDate,
  formatQualification,
  extractYear,
  getTitleFontSize,
};


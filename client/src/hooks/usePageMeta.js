/**
 * usePageMeta — sets document.title + meta description + canonical URL
 * per-page without any extra npm packages.
 *
 * Usage:
 *   usePageMeta({
 *     title: 'Free Mock Tests for SSC, UPSC – Abhyo',
 *     description: 'Practice with 500+ mock tests...',
 *     canonical: '/tests',
 *   });
 */

import { useEffect } from 'react';

const SITE_NAME = 'Abhyo';
const BASE_URL  = 'https://abhyo.com';
const DEFAULT_IMAGE = `${BASE_URL}/abhyo-hero.png`;

export default function usePageMeta({
  title,
  description,
  canonical,
  image,
  type = 'website',
  noindex = false,
} = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Practice. Improve. Achieve.`;
    const fullDesc  = description || 'Abhyo empowers students and coaching institutes with smart mock tests, detailed analytics, and real-time leaderboards for SSC, Banking, UPSC, Railway exams.';
    const canonUrl  = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
    const ogImage   = image || DEFAULT_IMAGE;

    // ── Title ──────────────────────────────────────────────────
    document.title = fullTitle;

    // ── Helper: upsert a <meta> tag ────────────────────────────
    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrVal] = attr.split('=').map(s => s.replace(/"/g, ''));
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // ── Standard meta ──────────────────────────────────────────
    setMeta('meta[name="description"]', 'name="description"', fullDesc);

    if (noindex) {
      setMeta('meta[name="robots"]', 'name="robots"', 'noindex,nofollow');
    } else {
      setMeta('meta[name="robots"]', 'name="robots"', 'index,follow');
    }

    // ── Canonical ──────────────────────────────────────────────
    setLink('canonical', canonUrl);

    // ── Open Graph ─────────────────────────────────────────────
    setMeta('meta[property="og:title"]',       'property="og:title"',       fullTitle);
    setMeta('meta[property="og:description"]', 'property="og:description"', fullDesc);
    setMeta('meta[property="og:url"]',         'property="og:url"',         canonUrl);
    setMeta('meta[property="og:image"]',       'property="og:image"',       ogImage);
    setMeta('meta[property="og:type"]',        'property="og:type"',        type);
    setMeta('meta[property="og:site_name"]',   'property="og:site_name"',   SITE_NAME);

    // ── Twitter Card ───────────────────────────────────────────
    setMeta('meta[name="twitter:card"]',        'name="twitter:card"',        'summary_large_image');
    setMeta('meta[name="twitter:title"]',       'name="twitter:title"',       fullTitle);
    setMeta('meta[name="twitter:description"]', 'name="twitter:description"', fullDesc);
    setMeta('meta[name="twitter:image"]',       'name="twitter:image"',       ogImage);
    setMeta('meta[name="twitter:site"]',        'name="twitter:site"',        '@AbhyoApp');
  }, [title, description, canonical, image, type, noindex]);
}

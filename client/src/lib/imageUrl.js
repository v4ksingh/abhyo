/**
 * Shared image URL helper.
 * Uses VITE_API_URL to construct absolute paths in production,
 * falling back to empty string (relative) for local dev proxy.
 */
const API_URL = import.meta.env.VITE_API_URL || '';
export const SERVER_URL = API_URL.replace(/\/api$/, '');

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;           // already absolute (CDN, etc.)
  
  // Ensure path starts with /uploads/
  const cleanPath = path.startsWith('/uploads/') ? path : `/uploads/${path}`;
  
  return `${SERVER_URL}${cleanPath}`;
}

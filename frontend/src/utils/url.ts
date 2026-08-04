/**
 * Utility to build full accessible URLs for uploaded files (logos, photos, resumes)
 * regardless of whether they are hosted on Cloudinary, Railway backend, or local dev.
 */
export function getMediaUrl(url?: string): string {
  if (!url) return '';

  // Handle absolute URLs (e.g., Cloudinary or full HTTP(S) links)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // If legacy seed or test data points to localhost:5000, rewrite to current API base host
    if (url.includes('localhost:5000') || url.includes('127.0.0.1:5000')) {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '';
      const serverBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, '');
      return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):5000/, serverBaseUrl);
    }
    return url;
  }

  // Handle relative upload paths (e.g., /uploads/logos/logo.png or uploads/...)
  const apiBaseUrl = import.meta.env.VITE_API_URL || '';
  const serverBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${serverBaseUrl}${cleanPath}`;
}

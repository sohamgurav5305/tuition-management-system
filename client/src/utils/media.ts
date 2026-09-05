/**
 * Universal Media & File URL Resolver for Tuition Management System
 * Automatically resolves relative storage paths (/uploads/...) to the live backend server origin.
 */

export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Already absolute or embedded
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Derive live backend server host
  const apiEnv = ((import.meta as any).env?.VITE_API_URL || '').trim();
  let backendOrigin = 'https://tuition-management-api-s1ab.onrender.com';

  if (apiEnv && apiEnv !== '/api') {
    try {
      const parsed = new URL(apiEnv);
      backendOrigin = parsed.origin;
    } catch {
      backendOrigin = apiEnv.replace(/\/api\/?$/, '');
    }
  }

  // Normalize path
  let cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (!cleanPath.startsWith('/uploads/')) {
    cleanPath = `/uploads${cleanPath}`;
  }

  if (backendOrigin) {
    return `${backendOrigin}${cleanPath}`;
  }

  return cleanPath;
}

/**
 * Downloads a remote file reliably by opening or creating a download link
 */
export async function downloadMediaFile(url: string, filename?: string): Promise<void> {
  const resolvedUrl = getMediaUrl(url);
  if (!resolvedUrl) return;

  try {
    const response = await fetch(resolvedUrl);
    if (!response.ok) throw new Error('Network response not ok');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || resolvedUrl.split('/').pop() || 'downloaded-file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // Fallback direct window open
    window.open(resolvedUrl, '_blank');
  }
}

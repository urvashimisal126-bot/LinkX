// ============================================================
// SHA-256 hashing via Web Crypto API (offline, no CDN)
// ============================================================

/**
 * Hash a File or ArrayBuffer with SHA-256.
 * Returns a lowercase hex string.
 */
export async function hashFile(input: File | ArrayBuffer): Promise<string> {
  const buffer = input instanceof ArrayBuffer ? input : await input.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(digest);
}

/**
 * Hash a string (for audit chain entries).
 */
export async function hashString(s: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(s);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(digest);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Truncate a hash for display: first 8 + … + last 4 chars.
 */
export function truncateHash(hash: string, prefixLen = 8, suffixLen = 4): string {
  if (hash.length <= prefixLen + suffixLen + 3) return hash;
  return `${hash.slice(0, prefixLen)}…${hash.slice(-suffixLen)}`;
}

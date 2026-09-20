// ============================================================
// Formatting utilities for LinkX UI
// ============================================================

/** Format INR amount with Indian grouping (₹1,23,456) */
const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
export const fmtINR = (n: number): string => inrFmt.format(n);

/** Format a plain INR number without symbol, with Indian grouping */
const inrNumFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const fmtINRNum = (n: number): string => inrNumFmt.format(n);

/** Format an ISO string as 24-hour IST time: DD MMM YYYY HH:MM:SS */
export function fmtIST(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '');
}

/** Format as HH:MM:SS IST only (for timeline) */
export function fmtTimeIST(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Format as DD MMM YYYY */
export function fmtDateIST(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Relative time: "+4m 12s from first debit" */
export function fmtRelTime(isoEvent: string, isoBase: string): string {
  const diffMs = new Date(isoEvent).getTime() - new Date(isoBase).getTime();
  const sign = diffMs < 0 ? '−' : '+';
  const abs = Math.abs(diffMs);
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const s = Math.floor((abs % 60_000) / 1_000);
  if (h > 0) return `${sign}${h}h ${m}m`;
  if (m > 0) return `${sign}${m}m ${s}s`;
  return `${sign}${s}s`;
}

/** "37 minutes ago", "4 minutes ago" etc. */
export function fmtAgo(isoEvent: string, isoNow: string): string {
  const diffMs = new Date(isoNow).getTime() - new Date(isoEvent).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  return `${h} hour${h === 1 ? '' : 's'} ago`;
}

/**
 * Truncate a hash for display (8 chars … 4 chars).
 */
export function fmtHash(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

/** File size in human-readable form */
export function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Duration in seconds → human readable */
export function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

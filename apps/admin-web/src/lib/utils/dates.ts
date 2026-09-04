/**
 * Date and freshness formatting utilities.
 */

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getFreshnessBadge(isoString: string | null | undefined, liveMaxMinutes = 180): {
  label: string;
  status: 'fresh' | 'stale' | 'unknown';
  minutesAgo: number;
} {
  if (!isoString) return { label: 'Unknown', status: 'unknown', minutesAgo: 0 };
  try {
    const observed = new Date(isoString).getTime();
    if (isNaN(observed)) return { label: 'Unknown', status: 'unknown', minutesAgo: 0 };
    const now = Date.now();
    const diffMs = now - observed;
    const minutesAgo = Math.floor(diffMs / (1000 * 60));
    if (minutesAgo < 0) {
      return { label: 'Current', status: 'fresh', minutesAgo: 0 };
    }
    if (minutesAgo <= liveMaxMinutes) {
      return { label: `${minutesAgo}m ago (Fresh)`, status: 'fresh', minutesAgo };
    }
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) {
      return { label: `${hoursAgo}h ago (Delayed)`, status: 'stale', minutesAgo };
    }
    const daysAgo = Math.floor(hoursAgo / 24);
    return { label: `${daysAgo}d ago (Stale)`, status: 'stale', minutesAgo };
  } catch {
    return { label: 'Unknown', status: 'unknown', minutesAgo: 0 };
  }
}

/**
 * Indian Standard Time (IST / Asia/Kolkata) Date & Time Utilities
 * Guaranteed exact timezone conversion without local device clock distortion.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns formatted time in IST, e.g. "08:00 PM IST" or "08:00 PM"
 */
export function formatISTTime(timestampOrDate?: number | string | Date, includeSuffix = true): string {
  if (!timestampOrDate) return '—';
  try {
    const d = typeof timestampOrDate === 'number' || typeof timestampOrDate === 'string'
      ? new Date(timestampOrDate)
      : timestampOrDate;

    if (isNaN(d.getTime())) return String(timestampOrDate);

    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);

    return includeSuffix ? `${formatted} IST` : formatted;
  } catch {
    return '—';
  }
}

/**
 * Returns short formatted time in IST, e.g. "08:00 PM"
 */
export function formatISTTimeShort(timestampOrDate?: number | string | Date): string {
  if (!timestampOrDate) return '—';
  try {
    const d = typeof timestampOrDate === 'number' || typeof timestampOrDate === 'string'
      ? new Date(timestampOrDate)
      : timestampOrDate;

    if (isNaN(d.getTime())) return String(timestampOrDate);

    return new Intl.DateTimeFormat('en-US', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Returns formatted date in IST as YYYY-MM-DD
 */
export function formatISTDate(timestampOrDate?: number | string | Date): string {
  try {
    const d = !timestampOrDate
      ? new Date()
      : typeof timestampOrDate === 'number' || typeof timestampOrDate === 'string'
      ? new Date(timestampOrDate)
      : timestampOrDate;

    if (isNaN(d.getTime())) return '';

    return new Intl.DateTimeFormat('en-CA', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

/**
 * Returns human-readable date in IST, e.g. "Sep 23, 2026"
 */
export function formatISTDateReadable(timestampOrDate?: number | string | Date): string {
  if (!timestampOrDate) return '—';
  try {
    const d = typeof timestampOrDate === 'number' || typeof timestampOrDate === 'string'
      ? new Date(timestampOrDate)
      : timestampOrDate;

    if (isNaN(d.getTime())) return String(timestampOrDate);

    return new Intl.DateTimeFormat('en-US', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Returns full Date & Time in IST, e.g. "Sep 23, 2026 • 08:00:00 PM IST"
 */
export function formatISTDateTime(timestampOrDate?: number | string | Date): string {
  if (!timestampOrDate) return '—';
  try {
    const d = typeof timestampOrDate === 'number' || typeof timestampOrDate === 'string'
      ? new Date(timestampOrDate)
      : timestampOrDate;

    if (isNaN(d.getTime())) return String(timestampOrDate);

    const datePart = new Intl.DateTimeFormat('en-US', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);

    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);

    return `${datePart} • ${timePart} IST`;
  } catch {
    return '—';
  }
}

/**
 * Returns current Date in IST
 */
export function getTodayIST(): { dateStr: string; year: number; month: number; day: number; formatted: string } {
  const now = new Date();
  const dateStr = formatISTDate(now);
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  return {
    dateStr,
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10) - 1, // 0-indexed month
    day: parseInt(dayStr, 10),
    formatted: formatISTDateReadable(now),
  };
}

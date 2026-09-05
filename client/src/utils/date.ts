/**
 * Universal Date Formatter for Tuition Management System
 * Enforces DD/MM/YYYY standard across the entire application.
 */

export function formatDate(value: string | Date | number | null | undefined): string {
  if (!value) return '—';

  try {
    // If it's a simple YYYY-MM-DD format, parse without timezone shifts
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [y, m, d] = trimmed.split('-');
        return `${d}/${m}/${y}`;
      }
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
        const [y, m, d] = trimmed.split('/');
        return `${d}/${m}/${y}`;
      }
    }

    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return String(value);
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return String(value || '—');
  }
}

export function formatDateTime(value: string | Date | number | null | undefined): string {
  if (!value) return '—';

  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return formatDate(value);
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const strHours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
  } catch {
    return formatDate(value);
  }
}

export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string {
  if (!start && !end) return '—';
  if (!start) return formatDate(end);
  if (!end) return formatDate(start);
  return `${formatDate(start)} to ${formatDate(end)}`;
}

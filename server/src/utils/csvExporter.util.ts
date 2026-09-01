export function jsonToCsv(data: Record<string, any>[], columns: { key: string; label: string }[]): string {
  if (!data || data.length === 0) {
    return columns.map(c => `"${c.label}"`).join(',') + '\n';
  }

  const headerLine = columns.map(c => `"${c.label}"`).join(',');
  const rowLines = data.map(row => {
    return columns.map(col => {
      let val = row[col.key];
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });

  return [headerLine, ...rowLines].join('\n');
}

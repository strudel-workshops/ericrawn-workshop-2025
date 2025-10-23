/**
 * Converts an array of objects to CSV format
 */
export const convertToCSV = (data: any[], columns?: string[]): string => {
  if (!data || data.length === 0) return '';

  // Get column headers - use provided columns or extract from first object
  const headers = columns || Object.keys(data[0]);

  // Create header row
  const headerRow = headers.map(escapeCSVValue).join(',');

  // Create data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        return escapeCSVValue(value);
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Escapes a value for CSV format
 */
const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Triggers a download of CSV data
 */
export const downloadCSV = (
  data: any[],
  filename: string,
  columns?: string[]
) => {
  const csv = convertToCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

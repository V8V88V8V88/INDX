export type CsvColumn<T> = [header: string, value: (row: T) => string | number | boolean | null | undefined];

function cell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map(([header]) => cell(header)).join(",")];
  for (const row of rows) lines.push(columns.map(([, value]) => cell(value(row))).join(","));
  return lines.join("\r\n") + "\r\n";
}

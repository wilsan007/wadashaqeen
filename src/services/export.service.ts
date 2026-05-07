export class ExportService {
  static toCSV<T extends Record<string, unknown>>(data: T[], filename = 'export'): void {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    ExportService.download(csv, `${filename}.csv`, 'text/csv');
  }

  static toJSON<T>(data: T[], filename = 'export'): void {
    const json = JSON.stringify(data, null, 2);
    ExportService.download(json, `${filename}.json`, 'application/json');
  }

  private static download(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

import type { Column } from '../types';
import { formatValue } from './formatter';

export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  columns: Column<T>[],
  filename: string = 'export.csv',
) => {
  const headers = columns.map((col) => {
    if (typeof col.title === 'string' || typeof col.title === 'number') return String(col.title);
    return col.key;
  });

  const rows = data.map((record) => {
    return columns.map((col) => {
      const val = record[col.key];
      const formatted = formatValue(val, col.type, col.format);

      // Escape for CSV
      const s = String(formatted);
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    });
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, 'text/csv;charset=utf-8;', filename);
};

export const exportToTSV = <T extends Record<string, any>>(
  data: T[],
  columns: Column<T>[],
  filename: string = 'export.tsv',
) => {
  const headers = columns.map((col) => {
    if (typeof col.title === 'string' || typeof col.title === 'number') return String(col.title);
    return col.key;
  });

  const rows = data.map((record) => {
    return columns.map((col) => {
      const val = record[col.key];
      const formatted = formatValue(val, col.type, col.format);
      return String(formatted).replace(/\t/g, ' '); // Avoid tabs in values
    });
  });

  const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
  downloadFile(tsvContent, 'text/tab-separated-values;charset=utf-8;', filename);
};

// Basic XLSX export via XMLSS format
export const exportToXLSX = <T extends Record<string, any>>(
  data: T[],
  columns: Column<T>[],
  filename: string = 'export.xlsx',
) => {
  // Since real XLSX is a zip of XMLs, we use a simple XML format that Excel understands
  let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
  xml += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
  xml += '<Worksheet ss:Name="Sheet1"><Table>';

  // Headers
  xml += '<Row>';
  columns.forEach((col) => {
    const title =
      typeof col.title === 'string' || typeof col.title === 'number' ? String(col.title) : col.key;
    xml += `<Cell><Data ss:Type="String">${title}</Data></Cell>`;
  });
  xml += '</Row>';

  // Data
  data.forEach((record) => {
    xml += '<Row>';
    columns.forEach((col) => {
      const val = record[col.key];
      const formatted = formatValue(val, col.type, col.format);
      const type = col.type === 'number' ? 'Number' : 'String';
      const cleanVal = String(formatted)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      xml += `<Cell><Data ss:Type="${type}">${cleanVal}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  xml += '</Table></Worksheet></Workbook>';

  downloadFile(xml, 'application/vnd.ms-excel', filename);
};

export const exportToPDF = <T extends Record<string, any>>(
  _data: T[],
  _columns: Column<T>[],
  _filename: string = 'export.pdf',
) => {
  // PDF export is complex without a library like jsPDF.
  // As a fallback for this library, we'll prompt a print or use a simple HTML window.
  console.warn('PDF export requires additional libraries. Fallback to print.');
  window.print();
};

const downloadFile = (content: string, type: string, filename: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

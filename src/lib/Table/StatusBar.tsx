import type { FC, CSSProperties } from 'react';
import type { Column, TableTheme } from '../types';

export interface StatusBarSettings {
  /** Show row count. default: true */
  showRowCount?: boolean;
  /** Show sum for numeric columns. default: false */
  showSum?: boolean;
  /** Show average for numeric columns. default: false */
  showAvg?: boolean;
  /** Show min for numeric columns. default: false */
  showMin?: boolean;
  /** Show max for numeric columns. default: false */
  showMax?: boolean;
  /** Show count of selected rows. default: true */
  showSelectedCount?: boolean;
  /** Custom status bar content (renders alongside built-in stats) */
  render?: (params: {
    rowCount: number;
    selectedCount: number;
    data: any[];
    columns: Column[];
  }) => React.ReactNode;
  style?: CSSProperties;
}

interface StatusBarProps {
  data: any[];
  columns: Column[];
  theme: TableTheme;
  settings: StatusBarSettings;
  selectedCount?: number;
  totalCount?: number;
}

function getNumericStats(data: any[], col: Column) {
  const vals = data
    .map((r) => {
      const v = parseFloat(r[col.key]);
      return isNaN(v) ? null : v;
    })
    .filter((v): v is number => v !== null);

  if (vals.length === 0) return null;
  return {
    sum: vals.reduce((a, b) => a + b, 0),
    avg: vals.reduce((a, b) => a + b, 0) / vals.length,
    min: Math.min(...vals),
    max: Math.max(...vals),
    count: vals.length,
  };
}

export const StatusBar: FC<StatusBarProps> = ({
  data,
  columns,
  theme,
  settings,
  selectedCount = 0,
  totalCount,
}) => {
  const borderColor = theme.tokens?.borderColor ?? '#e2e8f0';
  const textColor = theme.tokens?.textColor ?? '#1e293b';
  const bgColor = theme.tokens?.backgroundColor ?? '#fff';
  const fontSize = theme.tokens?.fontSize ?? '13px';
  const primaryColor = theme.tokens?.primaryColor ?? '#3b82f6';

  const numericCols = columns.filter((c) => c.type === 'number');
  const rowCount = totalCount ?? data.length;

  const fmt = (n: number) => {
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 12px',
        borderTop: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: '12px',
        fontSize,
        color: textColor,
        opacity: 0.75,
        ...settings.style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {settings.showRowCount !== false && (
          <span>
            Rows: <strong style={{ color: primaryColor }}>{rowCount}</strong>
          </span>
        )}
        {settings.showSelectedCount !== false && selectedCount > 0 && (
          <span>
            Selected: <strong style={{ color: primaryColor }}>{selectedCount}</strong>
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {numericCols.map((col) => {
          const stats = getNumericStats(data, col);
          if (!stats) return null;
          const colName = typeof col.title === 'string' ? col.title : col.key;
          const parts: string[] = [];
          if (settings.showSum) parts.push(`Σ ${fmt(stats.sum)}`);
          if (settings.showAvg) parts.push(`Avg ${fmt(stats.avg)}`);
          if (settings.showMin) parts.push(`Min ${fmt(stats.min)}`);
          if (settings.showMax) parts.push(`Max ${fmt(stats.max)}`);
          if (parts.length === 0) return null;
          return (
            <span key={col.key} style={{ opacity: 0.9 }}>
              <span style={{ opacity: 0.6 }}>{colName}: </span>
              {parts.join(' · ')}
            </span>
          );
        })}
        {settings.render?.({ rowCount, selectedCount, data, columns })}
      </div>
    </div>
  );
};

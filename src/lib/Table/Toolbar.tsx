import { useState, useRef, useEffect } from 'react';
import type { FC, ReactNode, CSSProperties } from 'react';
import type { TableTheme, Column, ToolbarSettings, ToolbarItem } from '../types';
import { exportToCSV, exportToTSV, exportToXLSX, exportToPDF } from '../core/export';

interface ToolbarProps<T = any> {
  data: T[];
  columns: Column<T>[];
  settings?: ToolbarSettings<T>;
  theme: TableTheme;
  onFilter?: (key: string, value: string) => void;
  filters?: Record<string, string>;
  onColumnsPanel?: () => void;
  onImport?: (data: T[]) => void;
}

const DEFAULT_ICONS: Record<string, ReactNode> = {
  download: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  search: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

export const Toolbar: FC<ToolbarProps> = ({
  data,
  columns,
  settings,
  theme,
  onFilter,
  filters = {},
  onColumnsPanel,
  onImport,
}) => {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!settings?.enabled) return null;

  const handleDownload = (type: 'csv' | 'xlsx' | 'pdf' | 'tsv') => {
    setDownloadOpen(false);
    switch (type) {
      case 'csv':
        exportToCSV(data, columns);
        break;
      case 'tsv':
        exportToTSV(data, columns);
        break;
      case 'xlsx':
        exportToXLSX(data, columns);
        break;
      case 'pdf':
        exportToPDF(data, columns);
        break;
    }
  };

  const handleImport = (file: File) => {
    if (!onImport) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;
        // Parse CSV/TSV — detect delimiter
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lines.length < 2) return;
        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const parseRow = (line: string) => {
          const cells: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else inQuotes = !inQuotes;
            } else if (ch === delimiter && !inQuotes) {
              cells.push(current);
              current = '';
            } else {
              current += ch;
            }
          }
          cells.push(current);
          return cells;
        };
        const headers = parseRow(lines[0]);
        const rows = lines.slice(1).map((line) => {
          const cells = parseRow(line);
          const row: Record<string, any> = {};
          headers.forEach((h, i) => {
            const val = cells[i] ?? '';
            const num = Number(val);
            row[h] = val !== '' && !isNaN(num) ? num : val;
          });
          return row;
        });
        onImport(rows as any[]);
      } catch (err) {
        console.error('Failed to parse import file:', err);
      }
    };
    reader.readAsText(file);
  };

  const items = settings.items ?? ['search', 'separator', 'download'];

  const toolbarStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: theme.tokens?.padding ?? '8px 12px',
    borderBottom:
      settings.position === 'top' ? `1px solid ${theme.tokens?.borderColor ?? '#e2e8f0'}` : 'none',
    borderTop:
      settings.position === 'bottom'
        ? `1px solid ${theme.tokens?.borderColor ?? '#e2e8f0'}`
        : 'none',
    backgroundColor: theme.tokens?.backgroundColor ?? '#fff',
    gap: '12px',
    flexWrap: 'wrap',
    ...theme.toolbar,
    ...settings.style,
  };

  const buttonStyle = (active?: boolean, customStyle?: CSSProperties): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: theme.tokens?.borderRadius ?? '4px',
    border: `1px solid ${active ? (theme.tokens?.primaryColor ?? '#3b82f6') : (theme.tokens?.borderColor ?? '#e2e8f0')}`,
    backgroundColor: active ? `${theme.tokens?.primaryColor ?? '#3b82f6'}15` : 'transparent',
    color: active
      ? (theme.tokens?.primaryColor ?? '#3b82f6')
      : (theme.tokens?.textColor ?? '#334155'),
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ...theme.toolbarButton,
    ...customStyle,
  });

  return (
    <div className={`tablez-toolbar ${settings.className ?? ''}`} style={toolbarStyle}>
      {items.map((item, idx) => {
        const isString = typeof item === 'string';
        const itemKey = isString ? item : item.key;

        // Separator
        if (itemKey === 'separator') {
          return (
            <div
              key={`sep-${idx}`}
              className="tablez-toolbar-separator"
              style={{
                width: '1px',
                height: '20px',
                backgroundColor: theme.tokens?.borderColor ?? '#e2e8f0',
                margin: '0 4px',
                ...(!isString ? item.style : {}),
              }}
            />
          );
        }

        // Search
        if (itemKey === 'search') {
          const config = isString ? {} : (item as Partial<ToolbarItem>);
          const isHidden =
            typeof config.hidden === 'function' ? config.hidden(data, columns) : !!config.hidden;
          if (isHidden) return null;

          return (
            <div
              key="search-box"
              className="tablez-toolbar-search"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                minWidth: '150px',
                maxWidth: '400px',
                ...config.style,
              }}
            >
              <span
                style={{ position: 'absolute', left: '10px', color: '#94a3b8', display: 'flex' }}
              >
                {config.icon ?? DEFAULT_ICONS.search}
              </span>
              <input
                type="text"
                placeholder={typeof config.label === 'string' ? config.label : 'Search...'}
                value={filters.global || ''}
                onChange={(e) => onFilter?.('global', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: theme.tokens?.borderRadius ?? '6px',
                  border: `1px solid ${theme.tokens?.borderColor ?? '#e2e8f0'}`,
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  ...theme.searchInput,
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = theme.tokens?.primaryColor ?? '#3b82f6')
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = theme.tokens?.borderColor ?? '#e2e8f0')
                }
              />
            </div>
          );
        }

        // Download
        if (itemKey === 'download') {
          const config = isString ? {} : (item as Partial<ToolbarItem>);
          const isHidden =
            typeof config.hidden === 'function' ? config.hidden(data, columns) : !!config.hidden;
          if (isHidden) return null;

          const downloadOptions = settings.downloadOptions ?? ['csv', 'xlsx', 'pdf', 'tsv'];
          return (
            <div
              key="download-dropdown"
              className="tablez-toolbar-download"
              style={{ position: 'relative' }}
              ref={downloadRef}
            >
              <button
                onClick={() => setDownloadOpen(!downloadOpen)}
                style={buttonStyle(downloadOpen, config.style)}
                className={config.className}
                {...(config.buttonProps ?? {})}
              >
                {config.icon ?? DEFAULT_ICONS.download}
                <span>{config.label ?? 'Download'}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    marginLeft: '2px',
                    transition: 'transform 0.2s',
                    transform: downloadOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {!!downloadOpen && (
                <div
                  className="tablez-toolbar-download-menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '6px',
                    backgroundColor: theme.menu?.backgroundColor ?? '#fff',
                    border: theme.menu?.border ?? '1px solid #e2e8f0',
                    borderRadius: theme.menu?.borderRadius ?? '8px',
                    boxShadow:
                      theme.menu?.boxShadow ??
                      '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    minWidth: '160px',
                    padding: '4px',
                    overflow: 'hidden',
                  }}
                >
                  {downloadOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleDownload(opt as any)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 12px',
                        textAlign: 'left',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '13px',
                        fontWeight: 500,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: theme.menuItem?.color ?? '#334155',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          theme.tokens?.rowHoverColor ?? '#f1f5f9')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Export as {opt.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Columns panel toggle
        if (itemKey === 'columns') {
          const config = isString ? {} : (item as Partial<ToolbarItem>);
          return (
            <button
              key="columns-panel"
              onClick={onColumnsPanel}
              style={buttonStyle(false, config.style as CSSProperties)}
              className={isString ? undefined : (item as Partial<ToolbarItem>).className}
              title="Show/hide columns"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>
                {isString ? 'Columns' : ((item as Partial<ToolbarItem>).label ?? 'Columns')}
              </span>
            </button>
          );
        }

        // Excel import
        if (itemKey === 'import') {
          const config = isString ? {} : (item as Partial<ToolbarItem>);
          return (
            <div key="import-btn" style={{ position: 'relative' }}>
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(file);
                  if (importInputRef.current) importInputRef.current.value = '';
                }}
              />
              <button
                onClick={() => importInputRef.current?.click()}
                style={buttonStyle(false, config.style as CSSProperties)}
                title="Import from Excel/CSV"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>
                  {isString ? 'Import' : ((item as Partial<ToolbarItem>).label ?? 'Import')}
                </span>
              </button>
            </div>
          );
        }

        // Custom item
        const customItem = item as ToolbarItem;
        const isHidden =
          typeof customItem.hidden === 'function'
            ? customItem.hidden(data, columns)
            : !!customItem.hidden;
        if (isHidden) return null;

        const isDisabled =
          typeof customItem.disabled === 'function'
            ? customItem.disabled(data, columns)
            : !!customItem.disabled;

        if (customItem.render) {
          return (
            <div key={customItem.key} style={customItem.style} className={customItem.className}>
              {customItem.render({ data, columns, filters, theme })}
            </div>
          );
        }

        return (
          <button
            key={customItem.key}
            disabled={isDisabled}
            onClick={() => customItem.onClick?.(data, columns)}
            className={customItem.className}
            style={{
              ...buttonStyle(false, customItem.style),
              opacity: isDisabled ? 0.5 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
            {...(customItem.buttonProps ?? {})}
          >
            {customItem.icon}
            {!!customItem.label && <span>{customItem.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

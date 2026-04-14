import type { FC, CSSProperties } from 'react';
import type { TableTheme } from '../types';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  theme: TableTheme;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  style?: CSSProperties;
}

export const Pagination: FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  theme,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  style,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, total);

  const borderColor = theme.tokens?.borderColor ?? '#e2e8f0';
  const primaryColor = theme.tokens?.primaryColor ?? '#3b82f6';
  const textColor = theme.tokens?.textColor ?? '#1e293b';
  const bgColor = theme.tokens?.backgroundColor ?? '#fff';
  const fontSize = theme.tokens?.fontSize ?? '13px';

  const btnStyle = (active: boolean, disabled: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    height: 28,
    padding: '0 6px',
    border: `1px solid ${active ? primaryColor : borderColor}`,
    borderRadius: '4px',
    backgroundColor: active ? primaryColor : bgColor,
    color: active ? '#fff' : disabled ? '#cbd5e1' : textColor,
    fontSize,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',
  });

  // Build page window
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderTop: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: '8px',
        fontSize,
        color: textColor,
        ...style,
      }}
    >
      {/* Left: row info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: textColor, opacity: 0.7 }}>
          {total === 0 ? 'No rows' : `${startRow}–${endRow} of ${total} rows`}
        </span>
        {!!onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            style={{
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize,
              backgroundColor: bgColor,
              color: textColor,
              cursor: 'pointer',
            }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Right: page buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* First */}
        <button
          style={btnStyle(false, page === 1)}
          onClick={() => page > 1 && onPageChange(1)}
          disabled={page === 1}
          title="First page"
        >
          «
        </button>
        {/* Prev */}
        <button
          style={btnStyle(false, page === 1)}
          onClick={() => page > 1 && onPageChange(page - 1)}
          disabled={page === 1}
          title="Previous page"
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span
              key={`ellipsis-${i}`}
              style={{ padding: '0 4px', color: textColor, opacity: 0.5 }}
            >
              …
            </span>
          ) : (
            <button key={p} style={btnStyle(p === page, false)} onClick={() => onPageChange(p)}>
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          style={btnStyle(false, page === totalPages)}
          onClick={() => page < totalPages && onPageChange(page + 1)}
          disabled={page === totalPages}
          title="Next page"
        >
          ›
        </button>
        {/* Last */}
        <button
          style={btnStyle(false, page === totalPages)}
          onClick={() => page < totalPages && onPageChange(totalPages)}
          disabled={page === totalPages}
          title="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
};

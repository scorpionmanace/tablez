import { useState, useRef, useEffect, memo, useCallback } from 'react';
import type { FC, CSSProperties, MouseEvent, KeyboardEvent, ChangeEvent } from 'react';
import type { Column, TableTheme } from '../types';
import { isImageResult } from '../core/formulas';
import { formatValue } from '../core/formatter';
import { Calendar } from '../components/Calendar';
import { Sparkline } from '../components/Sparkline';

interface CellProps<T> {
  record: T;
  column: Column<T>;
  theme: TableTheme;
  index: number;
  onEdit?: (record: T, key: string, value: any) => void;
  onContextMenu?: (record: T, column: Column<T>, e: MouseEvent) => void;
  onFocus?: (column: Column<T>) => void;
  stickyStyles?: CSSProperties;
  showColumnBorders?: boolean;
  rowReadOnly?: boolean;
  rowDisabled?: boolean;
  isTreeExpander?: boolean;
  treeDepth?: number;
  isExpanded?: boolean;
  hasChildren?: boolean;
  onToggleTree?: () => void;
  treeSettings?: any;
  // Range selection
  onCellMouseDown?: (e: MouseEvent) => void;
  onCellMouseEnter?: () => void;
  isInRange?: boolean;
  enableFillHandle?: boolean;
  onFillHandle?: () => void;
}

const CellInner = <T extends Record<string, any>>({
  record,
  column,
  theme,
  index,
  onEdit,
  onContextMenu,
  onFocus,
  stickyStyles,
  showColumnBorders,
  rowReadOnly,
  rowDisabled,
  isTreeExpander,
  treeDepth,
  isExpanded,
  hasChildren,
  onToggleTree,
  treeSettings,
  onCellMouseDown,
  onCellMouseEnter,
  isInRange = false,
  enableFillHandle = false,
  onFillHandle,
}: CellProps<T>) => {
  const value = record[column.key];
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<any>(value);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [cellRect, setCellRect] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [highlighted, setHighlighted] = useState(false);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevValueRef = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const tdRef = useRef<HTMLTableCellElement>(null);

  const isReadOnly =
    (rowReadOnly ?? false) ||
    (typeof column.readOnly === 'function' ? column.readOnly(record) : !!column.readOnly);
  const isDisabled =
    (rowDisabled ?? false) ||
    (typeof column.disabled === 'function' ? column.disabled(record) : !!column.disabled);

  const editable =
    !isReadOnly &&
    !isDisabled &&
    (typeof column.editable === 'function' ? column.editable(record) : !!column.editable);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Change highlighting — flash when value changes
  useEffect(() => {
    if (column.highlight && prevValueRef.current !== value && prevValueRef.current !== undefined) {
      setHighlighted(true);
      if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
      highlightTimeout.current = setTimeout(() => setHighlighted(false), 1000);
    }
    prevValueRef.current = value;
  }, [value, column.highlight]);

  useEffect(() => {
    return () => {
      if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
    };
  }, []);

  // Auto-open calendar on edit
  useEffect(() => {
    if (isEditing && (column.type === 'date' || column.type === 'datetime')) {
      setShowCalendar(true);
    }
  }, [isEditing, column.type]);

  const moveFocus = (direction: 'left' | 'right' | 'down') => {
    const currentCell = inputRef.current?.closest('td') ?? document.activeElement?.closest('td');
    if (!currentCell) return;

    let target: HTMLElement | null = null;

    if (direction === 'right') {
      target = currentCell.nextElementSibling as HTMLElement;
    } else if (direction === 'left') {
      target = currentCell.previousElementSibling as HTMLElement;
    } else if (direction === 'down') {
      const currentRow = currentCell.closest('tr');
      const nextRow = currentRow?.nextElementSibling;
      if (nextRow) {
        const idx = Array.from(currentRow?.children ?? []).indexOf(currentCell);
        if (idx !== -1) {
          target = nextRow.children[idx] as HTMLElement;
        }
      }
    }

    if (target) {
      target.focus();
    }
  };

  const commitEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      if (editValue !== value && onEdit) {
        let finalValue = editValue;
        if (column.type === 'number') {
          const num = parseFloat(String(editValue));
          finalValue = isNaN(num) ? 0 : num;
        }

        if (editValue instanceof Date) {
          if (!isNaN(editValue.getTime())) {
            finalValue = editValue.toISOString();
          } else {
            finalValue = value;
          }
        }

        onEdit(record, column.key, finalValue);
      }
    }
  };

  const handleDoubleClick = () => {
    if (editable) {
      const rect = tdRef.current?.getBoundingClientRect();
      if (rect) setCellRect({ top: rect.top, left: rect.left });
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    commitEdit();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
      moveFocus('down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit();
      moveFocus(e.shiftKey ? 'left' : 'right');
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  const handleTdKeyDown = (e: KeyboardEvent) => {
    if (!isEditing && editable) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsEditing(true);
        setEditValue(e.key);
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === 'F2') {
        setIsEditing(true);
        setEditValue(value);
        e.preventDefault();
      }
    }
  };

  const renderValue = () => {
    // Boolean type renders as checkbox
    if (column.type === 'boolean') {
      const checked = value === true || value === 'true' || value === 1;
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              column.align === 'center'
                ? 'center'
                : column.align === 'right'
                  ? 'flex-end'
                  : 'flex-start',
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            readOnly={!editable}
            onChange={() => {
              if (editable && onEdit) {
                onEdit(record, column.key, !checked);
              }
            }}
            style={{
              cursor: editable ? 'pointer' : 'default',
              accentColor: theme.tokens?.primaryColor ?? '#3b82f6',
              width: 14,
              height: 14,
            }}
          />
        </div>
      );
    }

    // Select type shows the label if options exist
    if (column.type === 'select' && column.options && !isEditing) {
      const opts = column.options.map((opt) =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt,
      );
      const match = opts.find((o) => o.value === value || String(o.value) === String(value));
      const displayVal = match
        ? match.label
        : column.render
          ? column.render(value, record, index)
          : formatValue(value, column.type as any, column.format);
      return displayVal;
    }

    const rawValue = column.render
      ? column.render(value, record, index)
      : formatValue(value, column.type, column.format);

    const content = isImageResult(value) ? (
      <img
        src={value.url}
        alt={value.alt ?? ''}
        style={{
          maxWidth: value.width ?? '100%',
          maxHeight: value.height ?? '100%',
          objectFit: 'contain',
        }}
      />
    ) : (
      rawValue
    );

    // Sparkline — renders if column.sparkline is set and value is a number array
    if (column.sparkline && Array.isArray(value)) {
      const sparkWidth = column.sparkline.width ?? (column.width ? column.width - 16 : 80);
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              column.align === 'center'
                ? 'center'
                : column.align === 'right'
                  ? 'flex-end'
                  : 'flex-start',
          }}
        >
          <Sparkline
            data={value as number[]}
            config={{ ...column.sparkline, width: sparkWidth }}
            primaryColor={theme.tokens?.primaryColor}
          />
        </div>
      );
    }

    if (isTreeExpander) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <div style={{ width: (treeDepth ?? 0) * (treeSettings?.indentSize ?? 20) }} />
          {hasChildren ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onToggleTree?.();
              }}
              style={{
                cursor: 'pointer',
                marginRight: '6px',
                display: 'flex',
                alignItems: 'center',
                transition: 'transform 0.2s',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                color: theme.tokens?.primaryColor ?? '#3b82f6',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          ) : (
            <span style={{ width: '20px' }} />
          )}
          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{content}</div>
        </div>
      );
    }

    return content;
  };

  const resolveOptions = () => {
    if (!column.options) return [];
    return column.options.map((opt) =>
      typeof opt === 'string' ? { label: opt, value: opt } : opt,
    );
  };

  const renderInput = () => {
    if (column.type === 'date' || column.type === 'datetime') {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <input
            ref={inputRef}
            value={
              editValue instanceof Date ? editValue.toLocaleDateString() : String(editValue ?? '')
            }
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
            onBlur={() => {
              setTimeout(() => {
                if (!document.activeElement?.closest('.tablez-calendar')) {
                  handleBlur();
                }
              }, 100);
            }}
            onKeyDown={handleKeyDown}
            onClick={() => setShowCalendar(true)}
            style={{
              width: '100%',
              height: '100%',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              ...theme.editInput,
              cursor: 'pointer',
            }}
          />
          {!!showCalendar && (
            <div className="tablez-calendar" onMouseDown={(e) => e.preventDefault()}>
              <Calendar
                value={(() => {
                  if (editValue instanceof Date) return editValue;
                  if (!editValue) return undefined;
                  const d = new Date(String(editValue));
                  return !isNaN(d.getTime()) ? d : undefined;
                })()}
                onChange={(date) => {
                  setEditValue(date);
                  setShowCalendar(false);
                }}
                theme={theme}
              />
            </div>
          )}
        </div>
      );
    }

    // Select / dropdown editor
    if (column.type === 'select') {
      const opts = resolveOptions();
      return (
        <select
          autoFocus
          value={String(editValue ?? '')}
          onChange={(e) => {
            const chosen = opts.find((o) => String(o.value) === e.target.value);
            setEditValue(chosen ? chosen.value : e.target.value);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: '100%',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            ...theme.editInput,
          }}
        >
          {opts.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Large text editor — textarea overlay
    if (column.type === 'largeText') {
      return (
        <div
          style={{
            position: 'fixed',
            top: cellRect.top,
            left: cellRect.left,
            zIndex: 9999,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <textarea
            autoFocus
            rows={6}
            value={String(editValue ?? '')}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditValue(value);
              } else if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                commitEdit();
              }
            }}
            style={{
              width: Math.max(column.width ?? 200, 300),
              minHeight: 120,
              fontSize: 'inherit',
              fontFamily: 'inherit',
              padding: '8px',
              border: `2px solid ${theme.tokens?.primaryColor ?? '#3b82f6'}`,
              borderRadius: '6px',
              resize: 'both',
              boxSizing: 'border-box',
              ...theme.editInput,
            }}
          />
        </div>
      );
    }

    return (
      <input
        ref={inputRef}
        type={column.type === 'number' ? 'number' : 'text'}
        value={String(editValue ?? '')}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          height: '100%',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          textAlign: column.type === 'number' ? 'right' : 'left',
          ...theme.editInput,
          ...column.style,
        }}
      />
    );
  };

  const tooltipText = column.tooltip
    ? typeof column.tooltip === 'function'
      ? column.tooltip(value, record)
      : column.tooltip
    : undefined;

  const handleMouseEnter = useCallback(() => {
    if (tooltipText) {
      const rect = tdRef.current?.getBoundingClientRect();
      if (rect) setTooltipPos({ left: rect.left, top: rect.bottom + 4 });
      tooltipTimeout.current = setTimeout(() => setTooltipVisible(true), 400);
    }
  }, [tooltipText]);

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setTooltipVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    };
  }, []);

  const resolvedColSpan = column.colSpan
    ? typeof column.colSpan === 'function'
      ? column.colSpan(record, index)
      : column.colSpan
    : undefined;

  const resolvedRowSpan = column.rowSpan
    ? typeof column.rowSpan === 'function'
      ? column.rowSpan(record, index)
      : column.rowSpan
    : undefined;

  return (
    <td
      role="gridcell"
      ref={tdRef}
      tabIndex={0}
      colSpan={resolvedColSpan}
      rowSpan={resolvedRowSpan}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleTdKeyDown}
      onContextMenu={(e) => onContextMenu?.(record, column, e)}
      onFocus={() => onFocus?.(column)}
      onMouseEnter={() => {
        handleMouseEnter();
        onCellMouseEnter?.();
      }}
      onMouseLeave={handleMouseLeave}
      onMouseDown={onCellMouseDown ? (e) => onCellMouseDown(e as unknown as MouseEvent) : undefined}
      className={column.className}
      style={{
        ...theme.cell,
        ...column.style,
        ...stickyStyles,
        borderRight: showColumnBorders
          ? `1px solid ${theme.tokens?.borderColor ?? '#e2e8f0'}`
          : 'none',
        textAlign: column.align ?? (column.type === 'number' ? 'right' : 'left'),
        position: 'relative',
        width: column.width,
        minWidth: column.width,
        maxWidth: column.width,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minHeight: '20px',
        userSelect: column.allowTextSelection ? 'text' : 'none',
        backgroundColor: highlighted
          ? `${theme.tokens?.primaryColor ?? '#3b82f6'}22`
          : isInRange
            ? `${theme.tokens?.primaryColor ?? '#3b82f6'}18`
            : isEditing
              ? undefined
              : (stickyStyles?.backgroundColor ??
                theme.cell?.backgroundColor ??
                theme.row?.backgroundColor ??
                theme.tokens?.backgroundColor ??
                '#fff'),
        outline: isInRange ? `1px solid ${theme.tokens?.primaryColor ?? '#3b82f6'}60` : undefined,
        outlineOffset: isInRange ? '-1px' : undefined,
        transition: highlighted ? 'background-color 0s' : 'background-color 0.8s ease',
        opacity: isDisabled ? 0.6 : 1,
        color:
          isDisabled || isReadOnly
            ? (theme.tokens?.disabledColor ?? '#94a3b8')
            : (theme.cell?.color ?? theme.tokens?.textColor),
        cursor: isDisabled ? 'not-allowed' : isReadOnly ? 'default' : editable ? 'text' : 'default',
        ...(isDisabled && { pointerEvents: 'none' }),
      }}
    >
      {!!tooltipVisible && !!tooltipText && (
        <div
          style={{
            position: 'fixed',
            zIndex: 9999,
            pointerEvents: 'none',
            background: '#1e293b',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            maxWidth: 240,
            lineHeight: 1.4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            left: tooltipPos.left,
            top: tooltipPos.top,
          }}
        >
          {tooltipText}
        </div>
      )}
      {!!isReadOnly && !isEditing && (
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            color: theme.tokens?.readOnlyColor ?? '#94a3b8',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )}
      {isEditing ? renderInput() : renderValue()}
      {!!enableFillHandle && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            onFillHandle?.();
          }}
          title="Fill handle — drag to fill"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 8,
            height: 8,
            backgroundColor: theme.tokens?.primaryColor ?? '#3b82f6',
            cursor: 'crosshair',
            zIndex: 10,
          }}
        />
      )}
    </td>
  );
};

export const Cell = memo(CellInner) as FC<CellProps<any>>;

import { useState, useRef, useEffect, memo } from 'react';
import type { FC, CSSProperties, MouseEvent, KeyboardEvent, ChangeEvent } from 'react';
import type { Column, TableTheme } from '../types';
import { isImageResult } from '../core/formulas';
import { formatValue } from '../core/formatter';
import { Calendar } from '../components/Calendar';

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
}: CellProps<T>) => {
  const value = record[column.key];
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<any>(value);
  const [showCalendar, setShowCalendar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <td
      tabIndex={0}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleTdKeyDown}
      onContextMenu={(e) => onContextMenu?.(record, column, e)}
      onFocus={() => onFocus?.(column)}
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
        backgroundColor: isEditing
          ? undefined
          : (stickyStyles?.backgroundColor ??
            theme.cell?.backgroundColor ??
            theme.row?.backgroundColor ??
            theme.tokens?.backgroundColor ??
            '#fff'),
        opacity: isDisabled ? 0.6 : 1,
        color:
          isDisabled || isReadOnly
            ? (theme.tokens?.disabledColor ?? '#94a3b8')
            : (theme.cell?.color ?? theme.tokens?.textColor),
        cursor: isDisabled ? 'not-allowed' : isReadOnly ? 'default' : editable ? 'text' : 'default',
        ...(isDisabled && { pointerEvents: 'none' }),
      }}
    >
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
    </td>
  );
};

export const Cell = memo(CellInner) as FC<CellProps<any>>;

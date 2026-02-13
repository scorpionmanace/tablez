import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  FC,
  CSSProperties,
  KeyboardEvent,
  DragEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import type {
  Column,
  TableTheme,
  TableSortDirection,
  TableSortState,
  TableFilters,
} from '../types';
import { ColumnMenu } from './ColumnMenu';
import { calculateColumnOffsets } from '../core/engine';

interface HeaderProps {
  columns: Column<any>[];
  theme: TableTheme;
  resizable?: boolean;
  onResize?: (index: number, width: number) => void;
  onSort: (key: string, direction: TableSortDirection) => void;
  onFilter: (key: string, value: string) => void;
  onFreeze?: (key: string, direction: 'left' | 'right' | null) => void;
  sortState?: TableSortState;
  filters?: TableFilters;
  showColumnBorders?: boolean;
  draggableColumns?: boolean;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onColumnUpdate?: (columns: Column<any>[]) => void;
  managedEditingKey?: string | null;
}

export const Header: FC<HeaderProps> = ({
  columns,
  theme,
  resizable,
  onResize,
  onSort,
  onFilter,
  onFreeze,
  sortState,
  filters = {},
  showColumnBorders = true,
  draggableColumns = false,
  onReorder,
  onColumnUpdate,
  managedEditingKey,
}) => {
  const [resizingIndex, setResizingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const [editingColumnKey, setEditingColumnKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Adjust state based on props (externally triggered editing)
  const [prevManagedEditingKey, setPrevManagedEditingKey] = useState<string | null | undefined>(
    undefined,
  );
  if (managedEditingKey !== prevManagedEditingKey) {
    setPrevManagedEditingKey(managedEditingKey);
    if (managedEditingKey !== undefined) {
      setEditingColumnKey(managedEditingKey);
      if (managedEditingKey) {
        const col = columns.find((c) => c.key === managedEditingKey);
        if (col) {
          setEditValue(typeof col.title === 'string' ? col.title : col.key);
        }
      }
    }
  }

  useEffect(() => {
    if (editingColumnKey && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingColumnKey]);

  const handleHeaderDoubleClick = (col: Column<any>) => {
    setEditingColumnKey(col.key);
    setEditValue(typeof col.title === 'string' ? col.title : col.key);
  };

  const commitHeaderEdit = () => {
    if (editingColumnKey && onColumnUpdate) {
      const newCols = columns.map((c) =>
        c.key === editingColumnKey ? { ...c, title: editValue } : c,
      );
      onColumnUpdate(newCols);
    }
    setEditingColumnKey(null);
  };

  const handleHeaderKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitHeaderEdit();
    } else if (e.key === 'Escape') {
      setEditingColumnKey(null);
    }
  };

  const handleDragStart = (e: DragEvent, index: number) => {
    if (!draggableColumns) return;
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';

    const target = e.target as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    if (!draggableColumns) return;
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: DragEvent, toIndex: number) => {
    if (!draggableColumns) return;
    e.preventDefault();
    setDragOverIndex(null);
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex && onReorder) {
      onReorder(fromIndex, toIndex);
    }
  };

  const handleDragEnd = (e: DragEvent) => {
    setDragOverIndex(null);
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const handleMouseDown = (e: ReactMouseEvent, index: number, width: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingIndex(index);
    setStartX(e.clientX);
    setStartWidth(width);
  };

  const getMinColumnWidth = useCallback((col: Column<any>) => {
    if (typeof col.title !== 'string') return 80;

    const words = col.title.split(/\s+/);
    const longestWord = words.reduce((a, b) => (a.length > b.length ? a : b), '');

    const padding = 55;
    const charWidth = 8.5;
    return Math.max(60, longestWord.length * charWidth + padding);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (resizingIndex === null) return;

      const diff = e.clientX - startX;
      const col = columns[resizingIndex];
      const minWidth = getMinColumnWidth(col);
      const newWidth = Math.max(minWidth, startWidth + diff);

      if (onResize) {
        onResize(resizingIndex, newWidth);
      }
    },
    [resizingIndex, startX, startWidth, onResize, columns, getMinColumnWidth],
  );

  const handleMouseUp = useCallback(() => {
    setResizingIndex(null);
  }, []);

  useEffect(() => {
    if (resizingIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingIndex, handleMouseMove, handleMouseUp]);

  const { leftOffsets, rightOffsets } = useMemo(() => calculateColumnOffsets(columns), [columns]);

  return (
    <thead style={{ ...theme.header, zIndex: 40 }}>
      <tr>
        {columns.map((col, index) => {
          const isFixed = !!col.fixed;
          const headerBg =
            theme.header?.backgroundColor ?? theme.tokens?.headerBackgroundColor ?? '#fff';
          const stickyStyles: CSSProperties = {
            position: 'sticky',
            left: col.fixed === 'left' ? leftOffsets[index] : undefined,
            right: col.fixed === 'right' ? rightOffsets[col.key] : undefined,
            backgroundColor: headerBg,
            zIndex: isFixed ? 50 : undefined,
          };

          const isEditing = editingColumnKey === col.key;

          return (
            <th
              key={col.key || index}
              className={col.headerClassName}
              draggable={!!draggableColumns && !isFixed && col.draggable !== false}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onDoubleClick={() => handleHeaderDoubleClick(col)}
              style={{
                ...theme.headerCell,
                ...col.headerStyle,
                ...stickyStyles,
                borderRight: showColumnBorders
                  ? `1px solid ${theme.tokens?.borderColor ?? '#e2e8f0'}`
                  : 'none',
                borderLeft:
                  dragOverIndex === index
                    ? `2px solid ${theme.tokens?.primaryColor ?? '#3b82f6'}`
                    : undefined,
                width: col.width,
                minWidth: col.width,
                maxWidth: col.width,
                textAlign: col.align,
                userSelect: isEditing ? 'auto' : 'none',
                cursor: isEditing
                  ? 'text'
                  : draggableColumns && !isFixed && col.draggable !== false
                    ? 'grab'
                    : 'default',
                transition: 'border-left 0.1s ease',
                top: 0,
                zIndex: isFixed ? 51 : 41,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    col.align === 'center'
                      ? 'center'
                      : col.align === 'right'
                        ? 'flex-end'
                        : 'flex-start',
                  cursor: isEditing ? 'text' : col.sortable ? 'pointer' : 'default',
                }}
              >
                {!!draggableColumns && !isFixed && col.draggable !== false && !isEditing && (
                  <div
                    style={{
                      marginRight: '6px',
                      opacity: 0.3,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'grab',
                    }}
                    title="Drag to reorder"
                  >
                    <svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor">
                      <circle cx="1" cy="1" r="1" />
                      <circle cx="1" cy="5" r="1" />
                      <circle cx="1" cy="9" r="1" />
                      <circle cx="5" cy="1" r="1" />
                      <circle cx="5" cy="5" r="1" />
                      <circle cx="5" cy="9" r="1" />
                    </svg>
                  </div>
                )}
                <div
                  onClick={(e) => {
                    if (isEditing) {
                      e.stopPropagation();
                      return;
                    }
                    if (col.sortable) {
                      const currentDirection =
                        sortState?.columnKey === col.key ? sortState.direction : null;
                      let nextDirection: TableSortDirection = 'asc';

                      if (currentDirection === 'asc') nextDirection = 'desc';
                      else if (currentDirection === 'desc') nextDirection = null;

                      onSort(col.key, nextDirection);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flex: 1,
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitHeaderEdit}
                      onKeyDown={handleHeaderKeyDown}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'inherit',
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                        fontFamily: 'inherit',
                        padding: 0,
                        margin: 0,
                        textAlign: col.align,
                        ...theme.editInput,
                      }}
                    />
                  ) : col.headerRender ? (
                    col.headerRender(col)
                  ) : (
                    <span
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.title}
                    </span>
                  )}
                  {!!col.sortable && !isEditing && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        color:
                          sortState?.columnKey === col.key
                            ? (theme.tokens?.primaryColor ??
                              theme.tokens?.headerTextColor ??
                              '#475569')
                            : '#cbd5e1',
                        marginLeft: '4px',
                        opacity: sortState?.columnKey === col.key ? 1 : 0.4,
                      }}
                    >
                      <svg
                        width="8"
                        height="6"
                        viewBox="0 0 8 6"
                        fill="none"
                        style={{
                          marginBottom: '1px',
                          opacity:
                            sortState?.columnKey === col.key && sortState.direction === 'asc'
                              ? 1
                              : 0.3,
                        }}
                      >
                        <path d="M4 0L7.4641 5.25H0.535898L4 0Z" fill="currentColor" />
                      </svg>
                      <svg
                        width="8"
                        height="6"
                        viewBox="0 0 8 6"
                        fill="none"
                        style={{
                          marginTop: '1px',
                          opacity:
                            sortState?.columnKey === col.key && sortState.direction === 'desc'
                              ? 1
                              : 0.3,
                        }}
                      >
                        <path d="M4 6L0.535898 0.75L7.4641 0.750001L4 6Z" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>
                {!isEditing &&
                  (col.sortable !== false ||
                    col.filterable !== false ||
                    (!!onFreeze && col.freezable !== false)) && (
                    <ColumnMenu
                      column={col}
                      theme={theme}
                      onSort={(dir) => onSort(col.key, dir)}
                      onFilter={(val) => onFilter(col.key, val)}
                      onFreeze={(dir) => onFreeze?.(col.key, dir)}
                      currentSort={sortState?.columnKey === col.key ? sortState.direction : null}
                      currentFilter={filters[col.key]}
                    />
                  )}
              </div>
              {!!resizable && col.resizable !== false && (
                <div
                  onMouseDown={(e) => handleMouseDown(e, index, col.width ?? 100)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '5px',
                    cursor: 'col-resize',
                    userSelect: 'none',
                    touchAction: 'none',
                    zIndex: 1,
                  }}
                  className="tablez-resizer"
                />
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

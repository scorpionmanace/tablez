import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { MouseEvent as ReactMouseEventGeneric } from 'react';
import { createPortal } from 'react-dom';
import type { FC, ReactElement, UIEvent, MouseEvent as ReactMouseEvent } from 'react';
import type {
  TableProps,
  TableTheme,
  Column,
  TableSortState,
  TableFilters,
  TableSortDirection,
  ContextMenuItem,
  ContextMenuDefaultOption,
  CellComment,
} from '../types';
import { Header } from '../Header/Header';
import { Row } from './Row';
import { ContextMenu, DEFAULT_SHORTCUTS } from './ContextMenu';
import { Toolbar } from './Toolbar';
import { Pagination } from './Pagination';
import { StatusBar } from './StatusBar';
import { DetailRow } from './DetailRow';
import { SidePanel } from './SidePanel';
import { defaultTheme } from '../Theme/theme';
import { calculateVirtualization, processData, flattenTree, groupData } from '../core/engine';

export const Table = <T extends Record<string, any>>({
  data,
  columns: initialColumns,
  settings = {},
  rowSettings = {},
  onSort,
  onFilter,
  onColumnUpdate,
  onColumnOrderChange,
  onCellEdit,
  onDataChange,
  onRowSelect,
  onRowReorder,
  sortState: propSortState,
  filters: propFilters,
  selectedRows: propSelectedRows,
  comments: propComments,
  onCommentAdd,
  onCommentDelete,
  onCommentResolve,
  components = {},
}: TableProps<T>): ReactElement => {
  // Extract settings with defaults
  const {
    virtualized = false,
    containerHeight = 500,
    mode = 'client',
    loading = false,
    showColumnBorders = true,
    resizable = false,
    draggableColumns = false,
    className,
    style,
    theme: userTheme,
  } = settings;

  // Extract row settings with defaults
  const {
    key: rowKey,
    height: rowHeight = 50,
    overscan = 3,
    className: rowClassName,
    onClick: onRowClick,
  } = rowSettings;
  const { Row: CustomRow, Header: CustomHeader } = components;
  const RowComponent = (CustomRow as FC<any>) ?? Row;
  const HeaderComponent = (CustomHeader as FC<any>) ?? Header;

  const [columns, setColumns] = useState<Column<T>[]>(initialColumns);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollAnimationFrame = useRef<number | null>(null);
  const [internalSortState, setInternalSortState] = useState<TableSortState | undefined>();
  const [internalFilters, setInternalFilters] = useState<TableFilters>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string | number>>(new Set());
  const [expandedDetailKeys, setExpandedDetailKeys] = useState<Set<string | number>>(new Set());
  const { treeSettings = {}, selection } = settings;

  // ── Row Selection ──────────────────────────────────────────────
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<Set<string | number>>(new Set());
  const selectedKeys = propSelectedRows ? new Set(propSelectedRows) : internalSelectedKeys;

  // Shared row-key resolver (used by tree toggle + selection)
  const getRowKey = useCallback(
    (item: T): string | number => {
      if (typeof rowKey === 'function') return rowKey(item);
      if (rowKey && (item as any)[rowKey] !== undefined) return (item as any)[rowKey];
      return (item as any).id ?? data.indexOf(item);
    },
    [rowKey, data],
  );

  const toggleRow = useCallback(
    (record: T) => {
      const key = getRowKey(record);
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [getRowKey],
  );

  const handleDetailToggle = useCallback(
    (record: T) => {
      const key = getRowKey(record);
      setExpandedDetailKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [getRowKey],
  );

  // processedData ref — populated after processedData memo, used in selection handlers
  const processedDataRef = useRef<T[]>([]);

  // ── Cell Range Selection ───────────────────────────────────────
  const [rangeStart, setRangeStart] = useState<{ row: number; col: number } | null>(null);
  const [rangeEnd, setRangeEnd] = useState<{ row: number; col: number } | null>(null);
  const [isRangeSelecting, setIsRangeSelecting] = useState(false);

  const isCellInRange = useCallback(
    (rowIdx: number, colIdx: number): boolean => {
      if (!settings.enableRangeSelection || !rangeStart || !rangeEnd) return false;
      const minRow = Math.min(rangeStart.row, rangeEnd.row);
      const maxRow = Math.max(rangeStart.row, rangeEnd.row);
      const minCol = Math.min(rangeStart.col, rangeEnd.col);
      const maxCol = Math.max(rangeStart.col, rangeEnd.col);
      return rowIdx >= minRow && rowIdx <= maxRow && colIdx >= minCol && colIdx <= maxCol;
    },
    [settings.enableRangeSelection, rangeStart, rangeEnd],
  );

  const handleCellMouseDown = useCallback(
    (rowIdx: number, colIdx: number, e: React.MouseEvent) => {
      if (!settings.enableRangeSelection) return;
      e.preventDefault();
      if (e.shiftKey && rangeStart) {
        setRangeEnd({ row: rowIdx, col: colIdx });
      } else {
        setRangeStart({ row: rowIdx, col: colIdx });
        setRangeEnd({ row: rowIdx, col: colIdx });
        setIsRangeSelecting(true);
      }
    },
    [settings.enableRangeSelection, rangeStart],
  );

  const handleCellMouseEnter = useCallback(
    (rowIdx: number, colIdx: number) => {
      if (!settings.enableRangeSelection || !isRangeSelecting) return;
      setRangeEnd({ row: rowIdx, col: colIdx });
    },
    [settings.enableRangeSelection, isRangeSelecting],
  );

  // Fill handle: fill the first column's first row value into the range
  const handleFillRange = useCallback(() => {
    if (!settings.enableFillHandle || !rangeStart || !rangeEnd || !onCellEdit) return;
    const flatRows = processedDataRef.current;
    const startRow = Math.min(rangeStart.row, rangeEnd.row);
    const endRow = Math.max(rangeStart.row, rangeEnd.row);
    const startCol = Math.min(rangeStart.col, rangeEnd.col);
    const endCol = Math.max(rangeStart.col, rangeEnd.col);
    const sourceRecord = flatRows[startRow];
    const sourceCol = columns[startCol];
    if (!sourceRecord || !sourceCol) return;
    const fillValue = sourceRecord[sourceCol.key];
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r === startRow && c === startCol) continue;
        const row = flatRows[r];
        const col = columns[c];
        if (row && col) onCellEdit(row, col.key, fillValue);
      }
    }
  }, [settings.enableFillHandle, rangeStart, rangeEnd, columns, onCellEdit]);

  useEffect(() => {
    if (!settings.enableRangeSelection) return;
    const up = () => setIsRangeSelecting(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [settings.enableRangeSelection]);

  // ── Row Dragging ───────────────────────────────────────────────
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleRowDragStart = useCallback((index: number) => setDragFromIndex(index), []);
  const handleRowDragOver = useCallback((index: number) => setDragOverIndex(index), []);
  const handleGroupToggle = useCallback((groupKey: string | number) => {
    setExpandedGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }, []);

  const handleRowDrop = useCallback(
    (toIndex: number) => {
      if (dragFromIndex === null || dragFromIndex === toIndex) {
        setDragFromIndex(null);
        setDragOverIndex(null);
        return;
      }
      const newData = [...data];
      const [moved] = newData.splice(dragFromIndex, 1);
      newData.splice(toIndex, 0, moved);
      setDragFromIndex(null);
      setDragOverIndex(null);
      if (onRowReorder) onRowReorder(newData);
      else if (onDataChange) onDataChange(newData);
    },
    [dragFromIndex, data, onRowReorder, onDataChange],
  );

  // Context Menu State
  const [contextMenuState, setContextMenuState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    record: T | null;
    column: Column<T> | null;
  }>({ visible: false, x: 0, y: 0, record: null, column: null });

  // Controlled vs Uncontrolled state
  const sortState = propSortState ?? internalSortState;
  const filters = propFilters ?? internalFilters;

  const handleSort = useCallback(
    (key: string, direction: TableSortDirection) => {
      const nextSort = { columnKey: key, direction };
      setInternalSortState(nextSort);
      if (onSort) onSort(nextSort);
    },
    [onSort],
  );

  const handleFilter = useCallback(
    (key: string, value: string) => {
      setInternalFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (onFilter) onFilter(next);
        return next;
      });
    },
    [onFilter],
  );

  // Sync columns if props change
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleFreeze = useCallback(
    (columnKey: string, direction: 'left' | 'right' | null) => {
      setColumns((prev) => {
        const next = prev.map((col) => {
          if (col.key === columnKey) {
            return { ...col, fixed: direction ?? undefined } as Column<T>;
          }
          return col;
        });
        if (onColumnUpdate) onColumnUpdate(next);
        return next;
      });
    },
    [onColumnUpdate],
  );

  const theme = useMemo(() => {
    const tokens = { ...defaultTheme.tokens, ...userTheme?.tokens };

    return {
      tokens,
      table: {
        fontFamily: tokens.fontFamily,
        backgroundColor: tokens.backgroundColor,
        color: tokens.textColor,
        ...defaultTheme.table,
        ...userTheme?.table,
      },
      header: {
        backgroundColor: tokens.headerBackgroundColor,
        borderBottom: `2px solid ${tokens.borderColor}`,
        ...defaultTheme.header,
        ...userTheme?.header,
      },
      headerCell: {
        padding: tokens.padding,
        color: tokens.headerTextColor,
        fontSize: tokens.fontSize,
        ...defaultTheme.headerCell,
        ...userTheme?.headerCell,
      },
      row: {
        borderBottom: `1px solid ${tokens.borderColor}`,
        ...defaultTheme.row,
        ...userTheme?.row,
      },
      cell: {
        padding: tokens.padding,
        color: tokens.textColor,
        fontSize: tokens.fontSize,
        ...defaultTheme.cell,
        ...userTheme?.cell,
      },
      menu: {
        backgroundColor: tokens.backgroundColor,
        border: `1px solid ${tokens.borderColor}`,
        color: tokens.textColor,
        boxShadow: tokens.boxShadow,
        borderRadius: tokens.borderRadius,
        ...defaultTheme.menu,
        ...userTheme?.menu,
      },
      menuItem: {
        color: tokens.textColor,
        fontSize: tokens.fontSize,
        padding: '8px 12px',
        ...defaultTheme.menuItem,
        ...userTheme?.menuItem,
      },
      searchInput: {
        backgroundColor: tokens.backgroundColor,
        border: `1px solid ${tokens.borderColor}`,
        color: tokens.textColor,
        borderRadius: tokens.borderRadius,
        padding: '6px 10px',
        ...defaultTheme.searchInput,
        ...userTheme?.searchInput,
      },
      editInput: {
        padding: '4px 8px',
        border: `1px solid ${tokens.primaryColor ?? '#3b82f6'}`,
        borderRadius: tokens.borderRadius,
        ...defaultTheme.editInput,
        ...userTheme?.editInput,
      },
    } as TableTheme;
  }, [userTheme]);

  const handleResize = useCallback(
    (index: number, newWidth: number) => {
      setColumns((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], width: newWidth };
        if (onColumnUpdate) {
          onColumnUpdate(next);
        }
        return next;
      });
    },
    [onColumnUpdate],
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setColumns((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);

        if (onColumnOrderChange) {
          onColumnOrderChange(next.map((c) => c.key));
        }
        if (onColumnUpdate) {
          onColumnUpdate(next);
        }
        return next;
      });
    },
    [onColumnOrderChange, onColumnUpdate],
  );

  // 1. Process data (Filter/Sort) - Only when data/filters/sort change
  const internalProcessedData = useMemo(() => {
    if (mode === 'server') return data;
    return processData(
      data,
      filters,
      sortState,
      columns as any,
      (treeSettings.childrenKey as string) || 'children',
    );
  }, [data, mode, filters, sortState, columns, treeSettings.childrenKey]);

  // 2. Flatten for display - When internal data or expansion state changes
  const processedData = useMemo(() => {
    if (mode === 'server' || !treeSettings.enabled) return internalProcessedData;

    const isSearching = Object.values(filters).some((v) => !!v);

    return flattenTree(
      internalProcessedData,
      (treeSettings.childrenKey as string) || 'children',
      expandedKeys,
      getRowKey,
      0,
      isSearching,
    );
  }, [
    internalProcessedData,
    mode,
    treeSettings.enabled,
    treeSettings.childrenKey,
    expandedKeys,
    getRowKey,
    filters,
  ]);

  // Apply grouping if configured
  const finalProcessedData = useMemo(() => {
    if (!settings.groupBy?.length) return processedData;
    return groupData(processedData, settings.groupBy, expandedGroupKeys, columns as any) as T[];
  }, [processedData, settings.groupBy, expandedGroupKeys, columns]);

  // Keep ref in sync so selection handlers can access current processedData without stale closure
  useEffect(() => {
    processedDataRef.current = finalProcessedData;
  });

  // ── Selection handlers (defined after processedData) ───────────
  const handleRowSelect = useCallback(
    (record: T, e?: ReactMouseEventGeneric) => {
      if (!selection) return;
      const key = getRowKey(record);
      const mode = selection.mode ?? 'multi';

      setInternalSelectedKeys((prev) => {
        const next = new Set(prev);
        if (mode === 'single') {
          if (next.has(key)) {
            next.clear();
          } else {
            next.clear();
            next.add(key);
          }
        } else {
          if (e?.shiftKey && prev.size > 0) {
            const flatData = processedDataRef.current;
            const lastKey = [...prev].at(-1);
            const lastIdx = flatData.findIndex((r) => getRowKey(r) === lastKey);
            const currIdx = flatData.findIndex((r) => getRowKey(r) === key);
            if (lastIdx !== -1 && currIdx !== -1) {
              const [from, to] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
              for (let i = from; i <= to; i++) {
                next.add(getRowKey(flatData[i]));
              }
            } else {
              if (next.has(key)) {
                next.delete(key);
              } else {
                next.add(key);
              }
            }
          } else {
            if (next.has(key)) {
              next.delete(key);
            } else {
              next.add(key);
            }
          }
        }
        if (onRowSelect) {
          const selected = !prev.has(key);
          onRowSelect([...next], record, selected);
        }
        return next;
      });
    },
    [selection, getRowKey, onRowSelect],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!selection) return;
      const flat = processedDataRef.current;
      setInternalSelectedKeys(() => {
        const next = checked ? new Set(flat.map(getRowKey)) : new Set<string | number>();
        if (onRowSelect && flat[0]) {
          onRowSelect([...next], flat[0], checked);
        }
        return next;
      });
    },
    [selection, getRowKey, onRowSelect],
  );

  // ── Pagination ─────────────────────────────────────────────────
  const paginationCfg = settings.pagination;
  const paginationEnabled = !!paginationCfg?.enabled;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(paginationCfg?.pageSize ?? 25);

  // Reset page when data or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortState]);

  const paginatedData = useMemo(() => {
    if (!paginationEnabled) return finalProcessedData;
    const start = (currentPage - 1) * pageSize;
    return finalProcessedData.slice(start, start + pageSize);
  }, [paginationEnabled, finalProcessedData, currentPage, pageSize]);

  const { frozenData, scrolledData } = useMemo(() => {
    const source = paginatedData;
    if (settings.frozenRows && settings.frozenRows > 0) {
      return {
        frozenData: source.slice(0, settings.frozenRows),
        scrolledData: source.slice(settings.frozenRows),
      };
    }
    return { frozenData: [], scrolledData: source };
  }, [paginatedData, settings.frozenRows]);

  const virtualization = useMemo(() => {
    return calculateVirtualization({
      scrollTop,
      height: rowHeight,
      containerHeight,
      dataLength: scrolledData.length,
      overscan,
      virtualized,
    });
  }, [virtualized, scrolledData.length, rowHeight, scrollTop, containerHeight, overscan]);

  const { startIndex, endIndex, offsetY, bottomOffsetY } = virtualization;
  const visibleData = useMemo(
    () => scrolledData.slice(startIndex, endIndex),
    [scrolledData, startIndex, endIndex],
  );

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    if (scrollAnimationFrame.current) {
      cancelAnimationFrame(scrollAnimationFrame.current);
    }
    const target = e.currentTarget;
    scrollAnimationFrame.current = requestAnimationFrame(() => {
      setScrollTop(target.scrollTop);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (scrollAnimationFrame.current) {
        cancelAnimationFrame(scrollAnimationFrame.current);
      }
    };
  }, []);

  const [lastFocused, setLastFocused] = useState<{ record: T; column: Column<T> } | null>(null);
  const [editingHeaderKey, setEditingHeaderKey] = useState<string | null>(null);

  const [history, setHistory] = useState<T[][]>([data]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (data !== history[historyIndex]) {
      setHistory([data]);
      setHistoryIndex(0);
    }
  }, [data]);

  const updateDataWithHistory = useCallback(
    (newData: T[]) => {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(newData);
      if (nextHistory.length > 50) nextHistory.shift();

      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);

      if (onDataChange) onDataChange(newData);
    },
    [history, historyIndex, onDataChange],
  );

  const onContextMenu = useCallback(
    (record: T, column: Column<T>, e: ReactMouseEvent) => {
      if (!settings.contextMenu?.enabled) return;

      e.preventDefault();
      e.stopPropagation();

      setLastFocused({ record, column });
      setContextMenuState({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        record,
        column,
      });
    },
    [settings.contextMenu?.enabled],
  );

  const onContextMenuAction = useCallback(
    (action: string, record: T, column: Column<T>) => {
      setContextMenuState((prev) => ({ ...prev, visible: false }));

      const rowReadOnly =
        typeof rowSettings?.readOnly === 'function'
          ? rowSettings.readOnly(record)
          : !!rowSettings?.readOnly;
      const colReadOnly =
        typeof column.readOnly === 'function' ? column.readOnly(record) : !!column.readOnly;
      const isReadOnly = rowReadOnly || colReadOnly;

      const rowDisabled =
        typeof rowSettings?.disabled === 'function'
          ? rowSettings.disabled(record)
          : !!rowSettings?.disabled;
      const colDisabled =
        typeof column.disabled === 'function' ? column.disabled(record) : !!column.disabled;
      const isDisabled = rowDisabled || colDisabled;

      const editable =
        !isReadOnly &&
        !isDisabled &&
        (typeof column.editable === 'function' ? column.editable(record) : !!column.editable);

      if (action === 'hideColumn') {
        if (onColumnUpdate) {
          const newCols = columns.filter((c) => c.key !== column.key);
          onColumnUpdate(newCols);
        }
      } else if (action === 'renameColumn') {
        setEditingHeaderKey(column.key);
      } else if (action === 'undo') {
        if (historyIndex > 0) {
          const prevData = history[historyIndex - 1];
          setHistoryIndex(historyIndex - 1);
          if (onDataChange) onDataChange(prevData);
        }
      } else if (action === 'redo') {
        if (historyIndex < history.length - 1) {
          const nextData = history[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);
          if (onDataChange) onDataChange(nextData);
        }
      } else if (action === 'copy') {
        const val = record[column.key];
        navigator.clipboard.writeText(String(val ?? '')).catch(() => {});
      } else if (action === 'cut') {
        if (!isReadOnly && editable) {
          const val = record[column.key];
          navigator.clipboard.writeText(String(val ?? '')).catch(() => {});
          if (onCellEdit) {
            onCellEdit(record, column.key, '');
          }
        }
      } else if (action === 'paste') {
        if (editable) {
          navigator.clipboard
            .readText()
            .then((text) => {
              if (onCellEdit) onCellEdit(record, column.key, text);
            })
            .catch((err) => {
              console.warn('Failed to read clipboard', err);
            });
        }
      } else if (action === 'hideRow') {
        const keyToCheck = rowKey
          ? typeof rowKey === 'function'
            ? rowKey(record)
            : record[rowKey]
          : record;

        const newData = data.filter((d) => {
          const dKey = rowKey ? (typeof rowKey === 'function' ? rowKey(d) : d[rowKey]) : d;
          return dKey !== keyToCheck;
        });
        updateDataWithHistory(newData);
      } else if (action === 'insertRowAbove' || action === 'insertRowBelow') {
        let idx = -1;
        if (rowKey) {
          const keyToCheck = typeof rowKey === 'function' ? rowKey(record) : record[rowKey];
          idx = data.findIndex((d) => {
            const dKey = typeof rowKey === 'function' ? rowKey(d) : d[rowKey];
            return dKey === keyToCheck;
          });
        } else {
          idx = data.indexOf(record);
        }

        if (idx > -1) {
          const newData = [...data];
          const clone = { ...record };
          const anyClone = clone as any;
          if ('id' in anyClone && typeof anyClone.id === 'number') {
            anyClone.id = Math.floor(Math.random() * 1000000);
          } else if ('id' in anyClone && typeof anyClone.id === 'string') {
            anyClone.id = Math.random().toString(36).substring(2, 11);
          }

          if (action === 'insertRowAbove') newData.splice(idx, 0, anyClone);
          else newData.splice(idx + 1, 0, anyClone);

          updateDataWithHistory(newData);
        }
      } else if (action === 'insertColumnLeft' || action === 'insertColumnRight') {
        if (onColumnUpdate) {
          const colIdx = columns.findIndex((c) => c.key === column.key);
          if (colIdx > -1) {
            const newKey = `col_${Math.random().toString(36).substring(2, 11)}`;
            const newCol: Column<T> = {
              key: newKey,
              title: 'New Column',
              width: 150,
              editable: true,
              type: 'string',
            };
            const newCols = [...columns];
            if (action === 'insertColumnLeft') newCols.splice(colIdx, 0, newCol);
            else newCols.splice(colIdx + 1, 0, newCol);

            onColumnUpdate(newCols);
            setEditingHeaderKey(newKey);
          }
        }
      } else if (action === 'copyTableWithHeader' || action === 'copyTableWithoutHeader') {
        const includeHeader = action === 'copyTableWithHeader';
        const rows: string[][] = [];

        if (includeHeader) {
          rows.push(
            columns.map((c) => {
              if (typeof c.title === 'string' || typeof c.title === 'number')
                return String(c.title);
              return c.key;
            }),
          );
        }

        data.forEach((item) => {
          const rReadOnly =
            typeof rowSettings?.readOnly === 'function'
              ? rowSettings.readOnly(item)
              : !!rowSettings?.readOnly;
          rows.push(
            columns.map((col) => {
              const cReadOnly =
                typeof col.readOnly === 'function' ? col.readOnly(item) : !!col.readOnly;
              if (rReadOnly || cReadOnly) return '';

              const value = col.formula ? item[col.key] : item[col.key]; // Simplify for copy
              if (value === null || value === undefined) return '';

              const s = String(value);
              if (s.includes('\t') || s.includes('\n') || s.includes('"')) {
                return `"${s.replace(/"/g, '""')}"`;
              }
              return s;
            }),
          );
        });

        const tsv = rows.map((row) => row.join('\t')).join('\n');
        navigator.clipboard.writeText(tsv).catch((err) => {
          console.error('Failed to copy table: ', err);
        });
      }
    },
    [
      columns,
      data,
      onColumnUpdate,
      onDataChange,
      rowKey,
      history,
      historyIndex,
      updateDataWithHistory,
      onCellEdit,
      rowSettings.readOnly,
      rowSettings.disabled,
    ],
  );

  const handleAction = useCallback(
    (action: ContextMenuItem | ContextMenuDefaultOption, record: T, column: Column<T>) => {
      if (typeof action === 'string') {
        onContextMenuAction(action, record, column);
      } else if (action.onClick) {
        action.onClick(record, column);
      }
    },
    [onContextMenuAction],
  );

  const mergedItems = useMemo(() => {
    if (!settings.contextMenu?.enabled) return [];

    return (
      settings.contextMenu.items ?? [
        ...(settings.contextMenu.options ?? []),
        ...(settings.contextMenu.customActions ?? []).map((a) => ({
          label: a.label,
          onClick: a.onClick,
          shortcut: a.shortcut,
        })),
      ]
    );
  }, [settings.contextMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!settings.contextMenu?.enabled || mergedItems.length === 0) return;
      if (!lastFocused) return;

      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      )
        return;

      const isMac =
        typeof window !== 'undefined' &&
        (/Mac|iPod|iPhone|iPad/.test(navigator.platform) || navigator.userAgent.includes('Mac'));

      const matchesShortcut = (shortcut: string) => {
        const parts = shortcut.split('+');
        const ctrl = parts.includes('Ctrl');
        const mod = parts.includes('Mod');
        const shift = parts.includes('Shift');
        const alt = parts.includes('Alt');
        const keyChar = parts[parts.length - 1].toUpperCase();

        const modActive = isMac ? e.metaKey : e.ctrlKey;
        const modMatch = mod ? modActive : ctrl ? e.ctrlKey : !modActive;
        const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
        const altMatch = alt ? e.altKey : !e.altKey;

        return (
          modMatch &&
          shiftMatch &&
          altMatch &&
          (e.key.toUpperCase() === keyChar || e.code.toUpperCase() === `KEY${keyChar}`)
        );
      };

      const processItems = (items: (ContextMenuItem | ContextMenuDefaultOption)[]): boolean => {
        for (const item of items) {
          if (typeof item === 'string') {
            const shortcutStr = DEFAULT_SHORTCUTS[item];
            if (shortcutStr && matchesShortcut(shortcutStr)) {
              e.preventDefault();
              onContextMenuAction(item, lastFocused.record, lastFocused.column);
              return true;
            }
          } else {
            if (item.shortcut && matchesShortcut(item.shortcut)) {
              e.preventDefault();
              handleAction(item, lastFocused.record, lastFocused.column);
              return true;
            }
            if (item.children && processItems(item.children)) return true;
          }
        }
        return false;
      };

      processItems(mergedItems);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.contextMenu?.enabled, mergedItems, lastFocused, handleAction, onContextMenuAction]);

  // ── Side Panel ────────────────────────────────────────────────
  const [sidePanelOpen, setSidePanelOpen] = useState(settings.sidePanel?.defaultOpen ?? false);

  // ── Comments ──────────────────────────────────────────────────
  const [commentMode, setCommentMode] = useState(false);
  // Support both controlled (propComments) and uncontrolled internal state
  const [internalComments, setInternalComments] = useState<CellComment[]>([]);
  const comments = propComments ?? internalComments;

  const handleCommentAdd = useCallback(
    (rowKey: string | number, columnKey: string, text: string) => {
      const comment: CellComment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        rowKey,
        columnKey,
        text,
        timestamp: new Date().toISOString(),
      };
      if (onCommentAdd) {
        onCommentAdd(comment);
      } else {
        setInternalComments((prev) => [...prev, comment]);
      }
      setCommentMode(false);
    },
    [onCommentAdd],
  );

  const handleCommentDelete = useCallback(
    (commentId: string) => {
      if (onCommentDelete) {
        onCommentDelete(commentId);
      } else {
        setInternalComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    },
    [onCommentDelete],
  );

  const handleCommentResolve = useCallback(
    (commentId: string) => {
      if (onCommentResolve) {
        onCommentResolve(commentId);
      } else {
        setInternalComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, resolved: true } : c)),
        );
      }
    },
    [onCommentResolve],
  );

  // ── Infinite Scroll ────────────────────────────────────────────
  const infiniteScrollCfg = settings.infiniteScroll;
  useEffect(() => {
    if (!infiniteScrollCfg || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const threshold = infiniteScrollCfg.threshold ?? 100;
    const onScroll = () => {
      if (infiniteScrollCfg.loadingMore || infiniteScrollCfg.hasMore === false) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        infiniteScrollCfg.onLoadMore();
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [infiniteScrollCfg]);

  const checkboxWidth = selection?.checkboxWidth ?? 40;
  const showRowNumbers = settings.showRowNumbers ?? false;
  const rowNumberWidth = settings.rowNumberWidth ?? 50;

  // Visible columns (exclude hidden ones for rendering)
  const visibleColumns = useMemo(() => columns.filter((c) => !c.hidden), [columns]);

  const totalWidth = useMemo(() => {
    let base = visibleColumns.reduce((acc, col) => acc + (col.width ?? 150), 0);
    if (selection) base += checkboxWidth;
    if (showRowNumbers) base += rowNumberWidth;
    return base;
  }, [visibleColumns, selection, checkboxWidth, showRowNumbers, rowNumberWidth]);

  return (
    <div
      className="tablez-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: containerHeight,
        border: `1px solid ${theme.tokens?.borderColor ?? '#e2e8f0'}`,
        borderRadius: theme.tokens?.borderRadius ?? '6px',
        overflow: 'hidden', // Contain the scroll container
        ...style,
      }}
    >
      {!!settings.toolbar?.enabled && (settings.toolbar?.position ?? 'top') === 'top' && (
        <Toolbar
          data={finalProcessedData}
          columns={columns}
          settings={settings.toolbar}
          theme={theme}
          onFilter={handleFilter}
          filters={filters}
          onColumnsPanel={() => setSidePanelOpen((v) => !v)}
          onImport={onDataChange}
          onCommentToggle={() => setCommentMode((v) => !v)}
          commentMode={commentMode}
        />
      )}
      {!!paginationEnabled &&
        (paginationCfg?.position === 'top' || paginationCfg?.position === 'both') && (
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={finalProcessedData.length}
            theme={theme}
            pageSizeOptions={paginationCfg?.pageSizeOptions}
            onPageChange={setCurrentPage}
            onPageSizeChange={
              paginationCfg?.showPageSizeSelector !== false ? setPageSize : undefined
            }
          />
        )}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={`tablez-container ${className ?? ''}`}
          style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <table
            role="grid"
            aria-label={settings.ariaLabel}
            aria-busy={loading}
            aria-rowcount={finalProcessedData.length}
            className={className}
            style={{
              ...theme.table,
              opacity: loading ? 0.6 : 1,
              tableLayout: 'fixed',
              width: totalWidth,
              minWidth: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <HeaderComponent
              columns={visibleColumns}
              theme={theme}
              resizable={resizable}
              onResize={(idx: number, w: number) => {
                // idx is relative to visibleColumns; map back to full columns
                const vcol = visibleColumns[idx];
                const fullIdx = columns.findIndex((c) => c.key === vcol?.key);
                if (fullIdx !== -1) handleResize(fullIdx, w);
              }}
              onSort={handleSort}
              onFilter={handleFilter}
              onFreeze={handleFreeze}
              sortState={sortState}
              filters={filters}
              showColumnBorders={showColumnBorders}
              draggableColumns={draggableColumns}
              onReorder={handleReorder}
              onColumnUpdate={(newCols: Column<T>[]) => {
                setColumns(newCols);
                if (onColumnUpdate) onColumnUpdate(newCols);
                setEditingHeaderKey(null);
              }}
              managedEditingKey={editingHeaderKey}
              selection={selection}
              allSelected={
                finalProcessedData.length > 0 &&
                finalProcessedData.every((r) => selectedKeys.has(getRowKey(r)))
              }
              someSelected={finalProcessedData.some((r) => selectedKeys.has(getRowKey(r)))}
              onSelectAll={handleSelectAll}
              checkboxWidth={checkboxWidth}
              showRowNumbers={showRowNumbers}
              rowNumberWidth={rowNumberWidth}
              columnGroups={settings.columnGroups}
              floatingFilters={settings.floatingFilters}
            />
            <tbody>
              {/* Frozen Rows */}
              {frozenData.map((record: T, idx: number) => {
                const key = rowKey
                  ? typeof rowKey === 'function'
                    ? rowKey(record)
                    : record[rowKey]
                  : `frozen-${idx}`;

                const stickyTop = 40 + idx * rowHeight;
                const rReadOnly =
                  typeof rowSettings?.readOnly === 'function'
                    ? rowSettings.readOnly(record)
                    : !!rowSettings?.readOnly;
                const rDisabled =
                  typeof rowSettings?.disabled === 'function'
                    ? rowSettings.disabled(record)
                    : !!rowSettings?.disabled;

                return (
                  <RowComponent
                    key={key}
                    record={record}
                    columns={visibleColumns}
                    theme={theme}
                    onClick={onRowClick}
                    onCellEdit={onCellEdit}
                    onContextMenu={onContextMenu}
                    onFocus={(col: Column<T>) => setLastFocused({ record, column: col })}
                    index={idx}
                    className={rowClassName}
                    showColumnBorders={showColumnBorders}
                    height={rowHeight}
                    readOnly={rReadOnly}
                    disabled={rDisabled}
                    onToggle={toggleRow}
                    onGroupToggle={handleGroupToggle}
                    treeSettings={treeSettings}
                    onCellMouseDown={
                      settings.enableRangeSelection ? handleCellMouseDown : undefined
                    }
                    onCellMouseEnter={
                      settings.enableRangeSelection ? handleCellMouseEnter : undefined
                    }
                    isCellInRange={settings.enableRangeSelection ? isCellInRange : undefined}
                    enableFillHandle={settings.enableFillHandle}
                    onFillHandle={handleFillRange}
                    selection={selection}
                    isSelected={selectedKeys.has(getRowKey(record))}
                    onSelect={handleRowSelect}
                    checkboxWidth={checkboxWidth}
                    showRowNumbers={showRowNumbers}
                    rowNumber={idx + 1}
                    rowNumberWidth={rowNumberWidth}
                    draggableRows={settings.draggableRows}
                    rowDragIndex={idx}
                    onRowDragStart={handleRowDragStart}
                    onRowDragOver={handleRowDragOver}
                    onRowDrop={handleRowDrop}
                    isDragOver={dragOverIndex === idx}
                    comments={comments.filter((c) => c.rowKey === getRowKey(record))}
                    commentMode={!!commentMode && settings.enableComments !== false}
                    onAddComment={(columnKey: string, text: string) =>
                      handleCommentAdd(getRowKey(record), columnKey, text)
                    }
                    onDeleteComment={handleCommentDelete}
                    onResolveComment={handleCommentResolve}
                    style={{
                      position: 'sticky',
                      top: stickyTop,
                      zIndex: 30,
                      backgroundColor: theme.tokens?.backgroundColor ?? '#fff',
                      boxShadow:
                        idx === frozenData.length - 1 ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                    }}
                  />
                );
              })}

              {virtualized ? (
                <>
                  {offsetY > 0 && (
                    <tr style={{ height: offsetY, border: 'none' }} aria-hidden="true">
                      <td
                        colSpan={visibleColumns.length}
                        style={{ padding: 0, border: 'none', height: offsetY }}
                      />
                    </tr>
                  )}
                  {visibleData.map((record: T, idx: number) => {
                    const originalIndex = startIndex + idx;
                    const key = rowKey
                      ? typeof rowKey === 'function'
                        ? rowKey(record)
                        : record[rowKey]
                      : originalIndex;

                    const rReadOnly =
                      typeof rowSettings?.readOnly === 'function'
                        ? rowSettings.readOnly(record)
                        : !!rowSettings?.readOnly;
                    const rDisabled =
                      typeof rowSettings?.disabled === 'function'
                        ? rowSettings.disabled(record)
                        : !!rowSettings?.disabled;

                    return (
                      <RowComponent
                        key={key}
                        record={record}
                        columns={visibleColumns}
                        theme={theme}
                        onClick={onRowClick}
                        onCellEdit={onCellEdit}
                        onContextMenu={onContextMenu}
                        onFocus={(col: Column<T>) => setLastFocused({ record, column: col })}
                        index={originalIndex}
                        className={rowClassName}
                        showColumnBorders={showColumnBorders}
                        height={rowHeight}
                        readOnly={rReadOnly}
                        disabled={rDisabled}
                        onToggle={toggleRow}
                        treeSettings={treeSettings}
                        selection={selection}
                        isSelected={selectedKeys.has(getRowKey(record))}
                        onSelect={handleRowSelect}
                        checkboxWidth={checkboxWidth}
                        showRowNumbers={showRowNumbers}
                        rowNumber={(settings.frozenRows ?? 0) + originalIndex + 1}
                        rowNumberWidth={rowNumberWidth}
                        draggableRows={settings.draggableRows}
                        rowDragIndex={originalIndex}
                        onRowDragStart={handleRowDragStart}
                        onRowDragOver={handleRowDragOver}
                        onRowDrop={handleRowDrop}
                        isDragOver={dragOverIndex === originalIndex}
                        comments={comments.filter((c) => c.rowKey === getRowKey(record))}
                        commentMode={!!commentMode && settings.enableComments !== false}
                        onAddComment={(columnKey: string, text: string) =>
                          handleCommentAdd(getRowKey(record), columnKey, text)
                        }
                        onDeleteComment={handleCommentDelete}
                        onResolveComment={handleCommentResolve}
                      />
                    );
                  })}
                  {bottomOffsetY > 0 && (
                    <tr style={{ height: bottomOffsetY, border: 'none' }} aria-hidden="true">
                      <td
                        colSpan={visibleColumns.length}
                        style={{ padding: 0, border: 'none', height: bottomOffsetY }}
                      />
                    </tr>
                  )}
                </>
              ) : (
                scrolledData.map((record: T, idx: number) => {
                  const originalIndex = (settings.frozenRows ?? 0) + idx;
                  const key = rowKey
                    ? typeof rowKey === 'function'
                      ? rowKey(record)
                      : record[rowKey]
                    : originalIndex;

                  const rReadOnly =
                    typeof rowSettings?.readOnly === 'function'
                      ? rowSettings.readOnly(record)
                      : !!rowSettings?.readOnly;
                  const rDisabled =
                    typeof rowSettings?.disabled === 'function'
                      ? rowSettings.disabled(record)
                      : !!rowSettings?.disabled;

                  return (
                    <>
                      <RowComponent
                        key={key}
                        record={record}
                        columns={visibleColumns}
                        theme={theme}
                        onClick={
                          settings.masterDetail && !(record as any).__isGroupRow
                            ? (r: T) => {
                                handleDetailToggle(r);
                                onRowClick?.(r);
                              }
                            : onRowClick
                        }
                        onCellEdit={onCellEdit}
                        onContextMenu={onContextMenu}
                        onFocus={(col: Column<T>) => setLastFocused({ record, column: col })}
                        index={originalIndex}
                        className={rowClassName}
                        showColumnBorders={showColumnBorders}
                        height={rowHeight}
                        readOnly={rReadOnly}
                        disabled={rDisabled}
                        onToggle={toggleRow}
                        treeSettings={treeSettings}
                        selection={selection}
                        isSelected={selectedKeys.has(getRowKey(record))}
                        onSelect={handleRowSelect}
                        checkboxWidth={checkboxWidth}
                        showRowNumbers={showRowNumbers}
                        rowNumber={originalIndex + 1}
                        rowNumberWidth={rowNumberWidth}
                        draggableRows={settings.draggableRows}
                        rowDragIndex={originalIndex}
                        onRowDragStart={handleRowDragStart}
                        onRowDragOver={handleRowDragOver}
                        onRowDrop={handleRowDrop}
                        isDragOver={dragOverIndex === originalIndex}
                        onGroupToggle={handleGroupToggle}
                        animateRows={settings.animateRows}
                        comments={comments.filter((c) => c.rowKey === getRowKey(record))}
                        commentMode={!!commentMode && settings.enableComments !== false}
                        onAddComment={(columnKey: string, text: string) =>
                          handleCommentAdd(getRowKey(record), columnKey, text)
                        }
                        onDeleteComment={handleCommentDelete}
                        onResolveComment={handleCommentResolve}
                      />
                      {!!settings.masterDetail &&
                        !(record as any).__isGroupRow &&
                        expandedDetailKeys.has(getRowKey(record)) && (
                          <DetailRow
                            key={`detail-${key}`}
                            colSpan={
                              visibleColumns.length + (selection ? 1 : 0) + (showRowNumbers ? 1 : 0)
                            }
                            record={record}
                            theme={theme}
                            detailRenderer={settings.masterDetail.detailRenderer}
                          />
                        )}
                    </>
                  );
                })
              )}
              {/* Infinite scroll loading indicator */}
              {!!infiniteScrollCfg?.loadingMore && (
                <tr aria-hidden="true">
                  <td
                    colSpan={visibleColumns.length + (selection ? 1 : 0) + (showRowNumbers ? 1 : 0)}
                    style={{
                      textAlign: 'center',
                      padding: '12px',
                      color: theme.tokens?.textColor ?? '#94a3b8',
                      fontSize: theme.tokens?.fontSize ?? '13px',
                      opacity: 0.7,
                    }}
                  >
                    Loading more…
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!!contextMenuState.visible &&
            !!contextMenuState.record &&
            !!contextMenuState.column &&
            createPortal(
              <ContextMenu
                x={contextMenuState.x}
                y={contextMenuState.y}
                record={contextMenuState.record}
                column={contextMenuState.column}
                items={mergedItems}
                onAction={onContextMenuAction}
                onClose={() => setContextMenuState((prev) => ({ ...prev, visible: false }))}
                theme={theme}
                isReadOnly={
                  (typeof rowSettings?.readOnly === 'function'
                    ? rowSettings.readOnly(contextMenuState.record)
                    : !!rowSettings?.readOnly) ||
                  (typeof contextMenuState.column.readOnly === 'function'
                    ? contextMenuState.column.readOnly(contextMenuState.record)
                    : !!contextMenuState.column.readOnly)
                }
                isDisabled={
                  (typeof rowSettings?.disabled === 'function'
                    ? rowSettings.disabled(contextMenuState.record)
                    : !!rowSettings?.disabled) ||
                  (typeof contextMenuState.column.disabled === 'function'
                    ? contextMenuState.column.disabled(contextMenuState.record)
                    : !!contextMenuState.column.disabled)
                }
              />,
              document.body,
            )}
        </div>
        {/* Side Panel */}
        {!!sidePanelOpen && (
          <SidePanel
            columns={columns}
            theme={theme}
            width={settings.sidePanel?.width}
            onColumnsChange={(newCols) => {
              setColumns(newCols);
              if (onColumnUpdate) onColumnUpdate(newCols);
            }}
            onClose={() => setSidePanelOpen(false)}
          />
        )}
      </div>
      {!!settings.toolbar?.enabled && settings.toolbar?.position === 'bottom' && (
        <Toolbar
          data={finalProcessedData}
          columns={columns}
          settings={settings.toolbar}
          theme={theme}
          onFilter={handleFilter}
          filters={filters}
          onColumnsPanel={() => setSidePanelOpen((v) => !v)}
          onImport={onDataChange}
          onCommentToggle={() => setCommentMode((v) => !v)}
          commentMode={commentMode}
        />
      )}
      {!!paginationEnabled &&
        (paginationCfg?.position === 'bottom' ||
          !paginationCfg?.position ||
          paginationCfg?.position === 'both') && (
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={finalProcessedData.length}
            theme={theme}
            pageSizeOptions={paginationCfg?.pageSizeOptions}
            onPageChange={setCurrentPage}
            onPageSizeChange={
              paginationCfg?.showPageSizeSelector !== false ? setPageSize : undefined
            }
          />
        )}
      {!!settings.statusBar && (
        <StatusBar
          data={finalProcessedData}
          columns={columns}
          theme={theme}
          settings={settings.statusBar}
          selectedCount={internalSelectedKeys.size}
          totalCount={finalProcessedData.length}
        />
      )}
    </div>
  );
};

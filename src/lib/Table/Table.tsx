import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { FC, UIEvent, MouseEvent as ReactMouseEvent } from 'react';
import type {
  TableProps,
  TableTheme,
  Column,
  TableSortState,
  TableFilters,
  TableSortDirection,
  ContextMenuItem,
  ContextMenuDefaultOption,
} from '../types';
import { Header } from '../Header/Header';
import { Row } from './Row';
import { ContextMenu, DEFAULT_SHORTCUTS } from './ContextMenu';
import { Toolbar } from './Toolbar';
import { defaultTheme } from '../Theme/theme';
import { calculateVirtualization, processData } from '../core/engine';

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
  sortState: propSortState,
  filters: propFilters,
  components = {},
}: TableProps<T>) => {
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

  const processedData = useMemo(() => {
    if (mode === 'server') return data;
    return processData(data, filters, sortState, columns as any);
  }, [data, mode, filters, sortState, columns]);

  const { frozenData, scrolledData } = useMemo(() => {
    if (settings.frozenRows && settings.frozenRows > 0) {
      return {
        frozenData: processedData.slice(0, settings.frozenRows),
        scrolledData: processedData.slice(settings.frozenRows),
      };
    }
    return { frozenData: [], scrolledData: processedData };
  }, [processedData, settings.frozenRows]);

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

  const totalWidth = useMemo(() => {
    return columns.reduce((acc, col) => acc + (col.width ?? 150), 0);
  }, [columns]);

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
          data={processedData}
          columns={columns}
          settings={settings.toolbar}
          theme={theme}
          onFilter={handleFilter}
          filters={filters}
        />
      )}
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
            columns={columns}
            theme={theme}
            resizable={resizable}
            onResize={handleResize}
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
                  columns={columns}
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
                  style={{
                    position: 'sticky',
                    top: stickyTop,
                    zIndex: 30,
                    backgroundColor: theme.tokens?.backgroundColor ?? '#fff',
                    boxShadow: idx === frozenData.length - 1 ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                  }}
                />
              );
            })}

            {virtualized ? (
              <>
                {offsetY > 0 && (
                  <tr style={{ height: offsetY, border: 'none' }} aria-hidden="true">
                    <td
                      colSpan={columns.length}
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
                      columns={columns}
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
                    />
                  );
                })}
                {bottomOffsetY > 0 && (
                  <tr style={{ height: bottomOffsetY, border: 'none' }} aria-hidden="true">
                    <td
                      colSpan={columns.length}
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
                  <RowComponent
                    key={key}
                    record={record}
                    columns={columns}
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
                  />
                );
              })
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
      {!!settings.toolbar?.enabled && settings.toolbar?.position === 'bottom' && (
        <Toolbar
          data={processedData}
          columns={columns}
          settings={settings.toolbar}
          theme={theme}
          onFilter={handleFilter}
          filters={filters}
        />
      )}
    </div>
  );
};

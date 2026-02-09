import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TableProps, TableTheme, Column, TableSortState, TableFilters, TableSortDirection, ContextMenuItem, ContextMenuDefaultOption } from '../types';
import { Header } from '../Header/Header';
import { Row } from './Row';
import { ContextMenu } from './ContextMenu';
import { defaultTheme } from '../Theme/theme';
import { calculateVirtualization, processData } from '../core/engine';

export const Table = <T extends object>({
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
    const RowComponent = (CustomRow as any) || Row;
    const HeaderComponent = (CustomHeader as any) || Header;

    const [columns, setColumns] = useState<Column<T>[]>(initialColumns);
    const [scrollTop, setScrollTop] = useState(0);
    const scrollAnimationFrame = useRef<number | null>(null);
    const [internalSortState, setInternalSortState] = useState<TableSortState | undefined>();
    const [internalFilters, setInternalFilters] = useState<TableFilters>({});
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        record: T | null;
        column: Column<T> | null;
    }>({ visible: false, x: 0, y: 0, record: null, column: null });


    // Controlled vs Uncontrolled state
    const sortState = propSortState !== undefined ? propSortState : internalSortState;
    const filters = propFilters !== undefined ? propFilters : internalFilters;

    const handleSort = useCallback((key: string, direction: TableSortDirection) => {
        const nextSort = { columnKey: key, direction };
        setInternalSortState(nextSort);
        if (onSort) onSort(nextSort);
    }, [onSort]);

    const handleFilter = useCallback((key: string, value: string) => {
        setInternalFilters(prev => {
            const next = { ...prev, [key]: value };
            if (onFilter) onFilter(next);
            return next;
        });
    }, [onFilter]);

    // Sync columns if props change, but try to preserve widths if keys match
    useEffect(() => {
        setColumns(initialColumns);
    }, [initialColumns]);

    const handleFreeze = useCallback((columnKey: string, direction: 'left' | 'right' | null) => {
        setColumns(prev => {
            const next = prev.map(col => {
                if (col.key === columnKey) {
                    return { ...col, fixed: direction || undefined };
                }
                return col;
            });
            if (onColumnUpdate) onColumnUpdate(next);
            return next;
        });
    }, [onColumnUpdate]);

    const theme = useMemo(() => {
        const tokens = { ...defaultTheme.tokens, ...userTheme?.tokens };

        return {
            tokens,
            table: {
                fontFamily: tokens.fontFamily,
                backgroundColor: tokens.backgroundColor,
                color: tokens.textColor,
                ...defaultTheme.table,
                ...userTheme?.table
            },
            header: {
                backgroundColor: tokens.headerBackgroundColor,
                borderBottom: `2px solid ${tokens.borderColor}`,
                ...defaultTheme.header,
                ...userTheme?.header
            },
            headerCell: {
                padding: tokens.padding,
                color: tokens.headerTextColor,
                fontSize: tokens.fontSize,
                ...defaultTheme.headerCell,
                ...userTheme?.headerCell
            },
            row: {
                borderBottom: `1px solid ${tokens.borderColor}`,
                ...defaultTheme.row,
                ...userTheme?.row
            },
            cell: {
                padding: tokens.padding,
                color: tokens.textColor,
                fontSize: tokens.fontSize,
                ...defaultTheme.cell,
                ...userTheme?.cell
            },
            menu: {
                backgroundColor: tokens.backgroundColor,
                border: `1px solid ${tokens.borderColor}`,
                color: tokens.textColor,
                boxShadow: tokens.boxShadow,
                borderRadius: tokens.borderRadius,
                ...defaultTheme.menu,
                ...userTheme?.menu
            },
            menuItem: {
                color: tokens.textColor,
                fontSize: tokens.fontSize,
                padding: '8px 12px',
                ...defaultTheme.menuItem,
                ...userTheme?.menuItem
            },
            searchInput: {
                backgroundColor: tokens.backgroundColor,
                border: `1px solid ${tokens.borderColor}`,
                color: tokens.textColor,
                borderRadius: tokens.borderRadius,
                padding: '6px 10px',
                ...defaultTheme.searchInput,
                ...userTheme?.searchInput
            },
            editInput: {
                padding: '4px 8px',
                border: `1px solid ${tokens.primaryColor}`,
                borderRadius: tokens.borderRadius,
                ...defaultTheme.editInput,
                ...userTheme?.editInput
            }
        } as TableTheme;
    }, [userTheme]);

    const handleResize = useCallback((index: number, newWidth: number) => {
        setColumns(prev => {
            const next = [...prev];
            next[index] = { ...next[index], width: newWidth };
            if (onColumnUpdate) {
                onColumnUpdate(next);
            }
            return next;
        });
    }, [onColumnUpdate]);

    const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
        setColumns(prev => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);

            if (onColumnOrderChange) {
                onColumnOrderChange(next.map(c => c.key));
            }
            if (onColumnUpdate) {
                onColumnUpdate(next);
            }
            return next;
        });
    }, [onColumnOrderChange, onColumnUpdate]);


    const processedData = useMemo(() => {
        if (mode === 'server') return data;
        return processData(data, filters, sortState, columns as any);
    }, [data, mode, filters, sortState, columns]);

    // Separate Frozen vs Scrolled Data
    const { frozenData, scrolledData } = useMemo(() => {
        if (settings.frozenRows && settings.frozenRows > 0) {
            return {
                frozenData: processedData.slice(0, settings.frozenRows),
                scrolledData: processedData.slice(settings.frozenRows)
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
            virtualized
        });
    }, [virtualized, scrolledData.length, rowHeight, scrollTop, containerHeight, overscan]);

    const { startIndex, endIndex, offsetY, bottomOffsetY } = virtualization;
    const visibleData = useMemo(() =>
        scrolledData.slice(startIndex, endIndex),
        [scrolledData, startIndex, endIndex]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
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

    // Selection/Focus state for keyboard shortcuts
    const [lastFocused, setLastFocused] = useState<{ record: T; column: Column<T> } | null>(null);
    const [editingHeaderKey, setEditingHeaderKey] = useState<string | null>(null);

    // History for Undo/Redo
    const [history, setHistory] = useState<T[][]>([data]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Sync history if data changes from outside and it's not our own change
    useEffect(() => {
        if (data !== history[historyIndex]) {
            setHistory([data]);
            setHistoryIndex(0);
        }
    }, [data]);

    const updateDataWithHistory = useCallback((newData: T[]) => {
        const nextHistory = history.slice(0, historyIndex + 1);
        nextHistory.push(newData);
        if (nextHistory.length > 50) nextHistory.shift();

        setHistory(nextHistory);
        setHistoryIndex(nextHistory.length - 1);

        if (onDataChange) onDataChange(newData);
    }, [history, historyIndex, onDataChange]);

    // Context Menu Handlers
    const onContextMenu = useCallback((record: T, column: Column<T>, e: React.MouseEvent) => {
        const contextMenuEnabled = settings.contextMenu?.enabled;

        if (!contextMenuEnabled) return;

        e.preventDefault();
        e.stopPropagation();

        setLastFocused({ record, column });
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            record,
            column
        });
    }, [settings.contextMenu?.enabled]);

    const onContextMenuAction = useCallback((action: string, record: T, column: Column<T>) => {
        setContextMenu(prev => ({ ...prev, visible: false }));

        if (action === 'hideColumn') {
            if (onColumnUpdate) {
                const newCols = columns.filter(c => c.key !== column.key);
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
            const val = (record as any)[column.key];
            navigator.clipboard.writeText(String(val));
        } else if (action === 'cut') {
            const val = (record as any)[column.key];
            navigator.clipboard.writeText(String(val));
            if (onCellEdit) {
                onCellEdit(record, column.key, '');
            }
        } else if (action === 'paste') {
            navigator.clipboard.readText().then(text => {
                if (onCellEdit) onCellEdit(record, column.key, text);
            }).catch(err => {
                console.warn('Failed to read clipboard', err);
            });
        } else if (action === 'hideRow') {
            const keyToCheck = rowKey
                ? (typeof rowKey === 'function' ? rowKey(record) : (record as any)[rowKey])
                : record;

            const newData = data.filter(d => {
                const dKey = rowKey ? (typeof rowKey === 'function' ? rowKey(d) : (d as any)[rowKey]) : d;
                return dKey !== keyToCheck;
            });
            updateDataWithHistory(newData);
        } else if (action === 'insertRowAbove' || action === 'insertRowBelow') {
            let index = -1;
            if (rowKey) {
                const keyToCheck = typeof rowKey === 'function' ? rowKey(record) : (record as any)[rowKey];
                index = data.findIndex(d => {
                    const dKey = typeof rowKey === 'function' ? rowKey(d) : (d as any)[rowKey];
                    return dKey === keyToCheck;
                });
            }
            if (index === -1) {
                index = data.indexOf(record);
            }

            if (index > -1) {
                const newData = [...data];
                const clone = JSON.parse(JSON.stringify(record));
                if ('id' in clone && typeof clone.id === 'number') {
                    (clone as any).id = Math.floor(Math.random() * 1000000);
                } else if ('id' in clone && typeof clone.id === 'string') {
                    (clone as any).id = Math.random().toString(36).substr(2, 9);
                }

                if (action === 'insertRowAbove') newData.splice(index, 0, clone);
                else newData.splice(index + 1, 0, clone);

                updateDataWithHistory(newData);
            }
        } else if (action === 'insertColumnLeft' || action === 'insertColumnRight') {
            if (onColumnUpdate) {
                const idx = columns.findIndex(c => c.key === column.key);
                if (idx > -1) {
                    const newKey = `col_${Math.random().toString(36).substr(2, 9)}`;
                    const newCol: Column<T> = {
                        key: newKey,
                        title: 'New Column',
                        width: 150,
                        editable: true,
                        type: 'string'
                    };
                    const newCols = [...columns];
                    if (action === 'insertColumnLeft') newCols.splice(idx, 0, newCol);
                    else newCols.splice(idx + 1, 0, newCol);

                    onColumnUpdate(newCols);
                    setEditingHeaderKey(newKey);
                }
            }
        }
    }, [columns, data, onColumnUpdate, onDataChange, rowKey, history, historyIndex, updateDataWithHistory, onCellEdit]);

    const handleAction = useCallback((action: ContextMenuItem | ContextMenuDefaultOption, record: T, column: Column<T>) => {
        if (typeof action === 'string') {
            onContextMenuAction(action as string, record, column);
        } else if (action.onClick) {
            action.onClick(record, column);
        }
    }, [onContextMenuAction]);

    const DEFAULT_SHORTCUTS: Record<string, string> = {
        'undo': 'Mod+Z',
        'redo': 'Mod+Y',
        'copy': 'Mod+C',
        'cut': 'Mod+X',
        'paste': 'Mod+V'
    };

    // Keyboard Shortcuts
    const mergedItems = useMemo(() => {
        if (!settings.contextMenu?.enabled) return [];

        return settings.contextMenu.items || [
            ...(settings.contextMenu.options || []),
            ...(settings.contextMenu.customActions || []).map(a => ({
                label: a.label,
                onClick: a.onClick,
                shortcut: a.shortcut
            }))
        ];
    }, [settings.contextMenu]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!settings.contextMenu?.enabled || mergedItems.length === 0) return;
            if (!lastFocused) return;

            // Don't trigger if editing
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

            const match = (shortcut: string) => {
                const parts = shortcut.split('+');
                const ctrl = parts.includes('Ctrl');
                const mod = parts.includes('Mod');
                const shift = parts.includes('Shift');
                const alt = parts.includes('Alt');
                const key = parts[parts.length - 1].toUpperCase();

                const modActive = isMac ? e.metaKey : e.ctrlKey;
                const modMatch = mod ? modActive : (ctrl ? e.ctrlKey : !modActive);

                const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
                const altMatch = alt ? e.altKey : !e.altKey;

                return modMatch && shiftMatch && altMatch && (e.key.toUpperCase() === key || e.code.toUpperCase() === `KEY${key}`);
            };

            const processItems = (items: (ContextMenuItem | ContextMenuDefaultOption)[]): boolean => {
                for (const item of items) {
                    if (typeof item === 'string') {
                        const shortcut = DEFAULT_SHORTCUTS[item];
                        if (shortcut && match(shortcut)) {
                            e.preventDefault();
                            onContextMenuAction(item, lastFocused.record, lastFocused.column);
                            return true;
                        }
                    } else {
                        if (item.shortcut && match(item.shortcut)) {
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
        return columns.reduce((acc, col) => acc + (col.width || 150), 0);
    }, [columns]);

    const tableContent = (
        <table
            className={className}
            style={{
                ...theme.table,
                ...style,
                opacity: loading ? 0.6 : 1,
                tableLayout: 'fixed', // Always use fixed for consistent widths
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
            {virtualized ? (
                <tbody>
                    {/* Render Frozen Rows */}
                    {frozenData.map((record: T, index: number) => {
                        const key = rowKey
                            ? typeof rowKey === 'function' ? rowKey(record) : (record as any)[rowKey]
                            : `frozen-${index}`;

                        const stickyTop = 40 + (index * rowHeight);

                        return (
                            <RowComponent
                                key={key}
                                record={record}
                                columns={columns}
                                theme={theme}
                                onClick={onRowClick}
                                onCellEdit={onCellEdit}
                                onContextMenu={onContextMenu} // Pass handler
                                onFocus={(column: Column<T>) => setLastFocused({ record, column })}
                                index={index}
                                className={rowClassName}
                                showColumnBorders={showColumnBorders}
                                height={rowHeight}
                                style={{
                                    position: 'sticky',
                                    top: stickyTop,
                                    zIndex: 30, // Below header (40), above rows
                                    backgroundColor: theme.tokens?.backgroundColor || '#fff',
                                    boxShadow: index === frozenData.length - 1 ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                                }}
                            />
                        );
                    })}

                    {offsetY > 0 && (
                        <tr style={{ height: offsetY, border: 'none' }} aria-hidden="true">
                            <td colSpan={columns.length} style={{ padding: 0, border: 'none', height: offsetY }} />
                        </tr>
                    )}
                    {visibleData.map((record: T, index: number) => {
                        const originalIndex = Math.floor(offsetY / rowHeight) + index;
                        const key = rowKey
                            ? typeof rowKey === 'function'
                                ? rowKey(record)
                                : (record as any)[rowKey]
                            : originalIndex;

                        return (
                            <RowComponent
                                key={key}
                                record={record}
                                columns={columns}
                                theme={theme}
                                onClick={onRowClick}
                                onCellEdit={onCellEdit}
                                onContextMenu={onContextMenu} // Pass handler
                                onFocus={(column: Column<T>) => setLastFocused({ record, column })}
                                index={originalIndex}
                                className={rowClassName}
                                showColumnBorders={showColumnBorders}
                                height={rowHeight}
                            />
                        );
                    })}
                    {bottomOffsetY > 0 && (
                        <tr style={{ height: bottomOffsetY, border: 'none' }} aria-hidden="true">
                            <td colSpan={columns.length} style={{ padding: 0, border: 'none', height: bottomOffsetY }} />
                        </tr>
                    )}
                </tbody>
            ) : (
                <tbody>
                    {/* Render Frozen Rows (Non-Virtualized) */}
                    {frozenData.map((record: T, index: number) => {
                        const key = rowKey
                            ? typeof rowKey === 'function' ? rowKey(record) : (record as any)[rowKey]
                            : `frozen-${index}`;

                        const stickyTop = 40 + (index * rowHeight);

                        return (
                            <RowComponent
                                key={key}
                                record={record}
                                columns={columns}
                                theme={theme}
                                onClick={onRowClick}
                                onCellEdit={onCellEdit}
                                onContextMenu={onContextMenu} // Pass handler
                                onFocus={(column: Column<T>) => setLastFocused({ record, column })}
                                index={index}
                                className={rowClassName}
                                showColumnBorders={showColumnBorders}
                                height={rowHeight}
                                style={{
                                    position: 'sticky',
                                    top: stickyTop,
                                    zIndex: 30,
                                    backgroundColor: theme.tokens?.backgroundColor || '#fff',
                                    boxShadow: index === frozenData.length - 1 ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                                }}
                            />
                        );
                    })}

                    {/* Render Scrolled Data (Non-Virtualized) */}
                    {scrolledData.map((record: T, index: number) => {
                        // Offset index by frozen count
                        const originalIndex = (settings.frozenRows || 0) + index;
                        const key = rowKey
                            ? typeof rowKey === 'function' ? rowKey(record) : (record as any)[rowKey]
                            : originalIndex;

                        return (
                            <RowComponent
                                key={key}
                                record={record}
                                columns={columns}
                                theme={theme}
                                onClick={onRowClick}
                                onCellEdit={onCellEdit}
                                onContextMenu={onContextMenu} // Pass handler
                                onFocus={(column: Column<T>) => setLastFocused({ record, column })}
                                index={originalIndex}
                                className={rowClassName}
                                showColumnBorders={showColumnBorders}
                                height={rowHeight}
                            />
                        );
                    })}
                </tbody>
            )}
        </table >
    );

    const cssVariables = useMemo(() => {
        if (!theme.tokens) return {};
        const vars: Record<string, string> = {};
        Object.entries(theme.tokens).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
                const cssKey = `--tz-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                vars[cssKey] = value;
            }
        });
        return vars;
    }, [theme.tokens]);

    return (
        <div
            ref={scrollContainerRef}
            onScroll={virtualized ? handleScroll : undefined}
            className={`tablez-container ${className || ''}`}
            style={{
                ...cssVariables,
                overflowX: 'auto',
                overflowY: virtualized ? 'auto' : 'visible',
                width: '100%',
                height: virtualized ? containerHeight : 'auto',
                position: 'relative',
                ...style
            }}
        >
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    zIndex: 2,
                    pointerEvents: 'none'
                }}>
                    <span>Loading...</span>
                </div>
            )}
            {tableContent}

            {contextMenu.visible && contextMenu.record && contextMenu.column && createPortal(
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
                    theme={theme}
                    items={mergedItems}
                    record={contextMenu.record}
                    column={contextMenu.column}
                    onAction={onContextMenuAction}
                />,
                document.body
            )}
        </div>
    );
};

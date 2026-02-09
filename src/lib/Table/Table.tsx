import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { TableProps, TableTheme, Column, TableSortState, TableFilters, TableSortDirection } from '../types';
import { Header } from '../Header/Header';
import { Row } from './Row';
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

    const tableContent = (
        <table
            className={className}
            style={{
                ...theme.table,
                ...style,
                opacity: loading ? 0.6 : 1,
                tableLayout: virtualized ? 'fixed' : 'auto'
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
            />
            {virtualized ? (
                <tbody>
                    {/* Render Frozen Rows */}
                    {frozenData.map((record: T, index: number) => {
                        const key = rowKey
                            ? typeof rowKey === 'function' ? rowKey(record) : (record as any)[rowKey]
                            : `frozen-${index}`;

                        // Calculate sticky top position (Header height approx 40px + prev rows)
                        // Note: For exact pixel perfection, header height should be dynamic or measured.
                        // Assuming standard rowHeight for now for frozen rows as well.
                        const stickyTop = 40 + (index * rowHeight);

                        return (
                            <RowComponent
                                key={key}
                                record={record}
                                columns={columns}
                                theme={theme}
                                onClick={onRowClick}
                                onCellEdit={onCellEdit}
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
            if (value) {
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
        </div>
    );
};

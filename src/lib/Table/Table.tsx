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
    onCellEdit,
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
    const [sortState, setSortState] = useState<TableSortState | undefined>();
    const [filters, setFilters] = useState<TableFilters>({});
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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

    const handleSort = useCallback((columnKey: string, direction: TableSortDirection) => {
        const newState = { columnKey, direction };
        if (mode === 'server') {
            if (onSort) onSort(newState);
        } else {
            setSortState(newState);
        }
    }, [mode, onSort]);

    const handleFilter = useCallback((columnKey: string, value: string) => {
        const newFilters = { ...filters, [columnKey]: value };
        if (mode === 'server') {
            if (onFilter) onFilter(newFilters);
        } else {
            setFilters(newFilters);
        }
    }, [mode, filters, onFilter]);

    const processedData = useMemo(() => {
        if (mode === 'server') return data;
        return processData(data, filters, sortState, columns as any);
    }, [data, mode, filters, sortState, columns]);

    const virtualization = useMemo(() => {
        return calculateVirtualization({
            scrollTop,
            height: rowHeight,
            containerHeight,
            dataLength: processedData.length,
            overscan,
            virtualized
        });
    }, [virtualized, processedData.length, rowHeight, scrollTop, containerHeight, overscan]);

    const { startIndex, endIndex, offsetY, bottomOffsetY } = virtualization;
    const visibleData = useMemo(() =>
        processedData.slice(startIndex, endIndex),
        [processedData, startIndex, endIndex]);

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
            />
            {virtualized ? (
                <tbody>
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
                    {processedData.map((record: T, index: number) => {
                        const key = rowKey
                            ? typeof rowKey === 'function'
                                ? rowKey(record)
                                : (record as any)[rowKey]
                            : index;

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
                            />
                        );
                    })}
                </tbody>
            )}
        </table>
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

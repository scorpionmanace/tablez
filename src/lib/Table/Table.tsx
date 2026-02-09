import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { TableProps, TableTheme, Column, TableSortState, TableFilters, TableSortDirection } from '../types';
import { Header } from '../Header/Header';
import { Row } from './Row';
import { defaultTheme } from '../Theme/theme';

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
        return {
            table: { ...defaultTheme.table, ...userTheme?.table },
            header: { ...defaultTheme.header, ...userTheme?.header },
            headerCell: { ...defaultTheme.headerCell, ...userTheme?.headerCell },
            row: { ...defaultTheme.row, ...userTheme?.row },
            cell: { ...defaultTheme.cell, ...userTheme?.cell },
            menu: { ...defaultTheme.menu, ...userTheme?.menu },
            menuItem: { ...defaultTheme.menuItem, ...userTheme?.menuItem },
            searchInput: { ...defaultTheme.searchInput, ...userTheme?.searchInput },
            editInput: { ...defaultTheme.editInput, ...userTheme?.editInput },
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

        let result = [...data];

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (!value) return;
            result = result.filter(item => {
                const itemValue = String((item as any)[key]).toLowerCase();
                return itemValue.includes(value.toLowerCase());
            });
        });

        // Apply sort
        if (sortState?.direction) {
            const { columnKey, direction } = sortState;
            result.sort((a, b) => {
                const valA = (a as any)[columnKey];
                const valB = (b as any)[columnKey];

                if (valA === valB) return 0;
                const comparison = valA < valB ? -1 : 1;
                return direction === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [data, mode, filters, sortState]);

    const { visibleData, offsetY, bottomOffsetY } = useMemo(() => {
        if (!virtualized) {
            return {
                visibleData: processedData,
                offsetY: 0,
                bottomOffsetY: 0,
            };
        }

        const total = processedData.length * rowHeight;
        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
        const endIndex = Math.min(
            processedData.length,
            Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
        );

        return {
            visibleData: processedData.slice(startIndex, endIndex),
            offsetY: startIndex * rowHeight,
            bottomOffsetY: Math.max(0, total - (endIndex * rowHeight)),
        };
    }, [virtualized, processedData, rowHeight, scrollTop, containerHeight, overscan]);

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
                    {visibleData.map((record, index) => {
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
                    {processedData.map((record, index) => {
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

    return (
        <div
            ref={scrollContainerRef}
            onScroll={virtualized ? handleScroll : undefined}
            style={{
                overflowX: 'auto',
                overflowY: virtualized ? 'auto' : 'visible',
                width: '100%',
                height: virtualized ? containerHeight : 'auto',
                position: 'relative'
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

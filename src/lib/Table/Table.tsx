import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { TableProps, TableTheme, Column, TableSortState, TableFilters, TableSortDirection } from '../types';
import { Header } from '../Header/Header';
import { Row } from './Row';
import { defaultTheme } from '../Theme/theme';

export const Table = <T extends object>({
    data,
    columns: initialColumns,
    theme: userTheme,
    rowKey,
    onRowClick,
    resizable,
    onColumnResize,
    className,
    style,
    virtualized = false,
    rowHeight = 50,
    containerHeight = 500,
    overscan = 3,
    mode = 'client',
    loading = false,
    onSort,
    onFilter,
}: TableProps<T>) => {
    const [columns, setColumns] = useState<Column<T>[]>(initialColumns);
    const [scrollTop, setScrollTop] = useState(0);
    const [sortState, setSortState] = useState<TableSortState | undefined>();
    const [filters, setFilters] = useState<TableFilters>({});
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Sync columns if props change, but try to preserve widths if keys match
    useEffect(() => {
        setColumns(initialColumns);
    }, [initialColumns]);

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
        } as TableTheme;
    }, [userTheme]);

    const handleResize = useCallback((index: number, newWidth: number) => {
        setColumns(prev => {
            const next = [...prev];
            next[index] = { ...next[index], width: newWidth };
            if (onColumnResize) {
                onColumnResize(next);
            }
            return next;
        });
    }, [onColumnResize]);

    const handleSort = useCallback((columnKey: string, direction: TableSortDirection) => {
        const newState = { columnKey, direction };
        setSortState(newState);
        if (mode === 'server' && onSort) {
            onSort(newState);
        }
    }, [mode, onSort]);

    const handleFilter = useCallback((columnKey: string, value: string) => {
        setFilters(prev => {
            const next = { ...prev };
            if (value) {
                next[columnKey] = value;
            } else {
                delete next[columnKey];
            }
            if (mode === 'server' && onFilter) {
                onFilter(next);
            }
            return next;
        });
    }, [mode, onFilter]);

    // Client-side processing (filtering & sorting)
    const processedData = useMemo(() => {
        if (mode === 'server') return data;

        let result = [...data];

        // Filtering
        Object.entries(filters).forEach(([key, value]) => {
            if (!value) return;
            result = result.filter(item => {
                const itemValue = (item as any)[key];
                return String(itemValue).toLowerCase().includes(value.toLowerCase());
            });
        });

        // Sorting
        if (sortState && sortState.direction) {
            const { columnKey, direction } = sortState;
            result.sort((a, b) => {
                const valA = (a as any)[columnKey];
                const valB = (b as any)[columnKey];

                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, mode, filters, sortState]);

    // Virtualization calculations
    const { visibleData, totalHeight, offsetY } = useMemo(() => {
        if (!virtualized) {
            return {
                visibleData: processedData,
                totalHeight: 0,
                offsetY: 0,
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
            totalHeight: total,
            offsetY: startIndex * rowHeight,
        };
    }, [virtualized, processedData, rowHeight, scrollTop, containerHeight, overscan]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    const tableContent = (
        <table className={className} style={{ ...theme.table, ...style, opacity: loading ? 0.6 : 1 }}>
            <Header
                columns={columns}
                theme={theme}
                resizable={resizable}
                onResize={handleResize}
                onSort={handleSort}
                onFilter={handleFilter}
                sortState={sortState}
                filters={filters}
            />
            {virtualized ? (
                <tbody style={{ height: totalHeight, position: 'relative' }}>
                    <tr style={{ height: offsetY }} />
                    {visibleData.map((record, index) => {
                        const originalIndex = Math.floor(offsetY / rowHeight) + index;
                        const key = rowKey
                            ? typeof rowKey === 'function'
                                ? rowKey(record)
                                : (record as any)[rowKey]
                            : originalIndex;

                        return (
                            <Row
                                key={key}
                                record={record}
                                columns={columns}
                                theme={theme}
                                onClick={onRowClick}
                            />
                        );
                    })}
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
                            <Row
                                key={key}
                                record={record}
                                columns={columns}
                                theme={theme}
                                onClick={onRowClick}
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

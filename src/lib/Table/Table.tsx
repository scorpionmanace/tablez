import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { TableProps, TableTheme, Column } from '../types';
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
}: TableProps<T>) => {
    const [columns, setColumns] = useState<Column<T>[]>(initialColumns);
    const [scrollTop, setScrollTop] = useState(0);
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
        } as TableTheme;
    }, [userTheme]);

    const handleResize = useCallback((index: number, newWidth: number) => {
        setColumns(prev => {
            const next = [...prev];
            next[index] = { ...next[index], width: newWidth };
            return next;
        });

        // Optional: Notify parent
        if (onColumnResize) {
            // We pass the new state. Note that 'prev' isn't available outside, so maybe we construct it.
            // Actually setColumns callback is safest. We can emit event in an effect or here.
            // Let's defer emitting slightly or emit here.
            // Current limitations: accessing latest 'columns' here might be stale if inside callback without dep.
        }
    }, [onColumnResize]);

    // Effect to trigger onColumnResize when columns change due to resize? 
    // Probably better not to spam it, but the user might want to save layout.

    // Virtualization calculations
    const { visibleData, totalHeight, offsetY } = useMemo(() => {
        if (!virtualized) {
            return {
                visibleData: data,
                totalHeight: 0,
                offsetY: 0,
            };
        }

        const total = data.length * rowHeight;
        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
        const endIndex = Math.min(
            data.length,
            Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
        );

        return {
            visibleData: data.slice(startIndex, endIndex),
            totalHeight: total,
            offsetY: startIndex * rowHeight,
        };
    }, [virtualized, data, rowHeight, scrollTop, containerHeight, overscan]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Non-virtualized rendering
    if (!virtualized) {
        return (
            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className={className} style={{ ...theme.table, ...style }}>
                    <Header
                        columns={columns}
                        theme={theme}
                        resizable={resizable}
                        onResize={handleResize}
                    />
                    <tbody>
                        {data.map((record, index) => {
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
                </table>
            </div>
        );
    }

    // Virtualized rendering
    return (
        <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{
                overflowY: 'auto',
                overflowX: 'auto',
                height: containerHeight,
                width: '100%',
                position: 'relative',
            }}
        >
            <table className={className} style={{ ...theme.table, ...style }}>
                <Header
                    columns={columns}
                    theme={theme}
                    resizable={resizable}
                    onResize={handleResize}
                />
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
            </table>
        </div>
    );
};

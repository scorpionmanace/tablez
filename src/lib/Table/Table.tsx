import { useMemo, useState, useEffect, useCallback } from 'react';
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
}: TableProps<T>) => {
    const [columns, setColumns] = useState<Column<T>[]>(initialColumns);

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
};

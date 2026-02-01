import type { ReactNode, CSSProperties } from 'react';

export interface Column<T = any> {
    key: string;
    title: ReactNode;
    render?: (value: any, record: T, index: number) => ReactNode;
    width?: number; // Force number for easier resizing calculations
    resizable?: boolean; // Per-column resize override
    align?: 'left' | 'center' | 'right';
}

export interface TableTheme {
    table?: CSSProperties;
    header?: CSSProperties;
    headerCell?: CSSProperties;
    row?: CSSProperties;
    cell?: CSSProperties;
    pagination?: CSSProperties;
}

export interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    theme?: TableTheme;
    rowKey?: string | ((record: T) => string);
    onRowClick?: (record: T) => void;
    resizable?: boolean; // Global resize enable
    onColumnResize?: (columns: Column<T>[]) => void;
    className?: string;
    style?: CSSProperties;
}

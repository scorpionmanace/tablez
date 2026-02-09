import type { ReactNode, CSSProperties } from 'react';

export interface Column<T = any> {
    key: string;
    title: ReactNode;
    render?: (value: any, record: T, index: number) => ReactNode;
    headerRender?: (column: Column<T>) => ReactNode; // Custom header rendering
    width?: number; // Force number for easier resizing calculations
    resizable?: boolean; // Per-column resize override
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    filterable?: boolean;
    searchType?: 'text' | 'number';
    editable?: boolean | ((record: T) => boolean);
    className?: string; // Custom cell className
    headerClassName?: string; // Custom header className
    style?: CSSProperties; // Custom cell style
    headerStyle?: CSSProperties; // Custom header style
    fixed?: 'left' | 'right'; // Freeze column to left or right
}

export interface TableTheme {
    table?: CSSProperties;
    header?: CSSProperties;
    headerCell?: CSSProperties;
    row?: CSSProperties;
    cell?: CSSProperties;
    pagination?: CSSProperties;
    menu?: CSSProperties;
    menuItem?: CSSProperties;
    searchInput?: CSSProperties;
    editInput?: CSSProperties;
}

export type TableSortDirection = 'asc' | 'desc' | null;

export interface TableSortState {
    columnKey: string;
    direction: TableSortDirection;
}

export type TableFilters = Record<string, string>;

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
    virtualized?: boolean; // Enable virtual scrolling for large datasets
    rowHeight?: number; // Height of each row in pixels (required for virtualization, default: 50)
    containerHeight?: number; // Height of the scrollable container (default: 500)
    overscan?: number; // Number of extra rows to render above/below viewport (default: 3)

    // Client/Server side support
    mode?: 'client' | 'server';
    loading?: boolean;
    onSort?: (sortState: TableSortState) => void;
    onFilter?: (filters: TableFilters) => void;
    onColumnUpdate?: (columns: Column<T>[]) => void;

    // Editing support
    onCellEdit?: (record: T, key: string, value: any) => void;

    // Customization
    rowClassName?: string | ((record: T, index: number) => string);
    showColumnBorders?: boolean;
    components?: {
        Row?: React.ComponentType<any>;
        Cell?: React.ComponentType<any>;
        Header?: React.ComponentType<any>;
    };
}

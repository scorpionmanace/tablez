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
    formula?: string; // Excel-like formula starting with '='
}

export interface TableTokens {
    primaryColor?: string;
    secondaryColor?: string;
    borderColor?: string;
    backgroundColor?: string;
    headerBackgroundColor?: string;
    rowHoverColor?: string;
    textColor?: string;
    headerTextColor?: string;
    fontSize?: string;
    padding?: string;
    borderRadius?: string;
    fontFamily?: string;
    boxShadow?: string;
}

export interface TableTheme {
    tokens?: TableTokens;
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

import type { BaseTableSettings, BaseRowSettings } from './core/engine';

export type TableSortDirection = 'asc' | 'desc' | null;

export interface TableSortState {
    columnKey: string;
    direction: TableSortDirection;
}

export type TableFilters = Record<string, string>;

export interface TableSettings extends BaseTableSettings {
    showColumnBorders?: boolean;
    resizable?: boolean; // Global enable
    className?: string;
    style?: CSSProperties;
    containerStyle?: any; // For React Native
    theme?: TableTheme;
}

export interface RowSettings<T> extends BaseRowSettings {
    key?: string | ((record: T) => string);
    className?: string | ((record: T, index: number) => string);
    onClick?: (record: T) => void;
}

export interface TableComponents {
    Row?: React.ComponentType<any>;
    Cell?: React.ComponentType<any>;
    Header?: React.ComponentType<any>;
}

export interface TableProps<T> {
    data: T[];
    columns: Column<T>[];

    // Grouped settings
    settings?: TableSettings;
    rowSettings?: RowSettings<T>;

    // Callbacks
    onSort?: (sortState: TableSortState) => void;
    onFilter?: (filters: TableFilters) => void;
    onColumnUpdate?: (columns: Column<T>[]) => void;
    onCellEdit?: (record: T, key: string, value: any) => void;

    // Advanced
    components?: TableComponents;
}

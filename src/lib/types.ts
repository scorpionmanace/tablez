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
  freezable?: boolean; // Enable/disable freezing for this column
  draggable?: boolean; // Enable/disable reordering for this column
  type?: ColumnType; // Data type for formatting and editing
  format?: ColumnFormat; // Formatting options
  readOnly?: boolean | ((record: T) => boolean);
  disabled?: boolean | ((record: T) => boolean);
}

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'datetime';

export interface ColumnFormat {
  // Number options
  decimals?: number; // 0-20
  prefix?: string; // e.g. '$'
  suffix?: string; // e.g. '%'

  // Date/Time options
  dateFormat?: string; // Simple format string, e.g. 'YYYY-MM-DD'
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
  readOnlyColor?: string;
  disabledColor?: string;
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
  toolbar?: CSSProperties;
  toolbarButton?: CSSProperties;
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
  containerStyle?: CSSProperties; // For React Native
  theme?: TableTheme;
  contextMenu?: {
    enabled?: boolean;
    items?: (ContextMenuItem | ContextMenuDefaultOption)[];
    /** @deprecated Use items instead */
    options?: ContextMenuDefaultOption[];
    /** @deprecated Use items instead */
    customActions?: {
      label: string;
      onClick: (record: any, column: Column<any>) => void;
      shortcut?: string;
    }[];
  };
  toolbar?: ToolbarSettings;
}

export interface ToolbarItem<T = any> {
  key: string;
  label?: ReactNode;
  icon?: ReactNode;
  onClick?: (data: T[], columns: Column<T>[]) => void;
  render?: (params: {
    data: T[];
    columns: Column<T>[];
    filters: Record<string, string>;
    theme: TableTheme;
  }) => ReactNode;
  disabled?: boolean | ((data: T[], columns: Column<T>[]) => boolean);
  hidden?: boolean | ((data: T[], columns: Column<T>[]) => boolean);
  className?: string;
  style?: CSSProperties;
  buttonProps?: any; // To allow passing arbitrary button attributes
}

export interface ToolbarSettings<T = any> {
  enabled?: boolean;
  position?: 'top' | 'bottom';
  items?: (ToolbarItem<T> | 'download' | 'search' | 'separator')[];
  downloadOptions?: ('csv' | 'xlsx' | 'pdf' | 'tsv')[];
  className?: string;
  style?: CSSProperties;
}

export type ContextMenuDefaultOption =
  | 'hideRow'
  | 'hideColumn'
  | 'insertRowBelow'
  | 'insertRowAbove'
  | 'insertColumnLeft'
  | 'insertColumnRight'
  | 'renameColumn'
  | 'undo'
  | 'redo'
  | 'copy'
  | 'cut'
  | 'paste'
  | 'pasteSpecial'
  | 'copyTableWithHeader'
  | 'copyTableWithoutHeader';

export interface ContextMenuItem {
  label?: string;
  icon?: ReactNode;
  shortcut?: string;
  onClick?: (record: any, column: Column<any>) => void;
  children?: (ContextMenuItem | ContextMenuDefaultOption)[];
  type?: 'separator' | 'item';
  disabled?: boolean;
}

export interface RowSettings<T> extends BaseRowSettings {
  key?: string | ((record: T) => string);
  className?: string | ((record: T, index: number) => string);
  onClick?: (record: T) => void;
  readOnly?: boolean | ((record: T) => boolean);
  disabled?: boolean | ((record: T) => boolean);
}

export interface TableComponents {
  Row?: React.ComponentType<any>;
  Cell?: React.ComponentType<any>;
  Header?: React.ComponentType<any>;
}

export interface TableProps<T extends Record<string, any>> {
  data: T[];
  columns: Column<T>[];

  // Grouped settings
  settings?: TableSettings;
  rowSettings?: RowSettings<T>;

  // Callbacks
  onSort?: (sortState: TableSortState) => void;
  onFilter?: (filters: TableFilters) => void;
  onColumnUpdate?: (columns: Column<T>[]) => void;
  onColumnOrderChange?: (columnKeys: string[]) => void;
  onCellEdit?: (record: T, key: string, value: any) => void;
  onDataChange?: (newData: T[]) => void;

  // State (Optional for controlled mode)
  sortState?: TableSortState;
  filters?: TableFilters;

  // Advanced
  components?: TableComponents;
}

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
  /** Tooltip shown on cell hover. Can be a static string or a function returning a string. */
  tooltip?: string | ((value: any, record: T) => string);
  /** Allow users to select/copy text within this cell without entering edit mode */
  allowTextSelection?: boolean;
  /** Options for select/dropdown editor. Used when type is 'select'. */
  options?: Array<{ label: string; value: any } | string>;
  /** Flash cell background when value changes */
  highlight?: boolean;
  /** colSpan for this cell */
  colSpan?: number | ((record: T, index: number) => number);
  /** rowSpan for this cell */
  rowSpan?: number | ((record: T, index: number) => number);
  /** Sparkline config — renders a mini chart inside the cell */
  sparkline?: SparklineConfig;
  /** Aggregate function for grouped/total rows */
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  /** Full-width row renderer — when set on a column, spans all columns */
  fullWidthRender?: (record: any) => ReactNode;
  /** Hide this column from the table (still appears in columns panel) */
  hidden?: boolean;
}

export type ColumnType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'largeText';

export interface SparklineConfig {
  type: 'bar' | 'line' | 'area';
  /** Color of the sparkline. default: primary color */
  color?: string;
  /** Width of the sparkline. default: column width minus padding */
  width?: number;
  /** Height of the sparkline. default: 30 */
  height?: number;
}

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
  /** Column grouping configuration — renders a parent header row above regular headers */
  columnGroups?: ColumnGroup[];
  /** Allow rows to be dragged to reorder. Fires onRowReorder when a drag is completed. */
  draggableRows?: boolean;
  /** Show always-visible filter inputs directly below the column headers */
  floatingFilters?: boolean;
  /** Group rows by these column keys (first key is primary). Renders collapsible group header rows. */
  groupBy?: string[];
  /** Enable cell range selection (shift-click or click+drag). */
  enableRangeSelection?: boolean;
  /** Enable fill handle (drag bottom-right corner of range selection to fill values). */
  enableFillHandle?: boolean;
  /** Master-detail configuration — expand a row to show a custom detail view */
  masterDetail?: MasterDetailSettings;
  /** Status bar shown at the bottom of the table with row count, sum, avg, etc. */
  statusBar?: import('./Table/StatusBar').StatusBarSettings;
  /** Show auto-incrementing row number column on the far left */
  showRowNumbers?: boolean;
  /** Width of the row number column in px. default: 50 */
  rowNumberWidth?: number;
  /** Row selection configuration */
  selection?: SelectionSettings;
  /** Pagination configuration */
  pagination?: PaginationSettings;
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
  treeSettings?: TreeSettings;
  /** Columns tool panel — sidebar for showing/hiding/reordering columns */
  sidePanel?: SidePanelSettings;
  /** Infinite scroll — fires onLoadMore when user scrolls near the bottom */
  infiniteScroll?: InfiniteScrollSettings;
  /** Animate row insertions and removals with CSS transitions */
  animateRows?: boolean;
  /** Accessible label for the table element */
  ariaLabel?: string;
  /** Enable cell-level commenting for multi-user collaboration */
  enableComments?: boolean;
}

export interface TreeSettings<T = any> {
  /** Enable hierarchical row support. default: false */
  enabled?: boolean;
  /** Key in data containing child rows. default: 'children' */
  childrenKey?: keyof T | string;
  /** Pixels of indentation per level. default: 20 */
  indentSize?: number;
  /** Column key to show expansion toggle. default: first column */
  expandColumnKey?: string;
  /** Initial expansion state. default: false */
  defaultExpanded?: boolean;
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
  items?: (
    | ToolbarItem<T>
    | 'download'
    | 'search'
    | 'columns'
    | 'import'
    | 'comment'
    | 'separator'
  )[];
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

export interface MasterDetailSettings {
  /** Render function for the detail panel. Receives the row record. */
  detailRenderer: (record: any) => ReactNode;
  /** Height of the detail row in px. default: 200 */
  detailHeight?: number;
  /** Column key that shows the expand/collapse toggle. default: first column */
  expandColumnKey?: string;
}

/**
 * ColumnGroup groups multiple columns under a shared parent header label.
 * Use in `columnGroups` prop of TableSettings.
 */
export interface ColumnGroup {
  /** Display title shown in the parent header row */
  title: ReactNode;
  /** Keys of the columns belonging to this group */
  columnKeys: string[];
  /** Optional custom styles for the group header cell */
  headerStyle?: CSSProperties;
  /** Optional custom class for the group header cell */
  headerClassName?: string;
}

export interface PaginationSettings {
  /** Enable pagination. default: false */
  enabled?: boolean;
  /** Rows per page. default: 25 */
  pageSize?: number;
  /** Available page size options shown in dropdown. default: [10, 25, 50, 100] */
  pageSizeOptions?: number[];
  /** Allow changing page size via dropdown. default: true */
  showPageSizeSelector?: boolean;
  /** Position: 'top' | 'bottom' | 'both'. default: 'bottom' */
  position?: 'top' | 'bottom' | 'both';
}

export interface SelectionSettings {
  /** 'single' allows only one row at a time; 'multi' allows multiple. default: 'multi' */
  mode?: 'single' | 'multi';
  /** Show checkbox column. default: true for 'multi', false for 'single' */
  showCheckbox?: boolean;
  /** Position of the checkbox column. default: 'left' */
  checkboxPosition?: 'left' | 'right';
  /** Width of the checkbox column in px. default: 40 */
  checkboxWidth?: number;
}

export interface SidePanelSettings {
  /** Show the columns panel. default: false */
  enabled?: boolean;
  /** Start with the panel open. default: false */
  defaultOpen?: boolean;
  /** Width of the panel in px. default: 240 */
  width?: number;
}

/**
 * A comment attached to a specific cell, identified by rowKey + columnKey.
 * Designed for multi-user collaboration: the table emits new/deleted/resolved
 * comments via callbacks and displays whatever is in the `comments` prop.
 */
export interface CellComment {
  /** Unique identifier for this comment */
  id: string;
  /** Row identifier matching the value returned by rowSettings.key */
  rowKey: string | number;
  /** Column key the comment is attached to */
  columnKey: string;
  /** Comment body text */
  text: string;
  /** Display name of the author */
  author?: string;
  /** ISO 8601 string or epoch-ms timestamp */
  timestamp?: string | number;
  /** Whether this comment thread has been resolved */
  resolved?: boolean;
}

export interface InfiniteScrollSettings {
  /** Callback fired when the user scrolls near the bottom */
  onLoadMore: () => void;
  /** Whether there is more data to load. default: true */
  hasMore?: boolean;
  /** Show a loading spinner while more data is being fetched */
  loadingMore?: boolean;
  /** Distance from the bottom (px) that triggers onLoadMore. default: 100 */
  threshold?: number;
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
  /** Fired when row selection changes. Receives array of selected row keys. */
  onRowSelect?: (selectedKeys: (string | number)[], record: T, selected: boolean) => void;
  /** Fired after user drags a row to a new position. Receives the new reordered data array. */
  onRowReorder?: (newData: T[]) => void;

  // State (Optional for controlled mode)
  sortState?: TableSortState;
  filters?: TableFilters;
  /** Controlled selection — array of row keys that should be selected */
  selectedRows?: (string | number)[];

  // Comments (multi-user collaboration)
  /** Controlled list of cell comments to display */
  comments?: CellComment[];
  /** Fired when the user submits a new comment. id is pre-generated (nanoid-style). */
  onCommentAdd?: (comment: CellComment) => void;
  /** Fired when the user deletes a comment */
  onCommentDelete?: (commentId: string) => void;
  /** Fired when the user marks a comment thread as resolved */
  onCommentResolve?: (commentId: string) => void;

  // Advanced
  components?: TableComponents;
}

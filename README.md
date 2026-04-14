# @scorpionmanace/tablez

A modern, highly customizable, and performant React data table library with AG Grid-level feature parity.

Features:
- 🎨 **Theming Support** — Token-based themes with full component-level overrides
- 🌳 **Tree / Hierarchical Rows** — Deeply nested data with virtualization and search
- ⚡ **Virtual Scrolling** — Efficient rendering for 100,000+ rows
- ✅ **Row Selection** — Single/multi with checkbox column and shift-click range
- 📄 **Pagination** — Client-side page navigation with configurable page sizes
- 🔢 **Row Numbers** — Auto-incrementing row number column
- 🏷️ **Cell Tooltips** — Static or dynamic tooltip on any column
- 🗂️ **Column Groups** — Span multiple columns under a shared parent header
- ↕️ **Row Dragging** — Drag rows to reorder with `onRowReorder` callback
- 🔍 **Floating Filters** — Always-visible filter row below the header
- ✏️ **Rich Cell Editors** — Text, number, date, select/dropdown, boolean checkbox, large-text overlay
- ⚡ **Change Highlighting** — Flash cell background when a value changes
- 📊 **Status Bar** — Bottom bar with row count, selected count, sum/avg/min/max
- 🔤 **Cell Text Selection** — Allow native text highlight in any column
- 📦 **Row Grouping & Aggregation** — Group flat data by column value with collapsible groups and SUM/AVG/COUNT/MIN/MAX
- 🔎 **Master-Detail** — Expand a row to reveal a custom detail panel
- 🟦 **Cell Range Selection** — Click+drag or shift-click to select a rectangle of cells
- 🔲 **Fill Handle** — Drag the selection corner to fill values across a range
- ↔️ **Column & Row Spanning** — `colSpan` / `rowSpan` per cell
- 📋 **Columns Tool Panel** — Sidebar for interactively showing, hiding, and reordering columns
- ♾️ **Infinite Scroll** — `onLoadMore` callback when the user reaches the bottom
- 🎞️ **Row Animation** — Smooth CSS transitions on row insert/remove/move
- ♿ **Accessibility** — Full ARIA attributes (`role`, `aria-sort`, `aria-selected`, etc.)
- 📈 **Sparklines** — Inline bar, line, or area mini-charts in cells
- 📥 **CSV/Excel Import** — Upload a `.csv` or `.xlsx` file via the toolbar
- 🧮 **Formula Engine** — Excel-like formulas (`IF`, `SUM`, `IMG`, …)
- 🛠️ **Advanced Toolbar** — Search, download, column panel, import, custom actions
- 🌐 **Client & Server Mode** — Local or server-side data processing
- 📐 **Resizable & Reorderable Columns** — Drag-to-resize and drag-to-reorder
- ⚛️ **TypeScript Ready** — Full type support out of the box

---

## 📦 Installation

```bash
npm install @scorpionmanace/tablez
```

---

## 🚀 Quick Start

```tsx
import { Table } from '@scorpionmanace/tablez';

const columns = [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  { key: 'name', title: 'Name', sortable: true, filterable: true },
  { key: 'status', title: 'Status', type: 'select', options: ['Active', 'Inactive'] },
];

function App() {
  return (
    <Table
      data={data}
      columns={columns}
      settings={{ mode: 'client', virtualized: true, containerHeight: 500 }}
      rowSettings={{ key: 'id', onClick: (r) => console.log(r) }}
    />
  );
}
```

---

## ✅ Row Selection

Enable single or multi-row selection with an optional checkbox column.

```tsx
<Table
  data={data}
  columns={columns}
  settings={{
    selection: {
      mode: 'multi',          // 'single' | 'multi'
      showCheckbox: true,     // default: true for multi
      checkboxPosition: 'left', // 'left' | 'right'
      checkboxWidth: 40,
    }
  }}
  selectedRows={selectedKeys}   // controlled
  onRowSelect={(keys, record, selected) => setSelectedKeys(keys)}
/>
```

Shift-click selects a contiguous range of rows.

---

## 📄 Pagination

Client-side pagination with a configurable page-size selector.

```tsx
settings={{
  pagination: {
    enabled: true,
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
    showPageSizeSelector: true,
    position: 'bottom', // 'top' | 'bottom' | 'both'
  }
}}
```

---

## 🔢 Row Numbers

Auto-incrementing row number column on the far left.

```tsx
settings={{ showRowNumbers: true, rowNumberWidth: 50 }}
```

---

## 🏷️ Cell Tooltips

Static or dynamic tooltip shown on cell hover.

```tsx
const columns = [
  {
    key: 'status',
    title: 'Status',
    tooltip: (value, record) => `Last updated: ${record.updatedAt}`,
  },
];
```

---

## 🗂️ Column Groups

Render a parent header row that spans multiple columns.

```tsx
settings={{
  columnGroups: [
    { title: 'Personal Info', columnKeys: ['firstName', 'lastName', 'age'] },
    { title: 'Contact',       columnKeys: ['email', 'phone'] },
  ]
}}
```

---

## ↕️ Row Dragging

Drag rows to reorder. Fires `onRowReorder` (or `onDataChange`) on drop.

```tsx
settings={{ draggableRows: true }}
onRowReorder={(newData) => setData(newData)}
```

---

## 🔍 Floating Filters

Always-visible filter inputs rendered directly below the column headers.

```tsx
settings={{ floatingFilters: true }}
```

---

## ✏️ Cell Editors

Set `column.type` to choose the editor that opens on double-click.

| Type | Editor |
|------|--------|
| `'string'` (default) | Text input |
| `'number'` | Numeric input |
| `'date'` / `'datetime'` | Date picker calendar |
| `'boolean'` | Inline checkbox (no double-click needed) |
| `'select'` | Dropdown with `column.options` |
| `'largeText'` | Floating resizable textarea |

```tsx
const columns = [
  { key: 'active',   title: 'Active',   type: 'boolean', editable: true },
  { key: 'priority', title: 'Priority', type: 'select',
    options: ['Low', 'Medium', 'High'], editable: true },
  { key: 'notes',    title: 'Notes',    type: 'largeText', editable: true },
];
```

---

## ⚡ Change Highlighting

Flash a cell's background color when its value changes.

```tsx
{ key: 'price', title: 'Price', highlight: true }
```

---

## 📊 Status Bar

Bottom bar showing aggregate stats across the current data set.

```tsx
settings={{
  statusBar: {
    showRowCount: true,
    showSelectedCount: true,
    aggregates: [
      { columnKey: 'revenue', label: 'Revenue', fns: ['sum', 'avg'] },
    ],
  }
}}
```

---

## 📦 Row Grouping & Aggregation

Group flat data by one or more column values. Groups are collapsible. Aggregate values are computed per group using `column.aggregate`.

```tsx
settings={{ groupBy: ['department'] }}

const columns = [
  { key: 'department', title: 'Department' },
  { key: 'salary',     title: 'Salary', aggregate: 'sum' },
  { key: 'age',        title: 'Age',    aggregate: 'avg' },
];
```

Supported aggregate functions: `'sum'` | `'avg'` | `'count'` | `'min'` | `'max'`

---

## 🔎 Master-Detail

Expand a row to reveal a custom detail panel rendered below it.

```tsx
settings={{
  masterDetail: {
    detailRenderer: (record) => <OrderDetail order={record} />,
    detailHeight: 200,
  }
}}
```

Clicking a non-group row toggles the detail panel.

---

## 🟦 Cell Range Selection & Fill Handle

Click and drag (or shift-click) to select a rectangular range of cells. Optionally drag the fill handle to copy the top-left value across the range.

```tsx
settings={{
  enableRangeSelection: true,
  enableFillHandle: true,
}}
onCellEdit={(record, key, value) => { /* update your data */ }}
```

---

## ↔️ Column & Row Spanning

Use `colSpan` or `rowSpan` on any column to merge adjacent cells.

```tsx
const columns = [
  {
    key: 'name',
    title: 'Name',
    colSpan: (record) => record.isHeader ? 3 : 1,
  },
];
```

---

## 📋 Columns Tool Panel

A sidebar for interactively showing/hiding and reordering columns. Add `'columns'` to the toolbar items to provide a toggle button.

```tsx
settings={{
  toolbar: {
    enabled: true,
    items: ['search', 'separator', 'columns', 'download'],
  },
  sidePanel: {
    enabled: true,
    defaultOpen: false,
    width: 240,
  }
}}
```

The panel renders a drag-to-reorder list with checkboxes and "Show all" / "Hide all" shortcuts. You can also set `column.hidden: true` directly.

---

## ♾️ Infinite Scroll

Fire a callback when the user scrolls near the bottom to load more data.

```tsx
settings={{
  infiniteScroll: {
    onLoadMore: () => fetchNextPage(),
    hasMore: true,
    loadingMore: isFetching,
    threshold: 100, // px from bottom
  }
}}
```

A "Loading more…" row is displayed while `loadingMore` is `true`.

---

## 🎞️ Row Animation

Enable CSS transitions on rows for smooth insert/remove/move effects.

```tsx
settings={{ animateRows: true }}
```

---

## ♿ Accessibility

Every interactive element has proper ARIA attributes:

- `<table role="grid" aria-label="…" aria-busy aria-rowcount>`
- `<thead role="rowgroup">`
- `<tr role="row" aria-selected>`
- `<th role="columnheader" aria-sort="ascending | descending | none">`
- `<td role="gridcell">`

Set a label via `settings.ariaLabel`.

---

## 📈 Sparklines

Render inline SVG mini-charts inside any cell by setting `column.sparkline`. The cell value must be a `number[]`.

```tsx
const columns = [
  {
    key: 'history',
    title: 'Trend',
    width: 120,
    sparkline: {
      type: 'area',   // 'bar' | 'line' | 'area'
      color: '#3b82f6',
      height: 30,
    },
  },
];

const data = [{ id: 1, history: [12, 45, 23, 67, 34, 89, 56] }];
```

---

## 📥 CSV/Excel Import

Add the `'import'` toolbar item to let users upload a `.csv`, `.tsv`, or `.xlsx` file. Parsed rows are delivered via `onDataChange`.

```tsx
settings={{
  toolbar: {
    enabled: true,
    items: ['import', 'separator', 'download'],
  }
}}
onDataChange={(rows) => setData(rows)}
```

The parser auto-detects comma vs. tab delimiters, handles quoted fields, and coerces numeric strings to numbers.

---

## 🧮 Formula Engine

Define dynamic calculations in column definitions with Excel-like syntax.

```tsx
const columns = [
  { key: 'price', title: 'Price' },
  { key: 'qty',   title: 'Qty' },
  { key: 'total', title: 'Total', formula: '={price} * {qty}', sortable: true },
  { key: 'badge', title: 'Status',
    formula: "=IF({active}, '✅ Online', '❌ Offline')" },
  { key: 'avatar', title: 'Photo',
    formula: "=IMG('https://example.com/' + {username}, {username}, 40, 40)" },
];
```

**Built-in functions:** `IF`, `AND`, `OR`, `NOT`, `SUM`, `AVG`, `MIN`, `MAX`, `ROUND`, `ABS`, `CONCAT`, `UPPER`, `LOWER`, `LEN`, `IMG`

---

## 🎨 Theming

### Token-Based (Easiest)

```tsx
const darkTheme = {
  tokens: {
    primaryColor: '#8b5cf6',
    backgroundColor: '#0f172a',
    headerBackgroundColor: '#1e293b',
    borderColor: '#334155',
    textColor: '#f8fafc',
    headerTextColor: '#e2e8f0',
    rowHoverColor: '#334155',
    borderRadius: '12px',
    padding: '16px 24px',
    fontFamily: 'Inter, sans-serif',
  }
};

<Table data={data} columns={columns} settings={{ theme: darkTheme }} />
```

### Available Tokens

| Token | Description |
|-------|-------------|
| `primaryColor` | Accent color for inputs, checkboxes, and active states |
| `borderColor` | All borders and separators |
| `backgroundColor` | Main background |
| `headerBackgroundColor` | Sticky header background |
| `rowHoverColor` | Row hover background |
| `textColor` | Primary body text |
| `headerTextColor` | Header text |
| `padding` | Global cell padding |
| `borderRadius` | Corner radius for inputs and menus |
| `fontFamily` | Font stack |
| `fontSize` | Base font size |
| `readOnlyColor` | Muted color for read-only cells |
| `disabledColor` | Color hint for disabled cells |
| `boxShadow` | Shadow applied to menus and panels |

### Component Overrides (Advanced)

```tsx
const customTheme = {
  headerCell: { textTransform: 'uppercase', letterSpacing: '0.1em' },
  cell:       { fontVariantNumeric: 'tabular-nums' },
  menuItem:   { fontSize: '12px' },
};
```

---

## 🛠️ Toolbar Reference

```tsx
settings={{
  toolbar: {
    enabled: true,
    position: 'top', // 'top' | 'bottom'
    items: [
      'search',       // global text search
      'separator',    // visual divider
      'columns',      // toggle columns tool panel
      'import',       // upload CSV/Excel
      'download',     // export CSV/XLSX/PDF/TSV
      {               // custom button
        key: 'refresh',
        label: 'Refresh',
        icon: <RefreshIcon />,
        onClick: (data, columns) => refetch(),
      },
    ],
    downloadOptions: ['csv', 'xlsx', 'pdf', 'tsv'],
  }
}}
```

---

## 🌳 Tree / Hierarchical Rows

```tsx
const data = [
  {
    id: 1,
    name: 'Engineering',
    children: [
      { id: 2, name: 'Frontend' },
      { id: 3, name: 'Backend' },
    ],
  },
];

<Table
  data={data}
  columns={columns}
  settings={{
    treeSettings: {
      enabled: true,
      childrenKey: 'children',
      expandColumnKey: 'name',
      indentSize: 20,
      defaultExpanded: false,
    }
  }}
/>
```

- Parents are automatically kept visible when a search matches a child.
- Siblings at every level are sorted independently.

---

## 🚀 Headless / Multi-Framework Support

All the core logic (virtualization, sorting, filtering) is framework-agnostic.

### Vanilla JS

```ts
import { TablezEngine } from '@scorpionmanace/tablez';

const engine = new TablezEngine({
  data, columns,
  settings: { containerHeight: 500, virtualized: true },
  rowSettings: { height: 50 },
  onUpdate: (state) => renderMyTable(state),
});

container.onscroll = (e) => engine.setScrollTop(e.target.scrollTop);
```

### Vue 3

```ts
import { calculateVirtualization } from '@scorpionmanace/tablez';

const virtualization = computed(() =>
  calculateVirtualization({ scrollTop: scrollTop.value, height: 50, containerHeight: 500, dataLength: data.length })
);
```

### React Native

```tsx
import { TableNative } from '@scorpionmanace/tablez/native';

<TableNative data={data} columns={columns} rowSettings={{ height: 60 }} />
```

---

## 📜 API Reference

### `TableProps`

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Row data |
| `columns` | `Column<T>[]` | Column definitions |
| `settings?` | `TableSettings` | Table-level settings |
| `rowSettings?` | `RowSettings<T>` | Row-level settings |
| `onSort?` | `(state: TableSortState) => void` | Sort change callback |
| `onFilter?` | `(filters: TableFilters) => void` | Filter change callback |
| `onColumnUpdate?` | `(columns: Column<T>[]) => void` | Column definition change |
| `onColumnOrderChange?` | `(keys: string[]) => void` | Column reorder callback |
| `onCellEdit?` | `(record: T, key: string, value: any) => void` | Cell edit callback |
| `onDataChange?` | `(newData: T[]) => void` | Bulk data change (import, row ops) |
| `onRowSelect?` | `(keys: (string\|number)[], record: T, selected: boolean) => void` | Selection change |
| `onRowReorder?` | `(newData: T[]) => void` | Row drag-to-reorder callback |
| `sortState?` | `TableSortState` | Controlled sort |
| `filters?` | `TableFilters` | Controlled filters |
| `selectedRows?` | `(string\|number)[]` | Controlled selection |
| `components?` | `TableComponents` | Custom Row/Cell/Header components |

### `TableSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode?` | `'client' \| 'server'` | `'client'` | Data processing mode |
| `virtualized?` | `boolean` | `false` | Enable virtual scrolling |
| `containerHeight?` | `number` | `500` | Height of the scroll container (px) |
| `loading?` | `boolean` | `false` | Show loading opacity |
| `showColumnBorders?` | `boolean` | `true` | Vertical cell borders |
| `resizable?` | `boolean` | `false` | Enable column resize |
| `draggableColumns?` | `boolean` | `false` | Enable column drag-to-reorder |
| `draggableRows?` | `boolean` | `false` | Enable row drag-to-reorder |
| `frozenRows?` | `number` | — | Number of sticky rows at the top |
| `showRowNumbers?` | `boolean` | `false` | Auto-incrementing row number column |
| `rowNumberWidth?` | `number` | `50` | Row number column width (px) |
| `floatingFilters?` | `boolean` | `false` | Always-visible filter row |
| `enableRangeSelection?` | `boolean` | `false` | Cell range selection |
| `enableFillHandle?` | `boolean` | `false` | Fill handle on selected range |
| `animateRows?` | `boolean` | `false` | CSS transitions on row changes |
| `ariaLabel?` | `string` | — | `aria-label` for the `<table>` element |
| `groupBy?` | `string[]` | — | Column keys to group rows by |
| `selection?` | `SelectionSettings` | — | Row selection configuration |
| `pagination?` | `PaginationSettings` | — | Pagination configuration |
| `columnGroups?` | `ColumnGroup[]` | — | Parent header row grouping |
| `masterDetail?` | `MasterDetailSettings` | — | Row expand to detail panel |
| `statusBar?` | `StatusBarSettings` | — | Bottom aggregate bar |
| `sidePanel?` | `SidePanelSettings` | — | Columns tool panel |
| `infiniteScroll?` | `InfiniteScrollSettings` | — | Infinite scroll / load-more |
| `treeSettings?` | `TreeSettings` | — | Hierarchical row settings |
| `toolbar?` | `ToolbarSettings` | — | Toolbar configuration |
| `contextMenu?` | `{ enabled?, items? }` | — | Right-click context menu |
| `theme?` | `TableTheme` | — | Theme tokens and overrides |

### `Column<T>`

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Data field key |
| `title` | `ReactNode` | Header label |
| `width?` | `number` | Column width (px) |
| `render?` | `(value, record, index) => ReactNode` | Custom cell renderer |
| `headerRender?` | `(column) => ReactNode` | Custom header renderer |
| `type?` | `ColumnType` | `'string' \| 'number' \| 'boolean' \| 'date' \| 'datetime' \| 'select' \| 'largeText'` |
| `format?` | `ColumnFormat` | Numeric/date formatting options |
| `options?` | `Array<{label, value} \| string>` | Options for `'select'` editor |
| `formula?` | `string` | Excel-like formula (e.g. `'={a} + {b}'`) |
| `editable?` | `boolean \| ((record) => boolean)` | Enable inline editing |
| `readOnly?` | `boolean \| ((record) => boolean)` | Show lock icon, block edits |
| `disabled?` | `boolean \| ((record) => boolean)` | Grey out and block all interaction |
| `hidden?` | `boolean` | Hide column (still appears in tool panel) |
| `sortable?` | `boolean` | Enable sort on click |
| `filterable?` | `boolean` | Enable column filter |
| `fixed?` | `'left' \| 'right'` | Freeze column to left or right |
| `resizable?` | `boolean` | Per-column resize override |
| `draggable?` | `boolean` | Per-column drag-to-reorder override |
| `freezable?` | `boolean` | Show/hide freeze option in column menu |
| `align?` | `'left' \| 'center' \| 'right'` | Cell content alignment |
| `tooltip?` | `string \| ((value, record) => string)` | Hover tooltip |
| `highlight?` | `boolean` | Flash background on value change |
| `allowTextSelection?` | `boolean` | Allow native text selection in cell |
| `colSpan?` | `number \| ((record, index) => number)` | Merge columns |
| `rowSpan?` | `number \| ((record, index) => number)` | Merge rows |
| `aggregate?` | `'sum' \| 'avg' \| 'count' \| 'min' \| 'max'` | Group aggregate function |
| `sparkline?` | `SparklineConfig` | Inline mini-chart (value must be `number[]`) |
| `fullWidthRender?` | `(record) => ReactNode` | Full-width row renderer |
| `style?` | `CSSProperties` | Custom cell style |
| `headerStyle?` | `CSSProperties` | Custom header cell style |
| `className?` | `string` | Custom cell class |
| `headerClassName?` | `string` | Custom header cell class |

### `RowSettings<T>`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `key?` | `string \| ((record) => string)` | — | Unique row identifier |
| `height?` | `number` | `50` | Row height (px) |
| `overscan?` | `number` | `3` | Virtual scroll overscan rows |
| `className?` | `string \| ((record, index) => string)` | — | Row CSS class |
| `onClick?` | `(record) => void` | — | Row click handler |
| `readOnly?` | `boolean \| ((record) => boolean)` | — | Row-level read-only |
| `disabled?` | `boolean \| ((record) => boolean)` | — | Row-level disabled |

### `SelectionSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode?` | `'single' \| 'multi'` | `'multi'` | Selection mode |
| `showCheckbox?` | `boolean` | `true` for multi | Show checkbox column |
| `checkboxPosition?` | `'left' \| 'right'` | `'left'` | Checkbox column side |
| `checkboxWidth?` | `number` | `40` | Checkbox column width (px) |

### `PaginationSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled?` | `boolean` | `false` | Enable pagination |
| `pageSize?` | `number` | `25` | Rows per page |
| `pageSizeOptions?` | `number[]` | `[10,25,50,100]` | Page size dropdown options |
| `showPageSizeSelector?` | `boolean` | `true` | Show page size dropdown |
| `position?` | `'top' \| 'bottom' \| 'both'` | `'bottom'` | Pagination bar position |

### `SidePanelSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled?` | `boolean` | `false` | Enable the panel |
| `defaultOpen?` | `boolean` | `false` | Start with panel open |
| `width?` | `number` | `240` | Panel width (px) |

### `InfiniteScrollSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `onLoadMore` | `() => void` | — | Fired when near the bottom |
| `hasMore?` | `boolean` | `true` | Set `false` to stop firing |
| `loadingMore?` | `boolean` | `false` | Show loading indicator row |
| `threshold?` | `number` | `100` | Distance from bottom (px) to trigger |

### `SparklineConfig`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `'bar' \| 'line' \| 'area'` | — | Chart style |
| `color?` | `string` | primary color | Sparkline color |
| `width?` | `number` | column width − 16 | SVG width (px) |
| `height?` | `number` | `30` | SVG height (px) |

### `TreeSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled?` | `boolean` | `false` | Enable tree mode |
| `childrenKey?` | `string` | `'children'` | Key containing child rows |
| `indentSize?` | `number` | `20` | Indent per level (px) |
| `expandColumnKey?` | `string` | first column | Column showing expand toggle |
| `defaultExpanded?` | `boolean` | `false` | Start all rows expanded |

---

## 🧪 Testing

```bash
npm test
```

---

## 🔄 Changelog

### 1.0.0
- Row selection (single/multi, checkbox, shift-click range, controlled state)
- Pagination (client-side, configurable page sizes and positions)
- Row numbers (auto-incrementing column)
- Cell tooltips (static and dynamic)
- Column groups (parent header row)
- Row dragging to reorder
- Floating filters (persistent filter row)
- Rich cell editors: `select`, `boolean`, `largeText`
- Change highlighting (flash on value delta)
- Status bar (row count, selected count, column aggregates)
- Cell text selection
- Row grouping and aggregation (SUM/AVG/COUNT/MIN/MAX)
- Master-detail rows (custom expandable detail panel)
- Cell range selection and fill handle
- Full-width rows
- Column and row spanning (`colSpan` / `rowSpan`)
- Columns tool panel (sidebar show/hide/reorder with drag)
- Infinite scroll (`onLoadMore`)
- Row animation (CSS transitions)
- Full ARIA accessibility (`role`, `aria-sort`, `aria-selected`, …)
- Sparklines (bar, line, area SVG mini-charts)
- CSV/Excel import via toolbar

### 0.0.5
- API reorganized into `settings` / `rowSettings` for multi-framework support
- Formula engine (`IF`, `SUM`, `IMG`, …)
- Excel-compatible XLSX export
- Virtual scrolling and frozen rows
- Tree/hierarchical row expansion
- Column freeze (left/right), resize, drag-to-reorder
- Context menu with copy/cut/paste/hide/insert/undo/redo
- Dark theme and token-based theming

---

## License

MIT

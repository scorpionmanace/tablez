# @scorpionmanace/tablez

A modern, highly customizable, and performant React data table library.

Features:
- 🎨 **Theming Support**: Fully customizable token-based themes with dynamic variable support.
- 🌳 **Hierarchical Row Expansion**: Support for deeply nested data with virtualization and search.
- ⚡ **Virtual Scrolling**: Efficient rendering for 100,000+ rows.
- 🛠️ **Advanced Toolbar**: Built-in search, export, and custom action support.
- 🔍 **Filtering & Sorting**: Multi-column filtering and sorting (per-level in tree mode).
- 🌐 **Client & Server Side**: Support for both local and server-side data processing.
- 📐 **Resizable Columns**: Drag-to-resize and reorder support.
- ⚛️ **TypeScript Ready**: Full type support out of the box.

## 📦 Installation

```bash
npm install @scorpionmanace/tablez
```

## 🚀 Quick Start (React)

```tsx
import { Table } from '@scorpionmanace/tablez';

const columns = [
  { key: 'id', title: 'ID', sortable: true },
  { key: 'name', title: 'Name', sortable: true, filterable: true },
];

function App() {
  return (
    <Table
      data={data}
      columns={columns}
      settings={{
        mode: "client",
        virtualized: true,
        containerHeight: 500
      }}
      rowSettings={{
        key: "id",
        onClick: (record) => console.log("Clicked row", record)
      }}
    />
  );
}
```

## 🚀 Headless / Multi-Framework Support

Tablez is built on a **Headless Engine**. All the logic (virtualization math, sorting, filtering) is framework-agnostic.

### Vanilla JS / Generic Wrapper
Use the `TablezEngine` class to manage state in any environment.

```ts
import { TablezEngine } from '@scorpionmanace/tablez';

const engine = new TablezEngine({
  data: myData,
  columns: myColumns,
  settings: {
    containerHeight: 500,
    virtualized: true
  },
  rowSettings: {
    height: 50
  },
  onUpdate: (state) => {
    // Render your UI using state.visibleData, state.offsetY, etc.
    renderMyTable(state);
  }
});

// Sync scroll
container.onscroll = (e) => engine.setScrollTop(e.target.scrollTop);
```

### Vue 3 (Composition API)
```ts
import { ref, computed } from 'vue';
import { calculateVirtualization } from '@scorpionmanace/tablez';

const scrollTop = ref(0);
const virtualization = computed(() => calculateVirtualization({
  scrollTop: scrollTop.value,
  height: 50,
  containerHeight: 500,
  dataLength: myData.length
}));
```

### Svelte (Stores)
```ts
import { writable, derived } from 'svelte/store';
import { calculateVirtualization } from '@scorpionmanace/tablez';

const scrollTop = writable(0);
const virtualization = derived(scrollTop, ($top) => calculateVirtualization({
  scrollTop: $top,
  height: 50,
  containerHeight: 500,
  dataLength: myData.length
}));
```

### Angular (Signals)
```ts
import { signal, computed } from '@angular/core';
import { calculateVirtualization } from '@scorpionmanace/tablez';

const scrollTop = signal(0);
const virtualization = computed(() => calculateVirtualization({
  scrollTop: scrollTop(),
  height: 50,
  containerHeight: 500,
  dataLength: myData.data.length
}));
```

### React Native
Tablez provides a first-class `TableNative` component built on `FlatList` for mobile performance.

```tsx
import { TableNative } from '@scorpionmanace/tablez/native';

<TableNative
  data={data}
  columns={[
    { key: 'id', title: 'ID', width: 60 },
    { key: 'name', title: 'Name', width: 200, sortable: true },
    { key: 'status', title: 'Status', width: 100 }
  ]}
  rowSettings={{
    height: 60
  }}
  onSort={(state) => console.log(state)}
/>
```



## 🧮 Excel-like Formula Support

Tablez includes a framework-agnostic Formula Engine. You can define dynamic calculations directly in your column definitions using Excel-like syntax.

### Key Capabilities:
- **Field References**: Use `{fieldKey}` to reference other data in the same row.
- **Built-in Functions**:
  - **Logic**: `IF`, `AND`, `OR`, `NOT`
  - **Math**: `SUM`, `AVG`, `MIN`, `MAX`, `ROUND`, `ABS`
  - **String**: `CONCAT`, `UPPER`, `LOWER`, `LEN`
  - **Media**: `IMG(url, alt, width, height)`

### Example usage:

```tsx
const columns = [
  { key: 'price', title: 'Price', width: 100 },
  { key: 'qty', title: 'Quantity', width: 100 },
  { 
    key: 'total', 
    title: 'Total', 
    formula: '={price} * {qty}',
    sortable: true 
  },
  {
    key: 'avatar',
    title: 'Profile',
    formula: "=IMG('https://avatar.io/' + {username}, {username}, 40, 40)"
  },
  {
    key: 'status_label',
    title: 'Status',
    formula: "=IF({active}, '✅ Online', '❌ Offline')"
  }
];
```

---

## 🎨 Bring Your Own Theme (BYOT)

Tablez features a powerful, two-layered theming system: **Tokens** and **Component Overrides**.

### Token-Based Theming (Easiest)
Tokens are high-level variables that drive the look and feel of the entire table.

```tsx
const midnightTheme = {
  tokens: {
    primaryColor: '#8b5cf6',
    backgroundColor: '#0f172a',
    headerBackgroundColor: '#1e293b',
    borderColor: '#334155',
    textColor: '#f8fafc',
    headerTextColor: '#e2e8f0',
    rowHoverColor: '#334155',
    borderRadius: '12px',
    padding: '16px 24px'
  }
};

<Table
  data={data}
  columns={columns}
  settings={{ theme: midnightTheme }}
/>
```

### Available Tokens
| Token | Description |
|-------|-------------|
| `primaryColor` | Accent color for inputs and active states |
| `borderColor` | Color for all borders and separators |
| `backgroundColor`| Main background color |
| `headerBackgroundColor`| Background for the sticky header |
| `rowHoverColor` | Background for rows on hover |
| `textColor` | Primary body text color |
| `headerTextColor`| Header text color |
| `padding` | Global cell padding |
| `borderRadius` | Corner radius for inputs and menus |
| `fontFamily` | Font stack |
| `readOnlyColor` | Text color for read-only cells (usually muted) |
| `disabledColor` | Background or text hint for disabled state |

### Component Overrides (Advanced)
For surgery-grade customization, you can override specific CSS properties for any part of the table. Component overrides take precedence over tokens.

```tsx
const customTheme = {
  headerCell: {
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  },
  menuItem: {
    fontSize: '12px',
    fontWeight: 'bold'
  }
};
```

---

## 🔄 Migrating to 0.0.5

The API was reorganized in v0.0.5 to support multi-framework usage and better readability.

| Old Prop | New Prop |
|----------|----------|
| `virtualized` | `settings.virtualized` |
| `rowKey` | `rowSettings.key` |
| `rowClassName` | `rowSettings.className` |
| `onRowClick` | `rowSettings.onClick` |
| `theme` | `settings.theme` |
| `containerHeight` | `settings.containerHeight` |

---

## 📜 API

### `Table` Props (React)

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` (Required) | Array of data records to display |
| `columns` | `Column<T>[]` (Required) | Column definitions |
| `settings` | `TableSettings` | Table-wide configurations |
| `rowSettings`| `RowSettings` | Row-specific configurations |
| `onSort` | `(state: TableSortState) => void` | Server-mode sort callback |
| `onFilter` | `(filters: TableFilters) => void` | Server-mode filter callback |
| `onCellEdit` | `(record: T, key: string, value: any) => void` | Callback when a cell is edited |
| `components` | `TableComponents` | Override Row, Cell, or Header components |

### `TableSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `virtualized` | `boolean` | `false` | Enable virtual scrolling |
| `containerHeight` | `number` | `500` | Height of the scroll container |
| `mode` | `'client' \| 'server'` | `'client'` | Processing mode |
| `loading` | `boolean` | `false` | Show loading state |
| `showColumnBorders`| `boolean` | `true` | Show vertical separators |
| `resizable` | `boolean` | `false` | Global resize enable |
| `theme` | `TableTheme` | `defaultTheme` | Theme object |
| `toolbar` | `ToolbarSettings` | `undefined` | Toolbar configuration |
| `treeSettings`| `TreeSettings` | `undefined` | Hierarchical row settings |

### `RowSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `key` | `string \| (r: T) => string` | `undefined` | Unique row key |
| `height` | `number` | `50` | Row height in pixels |
| `overscan` | `number` | `3` | Rows to render outside viewport |
| `className` | `string \| (r: T, i: n) => string` | `undefined` | Custom row CSS class |
| `onClick` | `(record: T) => void` | `undefined` | Row click handler |
| `readOnly` | `boolean \| (r: T) => boolean` | `false` | Make entire row read-only |
| `disabled` | `boolean \| (r: T) => boolean` | `false` | Disable entire row |

### `Column` Properties

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Unique key for the column |
| `title` | `ReactNode` | Column header title |
| `fixed` | `'left' \| 'right'` | Pin column to side |
| `sortable` | `boolean` | Enable sorting for this column |
| `filterable` | `boolean` | Enable search filter for this column |
| `editable` | `boolean \| (record: T) => boolean` | Enable cell editing |
| `width` | `number` | Width in pixels |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment |
| `render` | `function` | Custom cell rendering function |
| `formula` | `string` | Excel-like calculation (starts with `=`) |
| `readOnly` | `boolean \| (record: T) => boolean` | Make column/cells read-only |
| `disabled` | `boolean \| (record: T) =\u003e boolean` | Disable column/cells |

### `TreeSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable hierarchical row support |
| `childrenKey`| `string` | `'children'`| Key in data containing child rows |
| `indentSize` | `number` | `20` | Pixels of indentation per level |
| `expandColumnKey`| `string` | `First Col` | Which column displays the toggle |
| `defaultExpanded`| `boolean` | `false` | Initial expansion state |

### `ToolbarSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable the toolbar |
| `position` | `'top' \| 'bottom'` | `'top'` | Toolbar vertical placement |
| `items` | `(ToolbarItem \| 'search' \| 'download' \| 'separator')[]` | `['search', 'download']` | Items to display |
| `downloadOptions`| `('csv' \| 'xlsx' \| 'pdf' \| 'tsv')[]` | `['csv', 'xlsx']` | Available export formats |

---

## ❄ Features

### Column Freezing
Pin columns to the left or right side. Users can also freeze/unfreeze via the column menu.

```tsx
const columns = [
  { key: 'id', title: 'ID', fixed: 'left', width: 70 },
  { key: 'actions', title: 'Actions', fixed: 'right', width: 120 }
];
```

### Virtualization
Optimized for 100,000+ rows using a headless math engine and throttled rendering.

### Custom Rendering
```tsx
const columns = [{
  key: 'user',
  title: 'User',
  render: (record) => <UserBadge user={record} />
}];
```

### Read-only & Disabled States
Tablez provides granular control over cell interactivity:
- **Read-only**: Cells show a 🔒 icon in the top-right corner. Both **Copy** and **Cut** actions are prevented to protect sensitive data.
- **Disabled**: Cells are greyed out with `opacity: 0.6`. All modifications (edit, cut) and click events are blocked, but **Copy** is still permitted.

Both states can be applied to a **Column**, an entire **Row**, or dynamically based on the **Record**.

- **Shortcuts**: Common actions have macOS-aware shortcuts (e.g., `⌘C`, `⌘V`, `⌘Z`).

---

## 🌳 Hierarchical Row Expansion (Tree View)

Tablez supports deeply nested data structures while maintaining full virtualization and performance.

### Usage
Simply provide nested data and enable the feature.

```tsx
const data = [
  { 
    id: 1, 
    name: 'Parent', 
    children: [
      { id: 2, name: 'Child A' },
      { id: 3, name: 'Child B' }
    ] 
  }
];

<Table
  data={data}
  settings={{
    treeSettings: {
      enabled: true,
      expandColumnKey: 'name'
    }
  }}
/>
```

### Features:
- **Bottom-Up Search**: When searching, parents are automatically kept visible if any of their children match.
- **Auto-Expansion**: Table automatically expands branches when a search is active to reveal matches.
- **Level-Based Sorting**: Sibling rows are sorted independently at every level.

---

## 🛠️ Advanced Toolbar

The built-in toolbar provides essential utilities like global search and multi-format data export.

### Configuration
You can customize built-in items or add your own.

```tsx
<Table
  data={data}
  settings={{
    toolbar: {
      enabled: true,
      items: [
        { 
          key: 'search', 
          label: 'Filter records...', 
          style: { maxWidth: 300 } 
        },
        'separator',
        { 
          key: 'my-action', 
          label: 'Special Action', 
          onClick: (data) => console.log(data) 
        },
        'download'
      ],
      downloadOptions: ['csv', 'xlsx', 'pdf']
    }
  }}
/>
```

### Built-in Items:
- `'search'`: Global text search across all columns.
- `'download'`: Export data as CSV, Excel, PDF, or TSV.
- `'separator'`: A visual divider between items.

## 🧪 Testing

```bash
npm test
```

## License

MIT

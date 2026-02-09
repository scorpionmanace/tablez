# @scorpionmanace/tablez

A modern, highly customizable, and performant React data table library.

Features:
- 🎨 **Theming Support**: Fully customizable themes with built-in Light/Dark modes.
- 📐 **Resizable Columns**: Drag-to-resize support.
- ⚡ **Virtual Scrolling**: Efficient rendering for large datasets.
- 🔍 **Filtering & Sorting**: Built-in column menus with search and sort support.
- 🌐 **Client & Server Side**: Support for both local and server-side data processing.
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
  onUpdate: (state) => {
    // Render your UI using state.visibleData, state.offsetY, etc.
    renderMyTable(state);
  }
});

// Sync scroll
container.onscroll = (e) => engine.setScrollTop(e.target.scrollTop);
```

### Vue 3 (Composition API)
You can easily build a Vue adapter using the provided engine utilities.

```ts
import { ref, computed } from 'vue';
import { calculateVirtualization, processData } from '@scorpionmanace/tablez';

// In your setup():
const scrollTop = ref(0);
const virtualization = computed(() => calculateVirtualization({
  scrollTop: scrollTop.value,
  rowHeight: 50,
  containerHeight: 500,
  dataLength: myData.length
}));
```

### React Native
Since the core logic doesn't use the DOM, you can use it to drive a `FlatList` or custom scroll view in React Native for high-performance tables.

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

### `RowSettings`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `key` | `string \| (r: T) => string` | `undefined` | Unique row key |
| `height` | `number` | `50` | Row height in pixels |
| `overscan` | `number` | `3` | Rows to render outside viewport |
| `className` | `string \| (r: T, i: n) => string` | `undefined` | Custom row CSS class |
| `onClick` | `(record: T) => void` | `undefined` | Row click handler |

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

## 🧪 Testing

```bash
npm test
```

## License

MIT

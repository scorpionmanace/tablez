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

## 🚀 Quick Start

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
      mode="client" // or "server"
    />
  );
}
```

## 🌐 Client vs Server Side

### Client Side (Default)
In client-side mode, Tablez handles all sorting and filtering logic internally.

### Server Side
In server-side mode, the table triggers `onSort` and `onFilter` callbacks.

```tsx
<Table
  data={serverData}
  mode="server"
  loading={isLoading}
  onSort={(sortState) => fetchNewData(sortState)}
  onFilter={(filters) => fetchNewData(filters)}
/>
```

## 🎨 Theming

Tablez supports theming. You can use the built-in `defaultTheme` or `darkTheme`, or provide your own.

## 📜 API

### `Table` Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Array of data records to display |
| `columns` | `Column<T>[]` | Column definitions |
| `mode` | `'client' \| 'server'` | Data processing mode (default: `'client'`) |
| `loading` | `boolean` | Show loading state (default: `false`) |
| `resizable` | `boolean` | Enable column resizing (default: `true`) |
| `virtualized` | `boolean` | Enable virtual scrolling (default: `false`) |
| `onSort` | `(state: TableSortState) => void` | Server-mode sort callback |
| `onFilter` | `(filters: TableFilters) => void` | Server-mode filter callback |

### `Column` Properties

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Unique key for the column |
| `title` | `ReactNode` | Column header title |
| `sortable` | `boolean` | Enable sorting for this column |
| `filterable` | `boolean` | Enable search filter for this column |
| `width` | `number` | Width in pixels |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment |

## 🧪 Testing

```bash
npm test
```

## License

MIT

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
| `onCellEdit` | `(record: T, key: string, value: any) => void` | Callback when a cell is edited |
| `rowClassName` | `string \| (record: T, index: number) => string` | Custom CSS class for rows |
| `showColumnBorders`| `boolean` | Toggle vertical column separators (default: `true`) |
| `components` | `object` | Override Row, Cell, or Header components |

### `Column` Properties

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Unique key for the column |
| `title` | `ReactNode` | Column header title |
| `render` | `function` | Custom cell rendering function |
| `headerRender`| `function` | Custom header rendering function |
| `sortable` | `boolean` | Enable sorting for this column |
| `filterable` | `boolean` | Enable search filter for this column |
| `editable` | `boolean \| (record: T) => boolean` | Enable cell editing |
| `width` | `number` | Width in pixels |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment |
| `className` | `string` | Custom CSS class for cells in this column |
| `headerClassName`| `string` | Custom CSS class for header cell |
| `style` | `CSSProperties` | Inline styles for cells |
| `headerStyle` | `CSSProperties` | Inline styles for header |

## 🎨 Advanced Customization

### Custom Header/Cell JSX
You can inject any JSX into headers and cells.

```tsx
const columns = [
  {
    key: 'user',
    title: 'User',
    headerRender: () => <span><UserIcon /> Name</span>,
    render: (val) => <strong><val.name></strong>
  }
];
```

### Row Styling
Zebra striping or conditional row coloring:

```tsx
<Table
  rowClassName={(record, index) => index % 2 === 0 ? 'even' : 'odd'}
  ...
/>
```

### Component Overrides
For complete control, you can swap out internal components:

```tsx
<Table
  components={{
    Row: MyCustomRow,
    Cell: MyCustomCell
  }}
  ...
/>
```

## ❄ Column & Row Freezing

### Freeze Columns
Pin columns to the left or right side of the table using the `fixed` property. Users can also freeze/unfreeze columns via the column menu in the header.

```tsx
const columns = [
  { key: 'id', title: 'ID', fixed: 'left', width: 70 },
  { key: 'actions', title: 'Actions', fixed: 'right', width: 120 }
];
```

### Frozen Header
The header is automatically pinned to the top of the table. Ensure your scroll container has a height defined (via `containerHeight` or CSS).

## ✍️ Cell Editing

Enable editing per column. Double-click to enter edit mode.

```tsx
const columns = [
  { 
    key: 'name', 
    title: 'Name', 
    editable: true // or (record) => record.status !== 'locked'
  }
];

<Table
  data={data}
  columns={columns}
  onCellEdit={(record, key, newValue) => {
    // Update your state here
    updateMyData(record.id, key, newValue);
  }}
/>
```

## 🧪 Testing

```bash
npm test
```

## License

MIT

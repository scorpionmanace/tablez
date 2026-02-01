# @scorpionmanace/tablez

A modern, highly customizable, and performant React data table library.
Features:
- 🎨 **Theming Support**: Fully customizable themes with built-in Light/Dark modes.
- 📐 **Resizable Columns**: Drag-to-resize support.
- 🔧 **Modular Design**: Composable structure.
- ⚛️ **TypeScript Ready**: Full type support out of the box.

## 📦 Installation

```bash
npm install @scorpionmanace/tablez
# or
yarn add @scorpionmanace/tablez
# or
pnpm add @scorpionmanace/tablez
```

## 🚀 Quick Start

Here's a minimal example to get you started:

```tsx
import { Table } from '@scorpionmanace/tablez';
import type { Column } from '@scorpionmanace/tablez';

interface User {
  id: number;
  name: string;
  role: string;
}

const data: User[] = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' },
];

const columns: Column<User>[] = [
  { key: 'id', title: 'ID', width: 50 },
  { key: 'name', title: 'Name' },
  { key: 'role', title: 'Role' },
];

function App() {
  return (
    <Table
      data={data}
      columns={columns}
      rowKey="id"
      resizable={true} // Enable resizing
    />
  );
}
```

## 🎨 Theming

Tablez supports theming. You can use the built-in themes or provide your own.

```tsx
import { Table, darkTheme, defaultTheme } from '@scorpionmanace/tablez';

// Use built-in dark theme
<Table theme={darkTheme} ... />

// Or customize individual parts
const customTheme = {
  header: { backgroundColor: '#1e293b', color: '#fff' },
  row: { '&:hover': { backgroundColor: '#f1f5f9' } }
};
```

## 📜 API

### `Table` Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Array of data records to display |
| `columns` | `Column<T>[]` | Column definitions |
| `rowKey` | `string` \| `(record: T) => string` | Unique key for each row |
| `theme` | `TableTheme` | Custom styling theme object |
| `resizable` | `boolean` | Enable drag-to-resize for columns |
| `onRowClick` | `(record: T) => void` | Callback when a row is clicked |

## License

MIT

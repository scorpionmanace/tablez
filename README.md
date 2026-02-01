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

## 🧪 Testing

We use [Vitest](https://vitest.dev/) for unit testing and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing.

To run the tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm test -- --watch
```

## 🤝 Contributing

We welcome contributions! Please follow these steps to contribute:

1.  **Fork the repository**.
2.  **Clone your fork**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/tablez.git
    cd tablez
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Create a new branch** for your feature or bugfix:
    ```bash
    git checkout -b feature/amazing-feature
    ```
5.  **Make your changes** and ensure tests pass:
    ```bash
    npm test
    ```
6.  **Commit your changes** (please use semantic commit messages):
    ```bash
    git commit -m "feat: add amazing feature"
    ```
7.  **Push to your fork**:
    ```bash
    git push origin feature/amazing-feature
    ```
8.  **Open a Pull Request**.

Please ensure your code follows the existing style and conventions.

## License

MIT

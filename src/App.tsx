import { useState } from 'react';
import { Table, darkTheme } from './lib';
import type { Column } from './lib';
import './App.css';

interface User {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'inactive';
}

const data: User[] = [
  { id: 1, name: 'Alice Johnson', role: 'Admin', status: 'active' },
  { id: 2, name: 'Bob Smith', role: 'Editor', status: 'inactive' },
  { id: 3, name: 'Charlie Brown', role: 'User', status: 'active' },
  { id: 4, name: 'Diana Prince', role: 'Admin', status: 'active' },
  { id: 5, name: 'Evan Wright', role: 'User', status: 'inactive' },
];

const columns: Column<User>[] = [
  { key: 'id', title: 'ID', width: 50, align: 'center' },
  { key: 'name', title: 'Name' },
  { key: 'role', title: 'Role' },
  {
    key: 'status',
    title: 'Status',
    render: (value) => (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '12px',
          backgroundColor: value === 'active' ? '#dcfce7' : '#f1f5f9',
          color: value === 'active' ? '#166534' : '#475569',
          fontSize: '0.85em',
          fontWeight: 600,
        }}
      >
        {value.toUpperCase()}
      </span>
    ),
  },
];

function App() {
  const [useDark, setUseDark] = useState(false);
  const [resizable, setResizable] = useState(true);

  return (
    <div className="container">
      <h1>Tablez Library Demo</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setUseDark(!useDark)}>
          Toggle Theme ({useDark ? 'Dark' : 'Light'})
        </button>
        <button onClick={() => setResizable(!resizable)}>
          {resizable ? 'Disable' : 'Enable'} Resizing
        </button>
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
        <Table
          data={data}
          columns={columns}
          rowKey="id"
          theme={useDark ? darkTheme : undefined}
          onRowClick={(record) => alert(`Clicked: ${record.name}`)}
          resizable={resizable}
        />
      </div>
    </div>
  );
}

export default App;

import { useState, useMemo } from 'react';
import { Table, darkTheme } from './lib';
import type { Column } from './lib';
import './App.css';

interface User {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'inactive';
}

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
  const [virtualized, setVirtualized] = useState(false);
  const [dataSize, setDataSize] = useState<'small' | 'large'>('small');

  // Generate data based on size
  const data = useMemo(() => {
    const size = dataSize === 'small' ? 5 : 1000;
    const roles = ['Admin', 'Editor', 'User', 'Viewer'];
    const statuses: ('active' | 'inactive')[] = ['active', 'inactive'];

    return Array.from({ length: size }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      role: roles[i % roles.length],
      status: statuses[i % statuses.length],
    }));
  }, [dataSize]);

  return (
    <div className="container">
      <h1>Tablez Library Demo</h1>

      <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => setUseDark(!useDark)}>
          Toggle Theme ({useDark ? 'Dark' : 'Light'})
        </button>
        <button onClick={() => setResizable(!resizable)}>
          {resizable ? 'Disable' : 'Enable'} Resizing
        </button>
        <button onClick={() => setVirtualized(!virtualized)}>
          {virtualized ? 'Disable' : 'Enable'} Virtualization
        </button>
        <button onClick={() => setDataSize(dataSize === 'small' ? 'large' : 'small')}>
          {dataSize === 'small' ? 'Load 1000 Rows' : 'Load 5 Rows'}
        </button>
      </div>

      <div style={{ marginBottom: 10, fontSize: '0.9em', color: '#666' }}>
        <strong>Current Settings:</strong> {data.length} rows,
        Virtualization: {virtualized ? 'ON' : 'OFF'},
        Resizing: {resizable ? 'ON' : 'OFF'}
        {virtualized && dataSize === 'large' && (
          <span style={{ color: '#16a34a', marginLeft: 8 }}>
            ⚡ Only rendering visible rows for better performance!
          </span>
        )}
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
        <Table
          data={data}
          columns={columns}
          rowKey="id"
          theme={useDark ? darkTheme : undefined}
          onRowClick={(record) => alert(`Clicked: ${record.name}`)}
          resizable={resizable}
          virtualized={virtualized}
          rowHeight={50}
          containerHeight={600}
          overscan={5}
        />
      </div>
    </div>
  );
}

export default App;

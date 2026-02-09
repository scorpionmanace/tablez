import { useState, useEffect } from 'react';
import { Table, darkTheme } from './lib';
import type { Column, TableSortState, TableFilters } from './lib';
import './App.css';

interface User {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'inactive';
}

const UserIcon = () => (
  <svg style={{ width: 16, height: 16, marginRight: 8, verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const RoleIcon = () => (
  <svg style={{ width: 14, height: 14, marginRight: 6, verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const columns: Column<User>[] = [
  {
    key: 'id',
    title: 'ID',
    width: 70,
    align: 'center',
    sortable: true,
    fixed: 'left',
    headerStyle: { borderLeft: '4px solid #3b82f6' }
  },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    filterable: true,
    editable: true,
    // Custom header with icon
    headerRender: () => (
      <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}>
        <UserIcon /> User Name
      </span>
    ),
    // Custom cell style
    style: { fontWeight: 500 }
  },
  {
    key: 'role',
    title: 'Role',
    sortable: true,
    filterable: true,
    editable: (record) => record.id !== 1,
    render: (value) => (
      <span>
        <RoleIcon /> {value}
      </span>
    )
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    filterable: true,
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
  const [mode, setMode] = useState<'client' | 'server'>('client');
  const [loading, setLoading] = useState(false);
  const [serverData, setServerData] = useState<User[]>([]);

  // Base dataset state
  const [allData, setAllData] = useState<User[]>(() => {
    const roles = ['Admin', 'Editor', 'User', 'Viewer'];
    const statuses: ('active' | 'inactive')[] = ['active', 'inactive'];

    return Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      role: roles[i % roles.length],
      status: statuses[i % statuses.length],
    }));
  });

  // Handle cell edit
  const handleCellEdit = (record: User, key: string, value: any) => {
    console.log('Cell edited:', { record, key, value });
    setAllData(prev => prev.map(item =>
      item.id === record.id ? { ...item, [key]: value } : item
    ));
  };

  // Initialize server data
  useEffect(() => {
    if (mode === 'server') {
      setServerData(allData.slice(0, 50));
    }
  }, [mode, allData]);

  const handleServerSort = (sortState: TableSortState) => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const sorted = [...allData].sort((a, b) => {
        const valA = (a as any)[sortState.columnKey];
        const valB = (b as any)[sortState.columnKey];
        if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setServerData(sorted.slice(0, 50));
      setLoading(false);
    }, 500);
  };

  const handleServerFilter = (filters: TableFilters) => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      let filtered = [...allData];
      Object.entries(filters).forEach(([key, value]) => {
        filtered = filtered.filter(item =>
          String((item as any)[key]).toLowerCase().includes(value.toLowerCase())
        );
      });
      setServerData(filtered.slice(0, 50));
      setLoading(false);
    }, 500);
  };

  // Custom row zebra styling
  const getRowClassName = (_record: User, index: number) => {
    return index % 2 === 0 ? 'row-even' : 'row-odd';
  };

  return (
    <div className="container">
      <h1>Tablez Library Demo</h1>

      <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => setUseDark(!useDark)}>
          Theme: {useDark ? 'Dark' : 'Light'}
        </button>
        <button onClick={() => setMode(mode === 'client' ? 'server' : 'client')}>
          Mode: {mode.toUpperCase()}
        </button>
        <button onClick={() => setVirtualized(!virtualized)}>
          Virtualization: {virtualized ? 'ON' : 'OFF'}
        </button>
        <button onClick={() => setResizable(!resizable)}>
          Resizing: {resizable ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ marginBottom: 10, fontSize: '0.9em', color: '#666' }}>
        <strong>Current Config:</strong> {mode === 'client' ? 'Client-side processing' : 'Server-side processing (simulated)'}
        <span style={{ marginLeft: 15, color: '#3b82f6' }}>❄ Headers and Columns can now be Frozen/Fixed!</span>
      </div>

      <style>{`
          .row-even { background-color: rgba(0,0,0,0.02); }
          .row-odd { background-color: transparent; }
          [data-theme='dark'] .row-even { background-color: rgba(255,255,255,0.03); }
      `}</style>

      <div
        data-theme={useDark ? 'dark' : 'light'}
        style={{ border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
      >
        <Table
          data={mode === 'client' ? allData : serverData}
          columns={columns}
          rowKey="id"
          theme={useDark ? darkTheme : undefined}
          resizable={resizable}
          virtualized={virtualized}
          mode={mode}
          loading={loading}
          onSort={mode === 'server' ? handleServerSort : undefined}
          onFilter={mode === 'server' ? handleServerFilter : undefined}
          onCellEdit={handleCellEdit}
          rowClassName={getRowClassName}
          containerHeight={400}
        />
      </div>
    </div>
  );
}

export default App;

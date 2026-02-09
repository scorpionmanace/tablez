import { useState, useEffect, useMemo } from 'react';
import { Table, darkTheme, TablezEngine } from './lib';
import type { Column, TableSortState, TableFilters, TableTheme } from './lib';
import { calculateVirtualization } from './lib/core/engine';
import './App.css';

interface User {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin?: string; // Date string
  score?: number;
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
  },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    filterable: true,
    editable: true,
    headerRender: () => (
      <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}>
        <UserIcon /> User Name
      </span>
    ),
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
    filterable: false,
    freezable: false,
    draggable: false,
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
  {
    key: 'lastLogin',
    title: 'Last Login',
    width: 120,
    sortable: true,
    editable: true,
    type: 'date',
    format: { dateFormat: 'YYYY-MM-DD' }
  },
  {
    key: 'score',
    title: 'Score',
    width: 100,
    align: 'right',
    sortable: true,
    editable: true,
    type: 'number',
    format: { decimals: 1, suffix: ' pts' }
  },
  {
    key: 'avatar',
    title: 'Avatar',
    width: 80,
    formula: "=IMG('https://api.dicebear.com/7.x/avataaars/svg?seed=' + {name}, {name}, 32, 32)",
    align: 'center' as const,
    sortable: false,
    filterable: false,
    freezable: false,
  },
  {
    key: 'performance',
    title: 'Performance (Calc)',
    width: 150,
    formula: "=LOWER(CONCAT('Score: ', ROUND({id} * 1.5, 1)))",
    sortable: true,
  }
];

const midnightTheme: TableTheme = {
  tokens: {
    primaryColor: '#8b5cf6',
    backgroundColor: '#0f172a',
    headerBackgroundColor: '#1e293b',
    borderColor: '#334155',
    textColor: '#f8fafc',
    headerTextColor: '#e2e8f0',
    rowHoverColor: '#1e293b',
    borderRadius: '12px',
    padding: '16px 20px',
  },
  headerCell: {
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }
};

function App() {
  const [activeTab, setActiveTab] = useState<'main' | 'theme' | 'vanilla' | 'core'>('main');
  const [useDark, setUseDark] = useState(false);
  const [mode, setMode] = useState<'client' | 'server'>('client');
  const [virtualized, setVirtualized] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [draggable, setDraggable] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  const [frozenRows, setFrozenRows] = useState(0);
  const [loading, setLoading] = useState(false);

  const [allData, setAllData] = useState<User[]>(() => {
    return Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      role: ['Admin', 'Editor', 'Viewer', 'Maintainer'][i % 4] as any,
      status: i % 3 === 0 ? 'active' : 'inactive',
      lastLogin: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
      score: Math.floor(Math.random() * 1000),
    }));
  });

  const [serverData, setServerData] = useState<User[]>([]);
  const [currentColumns, setCurrentColumns] = useState(columns);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mode === 'server') {
      setServerData(allData.slice(0, 50));
    }
  }, [mode, allData]);

  const handleDataChange = (newData: User[]) => {
    setAllData(newData);
    if (mode === 'server') {
      setServerData(newData.slice(0, 50));
    }
  };

  const handleCellEdit = (record: User, key: string, value: any) => {
    setAllData(prev => prev.map(item =>
      item.id === record.id ? { ...item, [key]: value } : item
    ));
  };

  const shuffleColumns = () => {
    const next = [...currentColumns];
    const movableIndices = next.map((c, i) => c.fixed ? -1 : i).filter(i => i !== -1);
    if (movableIndices.length < 2) return;
    const fromIndex = movableIndices[Math.floor(Math.random() * movableIndices.length)];
    let toIndex = movableIndices[Math.floor(Math.random() * movableIndices.length)];
    while (toIndex === fromIndex) toIndex = movableIndices[Math.floor(Math.random() * movableIndices.length)];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setCurrentColumns(next);
  };

  const handleServerSort = (sortState: TableSortState) => {
    setLoading(true);
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

  // --- Vanilla Engine Example ---
  const [vanillaState, setVanillaState] = useState<any>(null);
  const vanillaEngine = useMemo(() => new TablezEngine({
    data: allData.slice(0, 100),
    columns: columns as any,
    settings: { containerHeight: 300, virtualized: true },
    onUpdate: (state) => setVanillaState(state)
  }), [allData]);

  const controlButtonStyle = (active: boolean) => ({
    backgroundColor: active ? '#3b82f6' : (useDark ? '#1e293b' : '#f1f5f9'),
    color: active ? 'white' : (useDark ? '#94a3b8' : '#475569'),
    border: `1px solid ${useDark ? '#334155' : '#e2e8f0'}`,
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s'
  });

  return (
    <div className="container" data-theme={useDark ? 'dark' : 'light'}>
      <header style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: `1px solid ${useDark ? '#334155' : '#e2e8f0'}`,
        backgroundColor: useDark ? '#0f172a' : '#fff',
        flexShrink: 0,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>T</div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: useDark ? '#f8fafc' : '#0f172a' }}>Tablez</h2>
          </div>

          <nav style={{ display: 'flex', gap: '4px' }}>
            {(['main', 'theme', 'vanilla', 'core'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === tab ? (useDark ? '#1e293b' : '#f1f5f9') : 'transparent',
                  color: activeTab === tab ? '#3b82f6' : (useDark ? '#64748b' : '#64748b'),
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {tab === 'main' ? 'Demo' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setUseDark(!useDark)} style={controlButtonStyle(false)}>
            {useDark ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </header>

      {activeTab === 'main' && (
        <div style={{ height: '44px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', backgroundColor: useDark ? '#020617' : '#f8fafc', borderBottom: `1px solid ${useDark ? '#1e293b' : '#f1f5f9'}`, flexShrink: 0, overflowX: 'auto' }}>
          <button onClick={() => setMode(mode === 'client' ? 'server' : 'client')} style={controlButtonStyle(mode === 'server')}>Mode: {mode.toUpperCase()}</button>
          <button onClick={() => setResizable(!resizable)} style={controlButtonStyle(resizable)}>Resize: {resizable ? 'ON' : 'OFF'}</button>
          <button onClick={() => setVirtualized(!virtualized)} style={controlButtonStyle(virtualized)}>Virtual: {virtualized ? 'ON' : 'OFF'}</button>
          <button onClick={() => setDraggable(!draggable)} style={controlButtonStyle(draggable)}>Drag: {draggable ? 'ON' : 'OFF'}</button>
          <button onClick={() => setFrozenRows(prev => prev === 0 ? 2 : 0)} style={controlButtonStyle(frozenRows > 0)}>Frozen Rows ({frozenRows})</button>
          <button onClick={() => setShowBorders(!showBorders)} style={controlButtonStyle(showBorders)}>Borders: {showBorders ? 'ON' : 'OFF'}</button>
          <button onClick={shuffleColumns} style={{ ...controlButtonStyle(false), backgroundColor: '#10b981', color: 'white', border: 'none' }}>🔀 Shuffle</button>
        </div>
      )}

      <main style={{ flex: 1, overflow: 'hidden', padding: activeTab === 'main' ? 0 : '40px' }}>
        {activeTab === 'main' && (
          <Table
            data={mode === 'client' ? allData : serverData}
            columns={currentColumns}
            onColumnUpdate={setCurrentColumns}
            onDataChange={handleDataChange}
            settings={{
              theme: useDark ? darkTheme : undefined,
              resizable,
              draggableColumns: draggable,
              virtualized,
              mode,
              loading,
              showColumnBorders: showBorders,
              containerHeight: windowHeight - 60 - (activeTab === 'main' ? 44 : 0),
              frozenRows,
              contextMenu: {
                enabled: true,
                items: [
                  'insertRowAbove', 'insertRowBelow', { type: 'separator' },
                  'insertColumnLeft', 'insertColumnRight', { type: 'separator' },
                  'copy', 'cut', 'paste', { type: 'separator' },
                  'undo', 'redo', { type: 'separator' },
                  'hideRow', 'hideColumn', 'renameColumn',
                ]
              }
            }}
            rowSettings={{ key: "id", height: 48 }}
            onCellEdit={handleCellEdit}
            onSort={mode === 'server' ? handleServerSort : undefined}
            onFilter={mode === 'server' ? handleServerFilter : undefined}
          />
        )}

        {activeTab === 'theme' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: 15, color: useDark ? '#fff' : '#000' }}>Midnight Theme</h3>
            <div style={{ borderRadius: 12, overflow: 'hidden', height: '400px', border: '1px solid #334155' }}>
              <Table
                data={allData.slice(0, 100)}
                columns={[{ key: 'id', title: 'ID', width: 60, fixed: 'left' }, { key: 'name', title: 'Name', width: 200 }, { key: 'role', title: 'Role', width: 150 }, { key: 'status', title: 'Status', width: 120 }]}
                settings={{ theme: midnightTheme, containerHeight: 400, showColumnBorders: false }}
              />
            </div>
          </div>
        )}

        {activeTab === 'vanilla' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto', color: useDark ? '#fff' : '#000' }}>
            <h3>Headless Engine</h3>
            <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
              <div style={{ flex: 1, border: `1px solid ${useDark ? '#334155' : '#eee'}`, padding: 20, borderRadius: 8 }}>
                <pre style={{ fontSize: '0.8em', maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify({ startIndex: vanillaState?.startIndex, totalHeight: vanillaState?.totalHeight }, null, 2)}
                </pre>
              </div>
              <div onScroll={(e) => vanillaEngine.setScrollTop((e.target as any).scrollTop)} style={{ flex: 1, height: 300, overflow: 'auto', border: '2px dashed #cbd5e1', position: 'relative' }}>
                <div style={{ height: vanillaState?.totalHeight, position: 'relative' }}>
                  <div style={{ transform: `translateY(${vanillaState?.offsetY}px)`, position: 'absolute', width: '100%' }}>
                    {vanillaState?.visibleData?.map((u: any) => (
                      <div key={u.id} style={{ height: 50, borderBottom: '1px solid #eee', padding: '0 15px', display: 'flex', alignItems: 'center' }}>
                        #{u.id} - {u.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'core' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto', color: useDark ? '#fff' : '#000' }}>
            <h3>Core Math</h3>
            <pre style={{ backgroundColor: useDark ? '#1e293b' : '#f8fafc', padding: 25, borderRadius: 12 }}>
              {JSON.stringify(calculateVirtualization({ scrollTop: 10000, height: 40, containerHeight: 600, dataLength: 1000000, overscan: 5 }), null, 4)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

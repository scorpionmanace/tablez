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

// --- Custom Theme (BYOT) ---
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
  const [resizable, setResizable] = useState(true);
  const [virtualized, setVirtualized] = useState(true);
  const [mode, setMode] = useState<'client' | 'server'>('client');
  const [loading, setLoading] = useState(false);
  const [serverData, setServerData] = useState<User[]>([]);
  const [showBorders, setShowBorders] = useState(true);
  const [draggable, setDraggable] = useState(true);
  const [currentColumns, setCurrentColumns] = useState(columns);
  const [frozenRows, setFrozenRows] = useState(0);

  // Base dataset state
  const [allData, setAllData] = useState<User[]>(() => {
    return Array.from({ length: 5000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      role: ['Admin', 'Editor', 'Viewer', 'Maintainer'][i % 4] as any,
      status: i % 3 === 0 ? 'active' : 'inactive',
    }));
  });

  const shuffleColumns = () => {
    const next = [...currentColumns];
    // Randomly move one column (excluding fixed ones like ID)
    const movableIndices = next.map((c, i) => c.fixed ? -1 : i).filter(i => i !== -1);
    if (movableIndices.length < 2) return;

    const fromIndex = movableIndices[Math.floor(Math.random() * movableIndices.length)];
    let toIndex = movableIndices[Math.floor(Math.random() * movableIndices.length)];
    while (toIndex === fromIndex) {
      toIndex = movableIndices[Math.floor(Math.random() * movableIndices.length)];
    }

    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setCurrentColumns(next);
  };

  const handleCellEdit = (record: User, key: string, value: any) => {
    setAllData(prev => prev.map(item =>
      item.id === record.id ? { ...item, [key]: value } : item
    ));
  };

  useEffect(() => {
    if (mode === 'server') {
      setServerData(allData.slice(0, 50));
    }
  }, [mode, allData]);

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
    settings: {
      containerHeight: 300,
    },
    onUpdate: (state) => setVanillaState(state)
  }), [allData]);

  return (
    <div className="container">
      <header style={{ marginBottom: 40, borderBottom: '1px solid #eee', paddingBottom: 20 }}>
        <h1>Tablez <span style={{ color: '#3b82f6', fontSize: '0.6em', fontWeight: 400 }}>v0.0.5</span></h1>
        <p style={{ color: '#666' }}>Modern, Headless, and Framework-Agnostic Data Tables</p>
      </header>

      <nav style={{ display: 'flex', gap: 10, marginBottom: 30, borderBottom: '2px solid #f1f5f9' }}>
        {(['main', 'theme', 'vanilla', 'core'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              backgroundColor: activeTab === tab ? '#3b82f6' : 'transparent',
              color: activeTab === tab ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              padding: '12px 20px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {tab === 'main' && 'Interactive Demo'}
            {tab === 'theme' && 'Custom Theme (BYOT)'}
            {tab === 'vanilla' && 'Headless Engine'}
            {tab === 'core' && 'Core Utilities'}
          </button>
        ))}
      </nav>

      <div className="tab-content" style={{ minHeight: 600 }}>
        {activeTab === 'main' && (
          <div className="demo-section">
            <div className="controls" style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setUseDark(!useDark)}>Theme: {useDark ? 'Dark' : 'Light'}</button>
              <button onClick={() => setMode(mode === 'client' ? 'server' : 'client')}>Mode: {mode.toUpperCase()}</button>
              <button onClick={() => setVirtualized(!virtualized)}>Virtual: {virtualized ? 'ON' : 'OFF'}</button>
              <button onClick={() => setResizable(!resizable)}>Resizing: {resizable ? 'ON' : 'OFF'}</button>
              <button onClick={() => setDraggable(!draggable)}>Draggable: {draggable ? 'ON' : 'OFF'}</button>
              <button onClick={() => setFrozenRows(prev => prev === 0 ? 2 : 0)}>Frozen Rows ({frozenRows})</button>
              <button onClick={shuffleColumns} style={{ backgroundColor: '#10b981', color: 'white' }}>🔀 Shuffle Columns</button>
              <button onClick={() => setShowBorders(!showBorders)}>Separators: {showBorders ? 'ON' : 'OFF'}</button>
            </div>

            <div data-theme={useDark ? 'dark' : 'light'} className="table-wrapper">
              <Table
                data={mode === 'client' ? allData : serverData}
                columns={currentColumns}
                onColumnUpdate={setCurrentColumns}
                settings={{
                  theme: useDark ? darkTheme : undefined,
                  resizable,
                  draggableColumns: draggable,
                  frozenRows,
                  virtualized,
                  mode,
                  loading,
                  showColumnBorders: showBorders,
                  containerHeight: 500,
                }}
                rowSettings={{
                  key: "id",
                  height: 52,
                }}
                onSort={mode === 'server' ? handleServerSort : undefined}
                onFilter={mode === 'server' ? handleServerFilter : undefined}
                onCellEdit={handleCellEdit}
              />
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="demo-section">
            <h3 style={{ marginBottom: 15 }}>"Midnight" Custom Theme Example</h3>
            <p style={{ color: '#666', marginBottom: 20 }}>Demonstrating token-based theming with primary violet accents and deep slate backgrounds.</p>
            <div className="table-wrapper" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <Table
                data={allData.slice(0, 100)}
                columns={[
                  { key: 'id', title: 'ID', width: 60, align: 'center', fixed: 'left' },
                  { key: 'name', title: 'Name', width: 200, sortable: true },
                  { key: 'role', title: 'User Role', width: 150 },
                  { key: 'status', title: 'Status', width: 120 }
                ]}
                settings={{
                  theme: midnightTheme,
                  virtualized: true,
                  containerHeight: 400,
                  showColumnBorders: false
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'vanilla' && (
          <div className="demo-section">
            <h3 style={{ marginBottom: 15 }}>Headless Engine Class</h3>
            <p style={{ color: '#666', marginBottom: 20 }}>Using <code>TablezEngine</code> class directly to drive a custom UI (standard HTML buttons/lists).</p>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1, border: '1px solid #eee', padding: 20, borderRadius: 8 }}>
                <h4>Engine State</h4>
                <pre style={{ backgroundColor: '#f8fafc', padding: 10, fontSize: '0.8em', maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify({
                    startIndex: vanillaState?.startIndex,
                    endIndex: vanillaState?.endIndex,
                    offsetY: vanillaState?.offsetY,
                    totalHeight: vanillaState?.totalHeight
                  }, null, 2)}
                </pre>
              </div>
              <div
                onScroll={(e) => vanillaEngine.setScrollTop((e.target as any).scrollTop)}
                style={{ flex: 1, height: 300, overflow: 'auto', border: '2px dashed #cbd5e1', position: 'relative' }}
              >
                <div style={{ height: vanillaState?.totalHeight, position: 'relative' }}>
                  <div style={{ transform: `translateY(${vanillaState?.offsetY}px)`, position: 'absolute', width: '100%' }}>
                    {vanillaState?.visibleData.map((u: any) => (
                      <div key={u.id} style={{ height: 50, borderBottom: '1px solid #eee', padding: '0 15px', display: 'flex', alignItems: 'center' }}>
                        <strong>#{u.id}</strong> - {u.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'core' && (
          <div className="demo-section">
            <h3 style={{ marginBottom: 15 }}>Pure Engine Math</h3>
            <p style={{ color: '#666', marginBottom: 20 }}>Demonstrating <code>calculateVirtualization</code> utility used for framework adapters.</p>

            <div style={{ backgroundColor: '#f8fafc', padding: 25, borderRadius: 12, fontFamily: 'monospace' }}>
              <div>// Calculation for 1M rows at 40px height, scrolled 10k pixels</div>
              <pre style={{ color: '#0369a1', marginTop: 15 }}>
                {JSON.stringify(calculateVirtualization({
                  scrollTop: 10000,
                  height: 40,
                  containerHeight: 600,
                  dataLength: 1000000,
                  overscan: 5
                }), null, 4)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

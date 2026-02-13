import { useState, useEffect, useMemo } from 'react';
import { Table, darkTheme, TablezEngine } from './lib';
import type { Column, TableSortState, TableFilters, TableTheme } from './lib';
import './App.css';

interface User {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin?: string; // Date string
  score?: number;
  children?: User[];
}

const UserIcon = () => (
  <svg
    style={{ width: 16, height: 16, marginRight: 8, verticalAlign: 'middle' }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const RoleIcon = () => (
  <svg
    style={{ width: 14, height: 14, marginRight: 6, verticalAlign: 'middle' }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const columns: Column<User>[] = [
  {
    key: 'id',
    title: 'ID',
    width: 80,
    sortable: true,
    fixed: 'left',
    readOnly: true,
  },
  {
    key: 'name',
    title: 'Name',
    width: 250,
    sortable: true,
    filterable: true,
    editable: true,
    headerRender: () => (
      <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}>
        <UserIcon /> Name
      </span>
    ),
    style: { fontWeight: 500 },
  },
  {
    key: 'role',
    title: 'Role',
    width: 150,
    sortable: true,
    filterable: true,
    editable: (record) => record.id !== 1,
    render: (value: string) => (
      <span>
        <RoleIcon /> {value}
      </span>
    ),
  },
  {
    key: 'status',
    title: 'Status',
    width: 120,
    sortable: true,
    filterable: false,
    render: (value: string) => (
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
        {String(value).toUpperCase()}
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
    format: { dateFormat: 'YYYY-MM-DD' },
  },
  {
    key: 'score',
    title: 'Score',
    width: 100,
    align: 'right',
    sortable: true,
    editable: true,
    type: 'number',
    format: { decimals: 1, suffix: ' pts' },
  },
  {
    key: 'avatar',
    title: 'Avatar',
    width: 80,
    formula: "=IMG('https://api.dicebear.com/7.x/avataaars/svg?seed=' + {name}, {name}, 32, 32)",
    align: 'center',
    sortable: false,
  },
  {
    key: 'performance',
    title: 'Performance',
    width: 150,
    formula: '=ROUND({id} * 1.5, 1)',
    sortable: true,
  },
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
  },
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
  const [toolbarEnabled, setToolbarEnabled] = useState(true);
  const [toolbarPosition] = useState<'top' | 'bottom'>('top');
  const [treeEnabled, setTreeEnabled] = useState(true);

  const [allData, setAllData] = useState<User[]>(() => {
    const roles = ['Admin', 'Editor', 'Viewer', 'Maintainer'];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      role: roles[i % 4],
      status: i % 3 === 0 ? 'active' : 'inactive',
      lastLogin: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
      score: Math.floor(Math.random() * 100),
      children:
        i % 5 === 0
          ? [
              {
                id: (i + 1) * 1000 + 1,
                name: `Nested Admin ${i + 1}.1`,
                role: 'Admin',
                status: 'active',
                score: 95,
                children: [
                  {
                    id: (i + 1) * 10000 + 1,
                    name: `Deep Guest ${i + 1}.1.1`,
                    role: 'Viewer',
                    status: 'inactive',
                    score: 10,
                  },
                ],
              },
              {
                id: (i + 1) * 1000 + 2,
                name: `Nested Editor ${i + 1}.2`,
                role: 'Editor',
                status: 'active',
                score: 80,
              },
            ]
          : undefined,
    }));
  });

  const [serverData, setServerData] = useState<User[]>([]);
  const [currentColumns, setCurrentColumns] = useState<Column<User>[]>(columns);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDataChange = (newData: User[]) => {
    setAllData(newData);
  };

  const handleCellEdit = (record: User, key: string, value: any) => {
    setAllData((prev) => {
      const updateData = (list: User[]): User[] => {
        return list.map((item) => {
          if (item.id === record.id) return { ...item, [key]: value };
          if (item.children) return { ...item, children: updateData(item.children) };
          return item;
        });
      };
      return updateData(prev);
    });
  };

  const handleServerSort = (sortState: TableSortState) => {
    setLoading(true);
    setTimeout(() => {
      const sorted = [...allData].sort((a, b) => {
        const valA = (a as Record<string, any>)[sortState.columnKey];
        const valB = (b as Record<string, any>)[sortState.columnKey];
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
        filtered = filtered.filter((item) =>
          String((item as Record<string, any>)[key])
            .toLowerCase()
            .includes(value.toLowerCase()),
        );
      });
      setServerData(filtered.slice(0, 50));
      setLoading(false);
    }, 500);
  };

  const [vanillaState, setVanillaState] = useState<any>(null);
  useMemo(
    () =>
      new TablezEngine({
        data: allData.slice(0, 20),
        columns: columns as Column<any>[],
        settings: { containerHeight: 300, virtualized: true },
        onUpdate: (state) => setVanillaState(state),
      }),
    [allData],
  );

  const controlButtonStyle = (active: boolean) => ({
    backgroundColor: active ? '#3b82f6' : useDark ? '#1e293b' : '#f1f5f9',
    color: active ? 'white' : useDark ? '#94a3b8' : '#475569',
    border: `1px solid ${useDark ? '#334155' : '#e2e8f0'}`,
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div className="container" data-theme={useDark ? 'dark' : 'light'}>
      <header
        style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: `1px solid ${useDark ? '#334155' : '#e2e8f0'}`,
          backgroundColor: useDark ? '#0f172a' : '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              T
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: useDark ? '#f8fafc' : '#0f172a' }}>
              Tablez
            </h2>
          </div>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {(['main', 'theme', 'vanilla', 'core'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor:
                    activeTab === tab ? (useDark ? '#1e293b' : '#f1f5f9') : 'transparent',
                  color: activeTab === tab ? '#3b82f6' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab === 'main' ? 'Demo' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={() => setUseDark(!useDark)} style={controlButtonStyle(false)}>
          {useDark ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      {activeTab === 'main' && (
        <div
          style={{
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 24px',
            backgroundColor: useDark ? '#020617' : '#f8fafc',
            borderBottom: `1px solid ${useDark ? '#1e293b' : '#f1f5f9'}`,
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setMode(mode === 'client' ? 'server' : 'client')}
            style={controlButtonStyle(mode === 'server')}
          >
            Mode: {mode.toUpperCase()}
          </button>
          <button onClick={() => setResizable(!resizable)} style={controlButtonStyle(resizable)}>
            Resize: {resizable ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setVirtualized(!virtualized)}
            style={controlButtonStyle(virtualized)}
          >
            Virtual: {virtualized ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setDraggable(!draggable)} style={controlButtonStyle(draggable)}>
            Drag: {draggable ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setFrozenRows((prev) => (prev === 0 ? 2 : 0))}
            style={controlButtonStyle(frozenRows > 0)}
          >
            Frozen ({frozenRows})
          </button>
          <button
            onClick={() => setShowBorders(!showBorders)}
            style={controlButtonStyle(showBorders)}
          >
            Borders: {showBorders ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setTreeEnabled(!treeEnabled)}
            style={controlButtonStyle(treeEnabled)}
          >
            Tree: {treeEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setToolbarEnabled(!toolbarEnabled)}
            style={controlButtonStyle(toolbarEnabled)}
          >
            Toolbar: {toolbarEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      )}

      <main style={{ flex: 1, overflow: 'hidden', padding: activeTab === 'main' ? 0 : '40px' }}>
        {activeTab === 'main' && (
          <Table<User>
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
              containerHeight: windowHeight - 104,
              frozenRows,
              treeSettings: {
                enabled: treeEnabled,
                expandColumnKey: 'name',
              },
              contextMenu: {
                enabled: true,
                items: [
                  'copy',
                  'cut',
                  'paste',
                  { type: 'separator' },
                  'insertRowAbove',
                  'insertRowBelow',
                  'hideColumn',
                  'renameColumn',
                ],
              },
              toolbar: {
                enabled: toolbarEnabled,
                position: toolbarPosition,
                items: [
                  { key: 'search', label: 'Filter...', style: { maxWidth: 300 } },
                  'separator',
                  'download',
                ],
              },
            }}
            rowSettings={{
              key: 'id',
              height: 48,
            }}
            onCellEdit={handleCellEdit}
            onSort={mode === 'server' ? (handleServerSort as any) : undefined}
            onFilter={mode === 'server' ? handleServerFilter : undefined}
          />
        )}

        {activeTab === 'theme' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: 15 }}>Theming API</h3>
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                height: 400,
                border: '1px solid #334155',
              }}
            >
              <Table<User>
                data={allData.slice(0, 50)}
                columns={currentColumns}
                settings={{ theme: midnightTheme, containerHeight: 400 }}
              />
            </div>
          </div>
        )}

        {activeTab === 'vanilla' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h3>Headless Engine</h3>
            <pre
              style={{
                padding: 20,
                backgroundColor: useDark ? '#1e293b' : '#f8fafc',
                borderRadius: 8,
              }}
            >
              {JSON.stringify(
                { visible: vanillaState?.visibleData?.length, total: allData.length },
                null,
                2,
              )}
            </pre>
          </div>
        )}

        {activeTab === 'core' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h3>System Info</h3>
            <p>Platform: macOS</p>
            <p>Virtualization: Enabled</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

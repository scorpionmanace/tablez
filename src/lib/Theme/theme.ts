import type { TableTheme } from '../types';

export const defaultTheme: TableTheme = {
  tokens: {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    headerBackgroundColor: '#f8fafc',
    rowHoverColor: '#f1f5f9',
    textColor: '#1e293b',
    headerTextColor: '#475569',
    fontSize: '14px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  header: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
  },
  headerCell: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#475569',
  },
  row: {
    borderBottom: '1px solid #e2e8f0',
  },
  cell: {
    padding: '12px 16px',
    color: '#1e293b',
  },
  menu: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: '#1e293b',
  },
  menuItem: {
    color: '#475569',
    fontSize: '14px',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#1e293b',
  },
};

export const darkTheme: TableTheme = {
  tokens: {
    primaryColor: '#3b82f6',
    secondaryColor: '#94a3b8',
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    headerBackgroundColor: '#0f172a',
    rowHoverColor: '#334155',
    textColor: '#f8fafc',
    headerTextColor: '#e2e8f0',
    fontSize: '14px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
  },
  header: {
    backgroundColor: '#0f172a',
    borderBottom: '2px solid #334155',
  },
  headerCell: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  row: {
    borderBottom: '1px solid #334155',
  },
  cell: {
    padding: '12px 16px',
    color: '#e2e8f0',
  },
  menu: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
    color: '#f8fafc',
  },
  menuItem: {
    color: '#e2e8f0',
    fontSize: '14px',
  },
  searchInput: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
  },
};

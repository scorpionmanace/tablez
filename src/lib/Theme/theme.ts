import type { TableTheme } from '../types';

export const defaultTheme: TableTheme = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'system-ui, -apple-system, sans-serif',
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
};

export const darkTheme: TableTheme = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'system-ui, -apple-system, sans-serif',
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
};

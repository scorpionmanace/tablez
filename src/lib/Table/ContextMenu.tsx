
import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { CSSProperties } from 'react';
import type { TableTheme, Column } from '../types';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    theme: TableTheme;
    options: string[];
    customActions?: { label: string; onClick: (record: any, column: Column<any>) => void }[];
    record: any;
    column: Column<any>;
    onAction: (action: string, record: any, column: Column<any>) => void;
}

export const ContextMenu: FC<ContextMenuProps> = ({
    x, y, onClose, theme, options, customActions, record, column, onAction
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Simple mapping for labels
    const labels: Record<string, string> = {
        'hideRow': 'Hide Row',
        'hideColumn': 'Hide Column',
        'insertRowBelow': 'Insert Row Below',
        'insertRowAbove': 'Insert Row Above',
        'insertColumnLeft': 'Insert Column Left',
        'insertColumnRight': 'Insert Column Right'
    };

    const style: CSSProperties = {
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 1000,
        backgroundColor: theme.menu?.backgroundColor || '#fff',
        border: theme.menu?.border || '1px solid #e2e8f0',
        borderRadius: theme.menu?.borderRadius || '6px',
        boxShadow: theme.menu?.boxShadow || '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '4px 0',
        minWidth: '180px',
        fontFamily: theme.tokens?.fontFamily || 'inherit',
    };

    const itemStyle: CSSProperties = {
        padding: '8px 12px',
        fontSize: '14px',
        cursor: 'pointer',
        color: theme.menuItem?.color || '#334155',
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: 'none',
        background: 'transparent',
    };

    return (
        <div ref={menuRef} style={style}>
            {options.map(opt => (
                <button
                    key={opt}
                    onClick={() => onAction(opt, record, column)}
                    style={itemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.tokens?.rowHoverColor || '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    {labels[opt] || opt}
                </button>
            ))}

            {customActions && customActions.length > 0 && options.length > 0 && (
                <div style={{ height: 1, backgroundColor: theme.tokens?.borderColor || '#e2e8f0', margin: '4px 0' }} />
            )}

            {customActions?.map((action, idx) => (
                <button
                    key={`custom-${idx}`}
                    onClick={() => {
                        action.onClick(record, column);
                        onClose();
                    }}
                    style={itemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.tokens?.rowHoverColor || '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
};

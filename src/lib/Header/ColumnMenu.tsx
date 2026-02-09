import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Column, TableTheme, TableSortDirection } from '../types';

interface ColumnMenuProps {
    column: Column;
    theme: TableTheme;
    onSort: (direction: TableSortDirection) => void;
    onFilter: (value: string) => void;
    onFreeze?: (direction: 'left' | 'right' | null) => void;
    currentSort?: TableSortDirection;
    currentFilter?: string;
}

export const ColumnMenu = ({
    column,
    theme,
    onSort,
    onFilter,
    onFreeze,
    currentSort,
    currentFilter = '',
}: ColumnMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState(currentFilter);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchValue(val);
        onFilter(val);
    };

    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const MENU_WIDTH = 180; // Approximate min-width + padding
            const GAP = 4;

            let left = rect.right - MENU_WIDTH + window.scrollX;
            let top = rect.bottom + GAP + window.scrollY;

            // If menu overflows left side, align it with the left side of the button
            if (left < 10) {
                left = rect.left + window.scrollX;
            }

            // If it now overflows the right side (unlikely but possible), shift it back
            if (left + MENU_WIDTH > window.innerWidth - 10) {
                left = window.innerWidth - MENU_WIDTH - 10;
            }

            setMenuPosition({ top, left });
        }
    }, [isOpen]);

    const iconColor = theme.tokens?.headerTextColor || theme.tokens?.textColor || '#475569';

    return (
        <div style={{ display: 'inline-block', marginLeft: '4px' }}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isOpen || currentSort || currentFilter ? 1 : 0.4,
                    transition: 'opacity 0.2s',
                }}
                aria-label="Column Menu"
            >
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '12px',
                    height: '9px',
                }}>
                    <span style={{ height: '1.5px', width: '100%', backgroundColor: iconColor, borderRadius: '1px' }} />
                    <span style={{ height: '1.5px', width: '100%', backgroundColor: iconColor, borderRadius: '1px' }} />
                    <span style={{ height: '1.5px', width: '100%', backgroundColor: iconColor, borderRadius: '1px' }} />
                </div>
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: 'absolute',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        zIndex: 2000,
                        minWidth: '160px',
                        padding: '8px',
                        backgroundColor: theme.tokens?.backgroundColor || '#fff',
                        border: `1px solid ${theme.tokens?.borderColor || '#ddd'}`,
                        borderRadius: theme.tokens?.borderRadius || '4px',
                        boxShadow: theme.tokens?.boxShadow || '0 2px 10px rgba(0,0,0,0.1)',
                        ...theme.menu,
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                        {column.sortable !== false && (
                            <>
                                <button
                                    onClick={() => {
                                        onSort('asc');
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        textAlign: 'left',
                                        padding: '4px 8px',
                                        background: currentSort === 'asc' ? (theme.tokens?.rowHoverColor || '#f0f0f0') : 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderRadius: '2px',
                                        color: theme.tokens?.textColor,
                                        ...theme.menuItem,
                                    }}
                                >
                                    ↑ Sort Ascending
                                </button>
                                <button
                                    onClick={() => {
                                        onSort('desc');
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        textAlign: 'left',
                                        padding: '4px 8px',
                                        background: currentSort === 'desc' ? (theme.tokens?.rowHoverColor || '#f0f0f0') : 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderRadius: '2px',
                                        color: theme.tokens?.textColor,
                                        ...theme.menuItem,
                                    }}
                                >
                                    ↓ Sort Descending
                                </button>
                                {currentSort && (
                                    <button
                                        onClick={() => {
                                            onSort(null);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            textAlign: 'left',
                                            padding: '4px 8px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#ff4d4f',
                                            fontSize: '12px',
                                            ...theme.menuItem,
                                        }}
                                    >
                                        ✕ Clear Sort
                                    </button>
                                )}
                                <div style={{ borderTop: `1px solid ${theme.tokens?.borderColor || '#eee'}`, margin: '4px 0' }} />
                            </>
                        )}

                        {onFreeze && (
                            <>
                                <button
                                    onClick={() => {
                                        onFreeze('left');
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        textAlign: 'left',
                                        padding: '4px 8px',
                                        background: column.fixed === 'left' ? (theme.tokens?.rowHoverColor || '#f0f0f0') : 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: theme.tokens?.textColor,
                                        ...theme.menuItem,
                                    }}
                                >
                                    ❄ Freeze Left
                                </button>
                                <button
                                    onClick={() => {
                                        onFreeze('right');
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        textAlign: 'left',
                                        padding: '4px 8px',
                                        background: column.fixed === 'right' ? (theme.tokens?.rowHoverColor || '#f0f0f0') : 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: theme.tokens?.textColor,
                                        ...theme.menuItem,
                                    }}
                                >
                                    ❄ Freeze Right
                                </button>
                                {column.fixed && (
                                    <button
                                        onClick={() => {
                                            onFreeze(null);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            textAlign: 'left',
                                            padding: '4px 8px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#ff4d4f',
                                            fontSize: '12px',
                                            ...theme.menuItem,
                                        }}
                                    >
                                        ✕ Unfreeze
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {column.filterable !== false && (
                        <div style={{ borderTop: `1px solid ${theme.tokens?.borderColor || '#eee'}`, paddingTop: '8px' }}>
                            <input
                                type={column.searchType || 'text'}
                                placeholder={`Search ${column.title}...`}
                                value={searchValue}
                                onChange={handleSearchChange}
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    boxSizing: 'border-box',
                                    backgroundColor: theme.tokens?.backgroundColor || '#fff',
                                    border: `1px solid ${theme.tokens?.borderColor || '#ddd'}`,
                                    color: theme.tokens?.textColor,
                                    borderRadius: theme.tokens?.borderRadius || '4px',
                                    ...theme.searchInput,
                                }}
                            />
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

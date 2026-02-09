
import { useEffect, useRef, useState } from 'react';
import type { FC, ReactNode } from 'react';
import type { CSSProperties } from 'react';
import type { TableTheme, Column, ContextMenuItem, ContextMenuDefaultOption } from '../types';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    theme: TableTheme;
    items: (ContextMenuItem | ContextMenuDefaultOption)[];
    record: any;
    column: Column<any>;
    onAction: (action: string, record: any, column: Column<any>) => void;
}

const DEFAULT_LABELS: Record<string, string> = {
    'hideRow': 'Hide Row',
    'hideColumn': 'Hide Column',
    'insertRowBelow': 'Insert Row Below',
    'insertRowAbove': 'Insert Row Above',
    'insertColumnLeft': 'Insert Column Left',
    'insertColumnRight': 'Insert Column Right',
    'renameColumn': 'Rename Column',
    'undo': 'Undo',
    'redo': 'Redo',
    'copy': 'Copy',
    'cut': 'Cut',
    'paste': 'Paste',
    'pasteSpecial': 'Paste Special...',
    'copyTableWithHeader': 'Copy Table (with Headers)',
    'copyTableWithoutHeader': 'Copy Table (no Headers)'
};

const DEFAULT_ICONS: Record<string, ReactNode> = {
    'hideRow': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>,
    'hideColumn': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>,
    'insertRowBelow': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line><path d="M19 21H5"></path></svg>,
    'insertRowAbove': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line><path d="M19 3H5"></path></svg>,
    'insertColumnLeft': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line><path d="M3 19V5"></path></svg>,
    'insertColumnRight': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line><path d="M21 19V5"></path></svg>,
    'renameColumn': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
    'undo': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"></path></svg>,
    'redo': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5"></path><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"></path></svg>,
    'copy': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>,
    'cut': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>,
    'paste': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>,
    'pasteSpecial': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>,
    'copyTableWithHeader': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="16" y2="14"></line><line x1="8" y1="18" x2="16" y2="18"></line></svg>,
    'copyTableWithoutHeader': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="4" y1="10" x2="20" y2="10"></line><line x1="4" y1="15" x2="20" y2="15"></line></svg>
};

export const DEFAULT_SHORTCUTS: Record<string, string> = {
    'undo': 'Mod+Z',
    'redo': 'Mod+Y',
    'copy': 'Mod+C',
    'copyTableWithHeader': 'Mod+Shift+C',
    'copyTableWithoutHeader': 'Mod+Alt+C',
    'cut': 'Mod+X',
    'paste': 'Mod+V'
};

const formatShortcut = (shortcut: string) => {
    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    return shortcut
        .replace('Mod', isMac ? '⌘' : 'Ctrl')
        .replace('Alt', isMac ? '⌥' : 'Alt')
        .replace('Shift', isMac ? '⇧' : 'Shift')
        .replace('Ctrl', isMac ? '⌃' : 'Ctrl')
        .replace('+', '');
};

const ContextMenuItemComponent: FC<{
    item: ContextMenuItem | ContextMenuDefaultOption;
    theme: TableTheme;
    record: any;
    column: Column<any>;
    onAction: (action: string, record: any, column: Column<any>) => void;
    onClose: () => void;
    depth?: number;
}> = ({ item, theme, record, column, onAction, onClose, depth = 0 }) => {
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    const isDefault = typeof item === 'string';
    const label = isDefault ? DEFAULT_LABELS[item as string] : (item as ContextMenuItem).label;
    const icon = isDefault
        ? DEFAULT_ICONS[item as string]
        : (typeof (item as ContextMenuItem).icon === 'string'
            ? DEFAULT_ICONS[(item as ContextMenuItem).icon as string]
            : (item as ContextMenuItem).icon);
    const shortcut = isDefault ? DEFAULT_SHORTCUTS[item as string] : (item as ContextMenuItem).shortcut;
    const children = isDefault ? undefined : (item as ContextMenuItem).children;
    const type = isDefault ? 'item' : (item as ContextMenuItem).type || 'item';
    const disabled = isDefault ? false : (item as ContextMenuItem).disabled;

    if (type === 'separator') {
        return <div style={{ height: 1, backgroundColor: theme.tokens?.borderColor || '#e2e8f0', margin: '4px 0' }} />;
    }

    const itemStyle: CSSProperties = {
        padding: '8px 12px',
        fontSize: '14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#94a3b8' : (theme.menuItem?.color || '#334155'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'left',
        border: 'none',
        background: 'transparent',
        position: 'relative',
        gap: '24px', // Increased gap to separate label from shortcut/arrow
        opacity: disabled ? 0.6 : 1,
        whiteSpace: 'nowrap',
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!disabled) {
            e.currentTarget.style.backgroundColor = theme.tokens?.rowHoverColor || '#f1f5f9';
        }
        if (children) {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
            setIsSubMenuOpen(true);
        }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        if (children) {
            timeoutRef.current = window.setTimeout(() => {
                setIsSubMenuOpen(false);
            }, 100);
        }
    };

    const handleClick = () => {
        if (disabled) return;
        if (children) return;

        if (isDefault) {
            onAction(item as string, record, column);
        } else if ((item as ContextMenuItem).onClick) {
            (item as ContextMenuItem).onClick!(record, column);
            onClose();
        }
    };

    // Calculate sub-menu side based on available space
    const subMenuRef = useRef<HTMLDivElement>(null);
    const [side, setSide] = useState<'left' | 'right'>('right');

    useEffect(() => {
        if (isSubMenuOpen) {
            const rect = subMenuRef.current?.getBoundingClientRect();
            if (rect && rect.right > window.innerWidth) {
                setSide('left');
            } else {
                setSide('right');
            }
        }
    }, [isSubMenuOpen]);

    return (
        <div
            style={itemStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                e.stopPropagation();
                handleClick();
            }}
            role="menuitem"
            tabIndex={disabled ? -1 : 0}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {shortcut && <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>{formatShortcut(shortcut)}</span>}
                {children && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>}
            </div>

            {children && isSubMenuOpen && (
                <div
                    ref={subMenuRef}
                    style={{
                        position: 'absolute',
                        left: side === 'right' ? '100%' : 'auto',
                        right: side === 'left' ? '100%' : 'auto',
                        top: '-4px',
                        backgroundColor: theme.menu?.backgroundColor || '#fff',
                        border: theme.menu?.border || '1px solid #e2e8f0',
                        borderRadius: theme.menu?.borderRadius || '6px',
                        boxShadow: theme.menu?.boxShadow || '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        padding: '4px 0',
                        zIndex: 1001,
                        minWidth: '180px',
                        width: 'max-content',
                    }}
                >
                    {children.map((child, idx) => (
                        <ContextMenuItemComponent
                            key={idx}
                            item={child}
                            theme={theme}
                            record={record}
                            column={column}
                            onAction={onAction}
                            onClose={onClose}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const ContextMenu: FC<ContextMenuProps> = ({
    x, y, onClose, theme, items, record, column, onAction
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Only close on left clicks outside the menu
            if (event.button !== 0) return;

            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const style: CSSProperties = {
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 2000,
        backgroundColor: theme.menu?.backgroundColor || '#fff',
        border: theme.menu?.border || '1px solid #e2e8f0',
        borderRadius: theme.menu?.borderRadius || '6px',
        boxShadow: theme.menu?.boxShadow || '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '4px 0',
        minWidth: '200px',
        width: 'max-content',
        maxWidth: '350px',
        fontFamily: theme.tokens?.fontFamily || 'inherit',
    };

    const [pos, setPos] = useState({ left: x, top: y });

    useEffect(() => {
        const updatePos = () => {
            if (menuRef.current) {
                const rect = menuRef.current.getBoundingClientRect();
                let newX = x;
                let newY = y;

                if (x + rect.width > window.innerWidth) {
                    newX = x - rect.width;
                }
                if (y + rect.height > window.innerHeight) {
                    newY = y - rect.height;
                }

                setPos({ left: Math.max(0, newX), top: Math.max(0, newY) });
            }
        };

        const frame = requestAnimationFrame(updatePos);
        return () => cancelAnimationFrame(frame);
    }, [x, y, items]);

    return (
        <div ref={menuRef} style={{ ...style, ...pos }}>
            {items.map((item, idx) => (
                <ContextMenuItemComponent
                    key={idx}
                    item={item}
                    theme={theme}
                    record={record}
                    column={column}
                    onAction={onAction}
                    onClose={onClose}
                />
            ))}
        </div>
    );
};

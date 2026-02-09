import { useState, useRef, useEffect, memo } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { Column, TableTheme } from '../types';

interface CellProps<T> {
    record: T;
    column: Column<T>;
    theme: TableTheme;
    index: number;
    onEdit?: (record: T, key: string, value: any) => void;
    onContextMenu?: (record: T, column: Column<T>, e: MouseEvent) => void;
    onFocus?: () => void;
    stickyStyles?: CSSProperties;
    showColumnBorders?: boolean;
}

import { isImageResult } from '../core/formulas';
import { formatValue } from '../core/formatter';
import { Calendar } from '../components/Calendar';

const CellInner = <T,>({
    record,
    column,
    theme,
    index,
    onEdit,
    onContextMenu,
    onFocus,
    stickyStyles,
    showColumnBorders
}: CellProps<T>) => {
    const value = (record as any)[column.key];
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    const editable = typeof column.editable === 'function'
        ? column.editable(record)
        : column.editable;

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleDoubleClick = () => {
        if (editable) {
            setIsEditing(true);
        }
    };

    const handleBlur = () => {
        commitEdit();
    };

    // Auto-open calendar on edit
    useEffect(() => {
        if (isEditing && (column.type === 'date' || column.type === 'datetime')) {
            setShowCalendar(true);
        }
    }, [isEditing, column.type]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitEdit();
            moveFocus('down');
        } else if (e.key === 'Tab') {
            e.preventDefault();
            commitEdit();
            moveFocus(e.shiftKey ? 'left' : 'right');
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(value);
        }
    };

    const handleTdKeyDown = (e: React.KeyboardEvent) => {
        if (!isEditing && editable) {
            // Check if it's a "printable" character (length 1 and no modifiers)
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                setIsEditing(true);
                setEditValue(e.key);
                e.preventDefault();
            } else if (e.key === 'Enter' || e.key === 'F2') {
                setIsEditing(true);
                setEditValue(value);
                e.preventDefault();
            }
        }
    };

    const moveFocus = (direction: 'left' | 'right' | 'down') => {
        // Simple DOM navigation. 
        // Note: This relies on the table structure being rendered consistently.
        const currentCell = inputRef.current?.closest('td') || document.activeElement?.closest('td');
        if (!currentCell) return;

        let target: HTMLElement | null = null;

        if (direction === 'right') {
            target = currentCell.nextElementSibling as HTMLElement;
        } else if (direction === 'left') {
            target = currentCell.previousElementSibling as HTMLElement;
        } else if (direction === 'down') {
            const currentRow = currentCell.closest('tr');
            const nextRow = currentRow?.nextElementSibling;
            if (nextRow) {
                const index = Array.from(currentRow?.children || []).indexOf(currentCell);
                if (index !== -1) {
                    target = nextRow.children[index] as HTMLElement;
                }
            }
        }

        if (target) {
            target.focus();
            // Optional: If we want to start editing immediately on nav, we'd need more state control.
            // For now, just focus.
        }
    };

    const commitEdit = () => {
        if (isEditing) {
            setIsEditing(false);
            if (editValue !== value && onEdit) {
                let finalValue = editValue;
                if (column.type === 'number') {
                    finalValue = parseFloat(editValue);
                }

                if (editValue instanceof Date) {
                    if (!isNaN(editValue.getTime())) {
                        finalValue = editValue.toISOString();
                    } else {
                        // Revert if invalid date provided via object
                        finalValue = value;
                    }
                }

                onEdit(record, column.key, finalValue);
            }
        }
    };

    const renderValue = () => {
        if (column.render) return column.render(value, record, index);

        if (isImageResult(value)) {
            return (
                <img
                    src={value.url}
                    alt={value.alt || ''}
                    style={{
                        maxWidth: value.width || '100%',
                        maxHeight: value.height || '100%',
                        objectFit: 'contain'
                    }}
                />
            );
        }

        return formatValue(value, column.type, column.format);
    };

    // Calendar State
    const [showCalendar, setShowCalendar] = useState(false);

    // ...

    // Render specific input based on type
    const renderInput = () => {
        // ... boolean ...

        if (column.type === 'date' || column.type === 'datetime') {
            return (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <input
                        ref={inputRef}
                        // Allow typing by checking if editValue is valid Date for display, else show raw
                        value={editValue instanceof Date ? editValue.toLocaleDateString() : editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                            setTimeout(() => {
                                if (!document.activeElement?.closest('.tablez-calendar')) {
                                    handleBlur();
                                }
                            }, 100);
                        }}
                        onKeyDown={handleKeyDown}
                        onClick={() => setShowCalendar(true)}
                        style={{
                            width: '100%',
                            height: '100%',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            ...theme.editInput,
                            cursor: 'pointer'
                        }}
                    />
                    {showCalendar && (
                        <div className="tablez-calendar" onMouseDown={(e) => e.preventDefault()}>
                            <Calendar
                                value={(() => {
                                    if (editValue instanceof Date) return editValue;
                                    if (!editValue) return undefined;
                                    const d = new Date(editValue);
                                    return !isNaN(d.getTime()) ? d : undefined;
                                })()}
                                onChange={(date) => {
                                    setEditValue(date);
                                    setShowCalendar(false);
                                    // Optionally commit immediately
                                }}
                                theme={theme}
                            />
                        </div>
                    )}
                </div>
            );
        }

        return (
            <input
                ref={inputRef}
                type={column.type === 'number' ? 'number' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                style={{
                    width: '100%',
                    height: '100%',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    textAlign: column.type === 'number' ? 'right' : 'left',
                    ...theme.editInput,
                    ...column.style,
                }}
            />
        );
    }

    return (
        <td
            tabIndex={0}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleTdKeyDown}
            onContextMenu={(e) => onContextMenu?.(record, column, e)}
            onFocus={onFocus}
            className={column.className}
            style={{
                ...theme.cell,
                ...column.style,
                ...stickyStyles,
                borderRight: showColumnBorders ? `1px solid ${theme.tokens?.borderColor || '#e2e8f0'}` : 'none',
                textAlign: column.align ?? (column.type === 'number' ? 'right' : 'left'), // Default align right for numbers
                position: isEditing ? 'relative' : (stickyStyles?.position as any || 'relative'),
                width: column.width,
                minWidth: column.width,
                maxWidth: column.width,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minHeight: '20px',
                backgroundColor: isEditing ? undefined : (stickyStyles?.backgroundColor || theme.cell?.backgroundColor || theme.row?.backgroundColor || theme.tokens?.backgroundColor || '#fff'),
            }}
        >
            {isEditing ? renderInput() : renderValue()}
        </td>
    );
};

export const Cell = memo(CellInner) as typeof CellInner;

import { useState, useRef, useEffect, memo } from 'react';
import type { CSSProperties } from 'react';
import type { Column, TableTheme } from '../types';

interface CellProps<T> {
    record: T;
    column: Column<T>;
    theme: TableTheme;
    index: number;
    onEdit?: (record: T, key: string, value: any) => void;
    stickyStyles?: CSSProperties;
    showColumnBorders?: boolean;
}

import { isImageResult } from '../core/formulas';
import { formatValue } from '../core/formatter';
import { Calendar } from '../components/Calendar';

const CellInner = <T,>({ record, column, theme, index, onEdit, stickyStyles, showColumnBorders }: CellProps<T>) => {
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commitEdit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(value);
        }
    };

    const commitEdit = () => {
        if (isEditing) {
            // Validate if needed?
            setIsEditing(false);
            if (editValue !== value && onEdit) {
                // Parse value based on type before committing?
                // For number input, it's string usually, convert to number
                let finalValue = editValue;
                if (column.type === 'number') {
                    finalValue = parseFloat(editValue);
                } else if (column.type === 'boolean') {
                    // Checkbox handling might differ
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

    // Render specific input based on type
    const renderInput = () => {
        if (column.type === 'boolean') {
            return (
                <input
                    type="checkbox"
                    checked={!!editValue}
                    onChange={(e) => setEditValue(e.target.checked)}
                    onBlur={handleBlur}
                    ref={inputRef}
                    style={{ cursor: 'pointer' }}
                />
            );
        }

        if (column.type === 'date' || column.type === 'datetime') {
            return (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <input
                        ref={inputRef}
                        value={editValue ? new Date(editValue).toLocaleDateString() : ''}
                        readOnly // Prevent manual typing to force widget usage? Or allow logic?
                        // Actually let's allow typing if we want, but for now simple readonly with widget
                        onClick={() => setShowCalendar(true)}
                        onBlur={() => {
                            // Delay blur to allow clicking on calendar
                            setTimeout(() => {
                                if (!document.activeElement?.closest('.tablez-calendar')) {
                                    handleBlur();
                                }
                            }, 100);
                        }}
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
                                value={editValue ? new Date(editValue) : undefined}
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
                }}
            />
        );
    }

    return (
        <td
            onDoubleClick={handleDoubleClick}
            className={column.className}
            style={{
                ...theme.cell,
                ...column.style,
                ...stickyStyles,
                borderRight: showColumnBorders ? `1px solid ${theme.tokens?.borderColor || '#e2e8f0'}` : 'none',
                textAlign: column.align ?? (column.type === 'number' ? 'right' : 'left'), // Default align right for numbers
                position: isEditing ? 'relative' : (stickyStyles?.position as any || 'relative'),
                minHeight: '20px',
                backgroundColor: isEditing ? undefined : (stickyStyles?.backgroundColor || theme.cell?.backgroundColor || theme.tokens?.backgroundColor || '#fff'),
            }}
        >
            {isEditing ? renderInput() : renderValue()}
        </td>
    );
};

export const Cell = memo(CellInner) as typeof CellInner;

import { useState, useRef, useEffect, memo } from 'react';
import type { Column, TableTheme } from '../types';

interface CellProps<T> {
    record: T;
    column: Column<T>;
    theme: TableTheme;
    index: number;
    onEdit?: (record: T, key: string, value: any) => void;
}

const CellInner = <T,>({ record, column, theme, index, onEdit }: CellProps<T>) => {
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
            setIsEditing(false);
            if (editValue !== value && onEdit) {
                onEdit(record, column.key, editValue);
            }
        }
    };

    return (
        <td
            onDoubleClick={handleDoubleClick}
            style={{
                ...theme.cell,
                textAlign: column.align,
                position: 'relative',
                minHeight: '20px',
            }}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: '1px solid #3b82f6',
                        borderRadius: '2px',
                        padding: '4px 8px',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        ...theme.editInput,
                    }}
                />
            ) : (
                column.render ? column.render(value, record, index) : value
            )}
        </td>
    );
};

export const Cell = memo(CellInner) as typeof CellInner;

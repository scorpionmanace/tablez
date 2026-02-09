import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { Column, TableTheme } from '../types';
import { Cell } from './Cell';

interface RowProps<T> {
    record: T;
    columns: Column<T>[];
    theme: TableTheme;
    onClick?: (record: T) => void;
    onCellEdit?: (record: T, key: string, value: any) => void;
    style?: CSSProperties;
    index: number;
    className?: string | ((record: T, index: number) => string);
}

const RowInner = <T,>({ record, columns, theme, onClick, onCellEdit, style, index, className }: RowProps<T>) => {
    const rowClassName = typeof className === 'function' ? className(record, index) : className;

    return (
        <tr
            className={rowClassName}
            style={{ ...theme.row, ...style, cursor: onClick ? 'pointer' : 'default' }}
            onClick={() => onClick?.(record)}
        >
            {columns.map((col, index) => (
                <Cell
                    key={col.key || index}
                    record={record}
                    column={col}
                    theme={theme}
                    index={index}
                    onEdit={onCellEdit}
                />
            ))}
        </tr>
    );
};

export const Row = memo(RowInner) as typeof RowInner;

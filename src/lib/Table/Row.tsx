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
}

const RowInner = <T,>({ record, columns, theme, onClick, onCellEdit, style }: RowProps<T>) => {
    return (
        <tr
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

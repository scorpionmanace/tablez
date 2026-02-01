import type { CSSProperties } from 'react';
import type { Column, TableTheme } from '../types';

interface RowProps<T> {
    record: T;
    columns: Column<T>[];
    theme: TableTheme;
    onClick?: (record: T) => void;
    style?: CSSProperties;
}

export const Row = <T,>({ record, columns, theme, onClick, style }: RowProps<T>) => {
    return (
        <tr
            style={{ ...theme.row, ...style, cursor: onClick ? 'pointer' : 'default' }}
            onClick={() => onClick?.(record)}
        >
            {columns.map((col, index) => {
                const value = (record as any)[col.key];
                return (
                    <td
                        key={col.key || index}
                        style={{
                            ...theme.cell,
                            textAlign: col.align,
                        }}
                    >
                        {col.render ? col.render(value, record, index) : value}
                    </td>
                );
            })}
        </tr>
    );
};

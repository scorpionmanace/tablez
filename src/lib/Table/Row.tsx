import { memo, useMemo } from 'react';
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
    showColumnBorders?: boolean;
}

const RowInner = <T,>({ record, columns, theme, onClick, onCellEdit, style, index, className, showColumnBorders }: RowProps<T>) => {
    const rowClassName = typeof className === 'function' ? className(record, index) : className;

    // Calculate sticky offsets
    const leftOffsets = useMemo(() => {
        let current = 0;
        return columns.map(col => {
            const offset = col.fixed === 'left' ? current : 0;
            if (col.fixed === 'left') current += col.width || 100;
            return offset;
        });
    }, [columns]);

    const rightOffsets = useMemo(() => {
        let current = 0;
        const reversed = [...columns].reverse();
        const offsetsMap: Record<string, number> = {};
        reversed.forEach(col => {
            if (col.fixed === 'right') {
                offsetsMap[col.key] = current;
                current += col.width || 100;
            }
        });
        return offsetsMap;
    }, [columns]);

    return (
        <tr
            className={rowClassName}
            style={{ ...theme.row, ...style, cursor: onClick ? 'pointer' : 'default' }}
            onClick={() => onClick?.(record)}
        >
            {columns.map((col, idx) => {
                const isFixed = !!col.fixed;
                const stickyStyles: CSSProperties = isFixed ? {
                    position: 'sticky',
                    left: col.fixed === 'left' ? leftOffsets[idx] : undefined,
                    right: col.fixed === 'right' ? rightOffsets[col.key] : undefined,
                    zIndex: 10,
                    backgroundColor: theme.cell?.backgroundColor || theme.row?.backgroundColor || '#fff',
                } : {};

                return (
                    <Cell
                        key={col.key || idx}
                        record={record}
                        column={col}
                        theme={theme}
                        index={idx}
                        onEdit={onCellEdit}
                        stickyStyles={stickyStyles}
                        showColumnBorders={showColumnBorders}
                    />
                );
            })}
        </tr>
    );
};

export const Row = memo(RowInner) as typeof RowInner;

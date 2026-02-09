import { memo, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Column, TableTheme } from '../types';
import { Cell } from './Cell';
import { calculateColumnOffsets } from '../core/engine';

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
    height?: number;
}

const RowInner = <T,>({ record, columns, theme, onClick, onCellEdit, style, index, className, showColumnBorders, height }: RowProps<T>) => {
    const [isHovered, setIsHovered] = useState(false);
    const rowClassName = typeof className === 'function' ? className(record, index) : className;

    const isRowSticky = style?.position === 'sticky';

    const rowStyle: CSSProperties = useMemo(() => ({
        ...theme.row,
        height: height,
        maxHeight: height,
        backgroundColor: isHovered ? (theme.tokens?.rowHoverColor || '#f1f5f9') : theme.row?.backgroundColor,
        boxSizing: 'border-box',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease',
        ...style, // Allow style override (e.g. position: sticky)
    }), [theme.row, theme.tokens?.rowHoverColor, isHovered, style, height, onClick]);

    // Calculate sticky offsets
    const { leftOffsets, rightOffsets } = useMemo(() =>
        calculateColumnOffsets(columns),
        [columns]);

    return (
        <tr
            className={rowClassName}
            style={rowStyle}
            onClick={() => onClick?.(record)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {columns.map((col, idx) => {
                const isFixed = !!col.fixed;
                const stickyStyles: CSSProperties = isFixed ? {
                    position: 'sticky',
                    left: col.fixed === 'left' ? leftOffsets[idx] : undefined,
                    right: col.fixed === 'right' ? rightOffsets[col.key] : undefined,
                    zIndex: isRowSticky ? 40 : 20, // Higher for frozen rows
                    backgroundColor: theme.cell?.backgroundColor || theme.row?.backgroundColor || theme.tokens?.backgroundColor || '#fff',
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

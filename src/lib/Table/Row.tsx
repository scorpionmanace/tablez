import { memo, useMemo, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { Column, TableTheme } from '../types';
import { Cell } from './Cell';
import { calculateColumnOffsets } from '../core/engine';

interface RowProps<T> {
    record: T;
    columns: Column<T>[];
    theme: TableTheme;
    onClick?: (record: T) => void;
    onCellEdit?: (record: T, key: string, value: any) => void;
    onContextMenu?: (record: T, column: Column<T>, e: MouseEvent) => void;
    onFocus?: (column: Column<T>) => void;
    style?: CSSProperties;
    index: number;
    className?: string | ((record: T, index: number) => string);
    showColumnBorders?: boolean;
    height?: number;
}

const RowInner = <T,>({
    record,
    columns,
    theme,
    onClick,
    onCellEdit,
    onContextMenu,
    onFocus,
    style,
    index,
    className,
    showColumnBorders,
    height
}: RowProps<T>) => {
    const [isHovered, setIsHovered] = useState(false);

    // Dynamic styles calculations...
    const rowClassName = typeof className === 'function' ? className(record, index) : className;
    const isRowSticky = style?.position === 'sticky';

    const rowStyle: CSSProperties = useMemo(() => ({
        ...theme.row,
        height: height,
        maxHeight: height,
        // Apply hover color if hovered, otherwise default row bg
        backgroundColor: isHovered
            ? (theme.tokens?.rowHoverColor || '#f1f5f9')
            : (style?.backgroundColor || theme.row?.backgroundColor),
        boxSizing: 'border-box',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease',
        ...style,
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
                // Sticky styles for frozen columns
                const cellBg = isHovered
                    ? (theme.tokens?.rowHoverColor || '#f1f5f9')
                    : (theme.cell?.backgroundColor || theme.row?.backgroundColor || theme.tokens?.backgroundColor || '#fff');

                const stickyStyles: CSSProperties = isFixed ? {
                    position: 'sticky',
                    left: col.fixed === 'left' ? leftOffsets[idx] : undefined,
                    right: col.fixed === 'right' ? rightOffsets[col.key] : undefined,
                    zIndex: isRowSticky ? 40 : 20,
                    backgroundColor: cellBg,
                } : {};

                return (
                    <Cell
                        key={col.key || idx}
                        record={record}
                        column={col}
                        theme={theme}
                        index={idx}
                        onEdit={onCellEdit}
                        onContextMenu={onContextMenu}
                        onFocus={() => onFocus?.(col)}
                        stickyStyles={stickyStyles}
                        showColumnBorders={showColumnBorders}
                    />
                );
            })}
        </tr>
    );
};

export const Row = memo(RowInner) as typeof RowInner;

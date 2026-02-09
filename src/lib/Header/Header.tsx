import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FC } from 'react';
import type { Column, TableTheme, TableSortDirection, TableSortState, TableFilters } from '../types';
import { ColumnMenu } from './ColumnMenu';

interface HeaderProps {
    columns: Column[];
    theme: TableTheme;
    resizable?: boolean;
    onResize?: (index: number, width: number) => void;
    onSort: (key: string, direction: TableSortDirection) => void;
    onFilter: (key: string, value: string) => void;
    onFreeze?: (key: string, direction: 'left' | 'right' | null) => void;
    sortState?: TableSortState;
    filters?: TableFilters;
}

export const Header: FC<HeaderProps> = ({
    columns,
    theme,
    resizable,
    onResize,
    onSort,
    onFilter,
    onFreeze,
    sortState,
    filters = {}
}) => {
    const [resizingIndex, setResizingIndex] = useState<number | null>(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    const handleMouseDown = (e: React.MouseEvent, index: number, width: number) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent propagation
        setResizingIndex(index);
        setStartX(e.clientX);
        setStartWidth(width);
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (resizingIndex === null) return;

            const diff = e.clientX - startX;
            const newWidth = Math.max(50, startWidth + diff); // Minimum width 50px

            if (onResize) {
                onResize(resizingIndex, newWidth);
            }
        },
        [resizingIndex, startX, startWidth, onResize]
    );

    const handleMouseUp = useCallback(() => {
        setResizingIndex(null);
    }, []);

    useEffect(() => {
        if (resizingIndex !== null) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingIndex, handleMouseMove, handleMouseUp]);

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
        <thead style={{ ...theme.header, position: 'sticky', top: 0, zIndex: 40 }}>
            <tr>
                {columns.map((col, index) => {
                    const isFixed = !!col.fixed;
                    const stickyStyles: any = isFixed ? {
                        position: 'sticky',
                        left: col.fixed === 'left' ? leftOffsets[index] : undefined,
                        right: col.fixed === 'right' ? rightOffsets[col.key] : undefined,
                        zIndex: 50,
                        backgroundColor: theme.header?.backgroundColor || '#fff', // Ensure opaque background
                    } : {};

                    return (
                        <th
                            key={col.key || index}
                            className={col.headerClassName}
                            style={{
                                ...theme.headerCell,
                                ...col.headerStyle,
                                ...stickyStyles,
                                width: col.width,
                                textAlign: col.align,
                                userSelect: 'none', // Prevent text selection while resizing
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                                {col.headerRender ? (
                                    col.headerRender(col)
                                ) : (
                                    <span>{col.title}</span>
                                )}
                                <ColumnMenu
                                    column={col}
                                    theme={theme}
                                    onSort={(dir) => onSort(col.key, dir)}
                                    onFilter={(val) => onFilter(col.key, val)}
                                    onFreeze={(dir) => onFreeze?.(col.key, dir)}
                                    currentSort={sortState?.columnKey === col.key ? sortState.direction : null}
                                    currentFilter={filters[col.key]}
                                />
                            </div>
                            {resizable && col.resizable !== false && (
                                <div
                                    onMouseDown={(e) => handleMouseDown(e, index, col.width || 100)}
                                    onClick={(e) => e.stopPropagation()} // Prevent sort/click events
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '5px',
                                        cursor: 'col-resize',
                                        userSelect: 'none',
                                        touchAction: 'none',
                                        zIndex: 1,
                                    }}
                                    className="tablez-resizer"
                                />
                            )}
                        </th>
                    );
                })}
            </tr>
        </thead>
    );
};

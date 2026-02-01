import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import type { Column, TableTheme } from '../types';

interface HeaderProps {
    columns: Column[];
    theme: TableTheme;
    resizable?: boolean;
    onResize?: (index: number, width: number) => void;
}

export const Header: FC<HeaderProps> = ({ columns, theme, resizable, onResize }) => {
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

    return (
        <thead style={theme.header}>
            <tr>
                {columns.map((col, index) => (
                    <th
                        key={col.key || index}
                        style={{
                            ...theme.headerCell,
                            width: col.width,
                            textAlign: col.align,
                            position: 'relative', // For absolute positioning of resizer
                            userSelect: 'none', // Prevent text selection while resizing
                        }}
                    >
                        {col.title}
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
                ))}
            </tr>
        </thead>
    );
};

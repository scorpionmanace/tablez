import { useState, useRef } from 'react';
import type { FC } from 'react';
import type { Column, TableTheme } from '../types';

interface SidePanelProps<T = any> {
  columns: Column<T>[];
  theme: TableTheme;
  onColumnsChange: (columns: Column<T>[]) => void;
  width?: number;
  onClose: () => void;
}

export const SidePanel: FC<SidePanelProps> = ({
  columns,
  theme,
  onColumnsChange,
  width = 240,
  onClose,
}) => {
  const borderColor = theme.tokens?.borderColor ?? '#e2e8f0';
  const bgColor = theme.tokens?.backgroundColor ?? '#fff';
  const headerBg = theme.tokens?.headerBackgroundColor ?? '#f8fafc';
  const textColor = theme.tokens?.textColor ?? '#334155';
  const primaryColor = theme.tokens?.primaryColor ?? '#3b82f6';
  const fontSize = theme.tokens?.fontSize ?? '13px';

  const dragIndexRef = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const toggleHidden = (key: string) => {
    const next = columns.map((c) => (c.key === key ? { ...c, hidden: !c.hidden } : c));
    onColumnsChange(next);
  };

  const showAll = () => onColumnsChange(columns.map((c) => ({ ...c, hidden: false })));
  const hideAll = () => onColumnsChange(columns.map((c) => ({ ...c, hidden: true })));

  const handleDragStart = (idx: number) => {
    dragIndexRef.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOver(idx);
  };

  const handleDrop = (toIdx: number) => {
    const fromIdx = dragIndexRef.current;
    if (fromIdx === null || fromIdx === toIdx) {
      setDragOver(null);
      return;
    }
    const next = [...columns];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    dragIndexRef.current = null;
    setDragOver(null);
    onColumnsChange(next);
  };

  const visibleCount = columns.filter((c) => !c.hidden).length;

  return (
    <div
      style={{
        width,
        minWidth: width,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          backgroundColor: headerBg,
          borderBottom: `1px solid ${borderColor}`,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize, color: textColor }}>Columns</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: textColor,
            opacity: 0.6,
            padding: '2px 4px',
            lineHeight: 1,
            fontSize: '16px',
          }}
          aria-label="Close columns panel"
        >
          ×
        </button>
      </div>

      {/* Show/Hide All */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 12px',
          borderBottom: `1px solid ${borderColor}`,
          flexShrink: 0,
        }}
      >
        <button
          onClick={showAll}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '12px',
            border: `1px solid ${borderColor}`,
            borderRadius: 4,
            background: 'transparent',
            cursor: 'pointer',
            color: textColor,
          }}
        >
          Show all
        </button>
        <button
          onClick={hideAll}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '12px',
            border: `1px solid ${borderColor}`,
            borderRadius: 4,
            background: 'transparent',
            cursor: 'pointer',
            color: textColor,
          }}
        >
          Hide all
        </button>
      </div>

      {/* Counter */}
      <div
        style={{
          padding: '4px 12px 6px',
          fontSize: '11px',
          color: textColor,
          opacity: 0.5,
          flexShrink: 0,
        }}
      >
        {visibleCount} of {columns.length} visible
      </div>

      {/* Column list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {columns.map((col, idx) => {
          const label =
            typeof col.title === 'string' || typeof col.title === 'number'
              ? String(col.title)
              : col.key;

          return (
            <div
              key={col.key}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragLeave={() => setDragOver(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                gap: 8,
                cursor: 'grab',
                backgroundColor: dragOver === idx ? `${primaryColor}12` : 'transparent',
                borderTop: dragOver === idx ? `2px solid ${primaryColor}` : '2px solid transparent',
                transition: 'background-color 0.1s',
              }}
            >
              {/* Drag handle */}
              <span style={{ color: textColor, opacity: 0.3, fontSize: 14, userSelect: 'none' }}>
                ⋮⋮
              </span>

              {/* Checkbox */}
              <input
                type="checkbox"
                checked={!col.hidden}
                onChange={() => toggleHidden(col.key)}
                style={{ cursor: 'pointer', accentColor: primaryColor, width: 14, height: 14 }}
              />

              {/* Label */}
              <span
                style={{
                  fontSize,
                  color: col.hidden ? `${textColor}80` : textColor,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

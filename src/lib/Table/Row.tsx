import { memo, useMemo, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { Column, TableTheme, SelectionSettings, TableSettings, CellComment } from '../types';
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
  readOnly?: boolean;
  disabled?: boolean;
  onToggle?: (record: T) => void;
  treeSettings?: any;
  // Selection
  selection?: SelectionSettings;
  isSelected?: boolean;
  onSelect?: (record: T, e: MouseEvent) => void;
  checkboxWidth?: number;
  // Row numbers
  rowNumber?: number;
  rowNumberWidth?: number;
  showRowNumbers?: boolean;
  tableSettings?: Pick<TableSettings, 'showColumnBorders'>;
  // Row dragging
  draggableRows?: boolean;
  rowDragIndex?: number;
  onRowDragStart?: (index: number) => void;
  onRowDragOver?: (index: number) => void;
  onRowDrop?: (toIndex: number) => void;
  isDragOver?: boolean;
  // Group row toggling
  onGroupToggle?: (groupKey: string | number) => void;
  // Cell range selection
  onCellMouseDown?: (rowIdx: number, colIdx: number, e: MouseEvent) => void;
  onCellMouseEnter?: (rowIdx: number, colIdx: number) => void;
  isCellInRange?: (rowIdx: number, colIdx: number) => boolean;
  enableFillHandle?: boolean;
  onFillHandle?: () => void;
  // Row animation
  animateRows?: boolean;
  // Comments
  comments?: CellComment[];
  commentMode?: boolean;
  onAddComment?: (columnKey: string, text: string) => void;
  onDeleteComment?: (id: string) => void;
  onResolveComment?: (id: string) => void;
}

const RowInner = <T extends Record<string, any>>({
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
  height,
  readOnly,
  disabled,
  onToggle,
  treeSettings,
  selection,
  isSelected,
  onSelect,
  checkboxWidth = 40,
  rowNumber,
  rowNumberWidth = 50,
  showRowNumbers = false,
  draggableRows = false,
  rowDragIndex,
  onRowDragStart,
  onRowDragOver,
  onRowDrop,
  isDragOver = false,
  onGroupToggle,
  onCellMouseDown,
  onCellMouseEnter,
  isCellInRange,
  enableFillHandle = false,
  onFillHandle,
  animateRows = false,
  comments = [],
  commentMode = false,
  onAddComment,
  onDeleteComment,
  onResolveComment,
}: RowProps<T>) => {
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic styles calculations...
  const rowClassName = typeof className === 'function' ? className(record, index) : className;
  const isRowSticky = style?.position === 'sticky';

  const selectionBg = theme.tokens?.primaryColor ? `${theme.tokens.primaryColor}18` : '#3b82f618';

  const rowStyle: CSSProperties = useMemo(
    () => ({
      ...theme.row,
      height: height,
      maxHeight: height,
      backgroundColor: isSelected
        ? selectionBg
        : isHovered
          ? (theme.tokens?.rowHoverColor ?? '#f1f5f9')
          : (style?.backgroundColor ?? theme.row?.backgroundColor),
      boxSizing: 'border-box',
      cursor: onClick ? 'pointer' : 'default',
      transition: animateRows
        ? 'background-color 0.15s ease, opacity 0.2s ease, transform 0.2s ease'
        : 'background-color 0.15s ease',
      opacity: disabled ? 0.6 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
      ...style,
    }),
    [
      theme.row,
      theme.tokens?.rowHoverColor,
      isHovered,
      isSelected,
      selectionBg,
      style,
      height,
      onClick,
      disabled,
      animateRows,
    ],
  );

  // Calculate sticky offsets
  const { leftOffsets, rightOffsets } = useMemo(() => calculateColumnOffsets(columns), [columns]);

  // Tree logic: which column is the expander?
  const expandColumnKey = useMemo(() => {
    if (treeSettings?.expandColumnKey) return treeSettings.expandColumnKey;
    // Default to the first fixed-left column if exists, else first column
    const firstFixedLeft = columns.find((c) => c.fixed === 'left');
    if (firstFixedLeft) return firstFixedLeft.key;
    return columns[0]?.key;
  }, [columns, treeSettings]);

  // Full-width row rendering
  const fullWidthCol = columns.find((c) => c.fullWidthRender);
  if (fullWidthCol?.fullWidthRender) {
    const totalCols =
      columns.length +
      (!!selection && (selection.showCheckbox ?? selection.mode !== 'single') ? 1 : 0) +
      (showRowNumbers ? 1 : 0);
    return (
      <tr style={{ ...theme.row, height: height, ...style }}>
        <td
          colSpan={totalCols}
          style={{
            padding: 0,
            borderBottom: `1px solid ${theme.tokens?.borderColor ?? '#e2e8f0'}`,
          }}
        >
          {fullWidthCol.fullWidthRender(record)}
        </td>
      </tr>
    );
  }

  // Group row rendering
  if ((record as any).__isGroupRow) {
    const groupRec = record as any;
    const totalCols =
      columns.length +
      (!!selection && (selection.showCheckbox ?? selection.mode !== 'single') ? 1 : 0) +
      (showRowNumbers ? 1 : 0);
    return (
      <tr
        style={{
          ...theme.row,
          height: height,
          backgroundColor: theme.tokens?.headerBackgroundColor ?? '#f8fafc',
          cursor: 'pointer',
          fontWeight: 600,
          ...style,
        }}
        onClick={() => onGroupToggle?.(groupRec.__groupKey)}
      >
        <td
          colSpan={totalCols}
          style={{
            padding: '6px 12px',
            borderBottom: `1px solid ${theme.tokens?.borderColor ?? '#e2e8f0'}`,
            display: 'table-cell',
          }}
        >
          <span
            style={{ marginRight: 8, color: theme.tokens?.primaryColor ?? '#3b82f6', fontSize: 12 }}
          >
            {groupRec.__expanded ? '▼' : '▶'}
          </span>
          <span style={{ color: theme.tokens?.textColor ?? '#1e293b' }}>
            {groupRec.__groupColumnKey}:{' '}
            <strong>{String(groupRec.__groupValue ?? '(blank)')}</strong>
          </span>
          <span style={{ marginLeft: 12, opacity: 0.5, fontSize: 12 }}>
            ({groupRec.__groupRows?.length ?? 0} rows)
          </span>
        </td>
      </tr>
    );
  }

  const showCheckbox = !!selection && (selection.showCheckbox ?? selection.mode !== 'single');
  const checkboxOnRight = selection?.checkboxPosition === 'right';
  const borderColor = theme.tokens?.borderColor ?? '#e2e8f0';
  const primaryColor = theme.tokens?.primaryColor ?? '#3b82f6';

  const checkboxCell = showCheckbox ? (
    <td
      key="__checkbox__"
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(record, e as MouseEvent);
      }}
      style={{
        width: checkboxWidth,
        minWidth: checkboxWidth,
        maxWidth: checkboxWidth,
        textAlign: 'center',
        verticalAlign: 'middle',
        cursor: 'pointer',
        borderRight: showColumnBorders ? `1px solid ${borderColor}` : 'none',
        backgroundColor: isSelected
          ? selectionBg
          : isHovered
            ? (theme.tokens?.rowHoverColor ?? '#f1f5f9')
            : (style?.backgroundColor ?? theme.row?.backgroundColor ?? '#fff'),
        position: style?.position === 'sticky' ? 'sticky' : undefined,
        left: !checkboxOnRight ? 0 : undefined,
        right: checkboxOnRight ? 0 : undefined,
        zIndex: style?.position === 'sticky' ? 35 : 15,
        boxSizing: 'border-box',
      }}
    >
      <input
        type="checkbox"
        checked={!!isSelected}
        onChange={() => {}}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(record, e as unknown as MouseEvent);
        }}
        style={{ cursor: 'pointer', accentColor: primaryColor, width: 14, height: 14 }}
      />
    </td>
  ) : null;

  return (
    <tr
      role="row"
      aria-selected={isSelected ? true : undefined}
      className={rowClassName}
      draggable={draggableRows}
      onDragStart={draggableRows ? () => onRowDragStart?.(rowDragIndex ?? 0) : undefined}
      onDragOver={
        draggableRows
          ? (e) => {
              e.preventDefault();
              onRowDragOver?.(rowDragIndex ?? 0);
            }
          : undefined
      }
      onDrop={draggableRows ? () => onRowDrop?.(rowDragIndex ?? 0) : undefined}
      style={{
        ...rowStyle,
        outline: isDragOver ? `2px solid ${theme.tokens?.primaryColor ?? '#3b82f6'}` : undefined,
        outlineOffset: isDragOver ? '-2px' : undefined,
      }}
      onClick={(e) => {
        if (!disabled) {
          if (selection) onSelect?.(record, e);
          onClick?.(record);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!!showRowNumbers && (
        <td
          key="__rownum__"
          style={{
            width: rowNumberWidth,
            minWidth: rowNumberWidth,
            maxWidth: rowNumberWidth,
            textAlign: 'center',
            verticalAlign: 'middle',
            borderRight: showColumnBorders ? `1px solid ${borderColor}` : 'none',
            color: theme.tokens?.textColor ?? '#94a3b8',
            opacity: 0.5,
            fontSize: theme.tokens?.fontSize ?? '12px',
            fontVariantNumeric: 'tabular-nums',
            userSelect: 'none',
            boxSizing: 'border-box',
            backgroundColor: isSelected
              ? selectionBg
              : isHovered
                ? (theme.tokens?.rowHoverColor ?? '#f1f5f9')
                : (style?.backgroundColor ?? theme.row?.backgroundColor ?? '#fff'),
          }}
        >
          {rowNumber}
        </td>
      )}
      {!checkboxOnRight && checkboxCell}
      {columns.map((col, idx) => {
        const isFixed = !!col.fixed;
        // Sticky styles for frozen columns
        const cellBg = isHovered
          ? (theme.tokens?.rowHoverColor ?? '#f1f5f9')
          : (theme.cell?.backgroundColor ??
            theme.row?.backgroundColor ??
            theme.tokens?.backgroundColor ??
            '#fff');

        const stickyStyles: CSSProperties = isFixed
          ? {
              position: 'sticky',
              left: col.fixed === 'left' ? leftOffsets[idx] : undefined,
              right: col.fixed === 'right' ? rightOffsets[col.key] : undefined,
              zIndex: isRowSticky ? 40 : 20,
              backgroundColor: cellBg,
            }
          : {};

        const isTreeExpander = treeSettings?.enabled && col.key === expandColumnKey;

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
            rowReadOnly={readOnly}
            rowDisabled={disabled}
            isTreeExpander={isTreeExpander}
            treeDepth={(record as any).__level}
            isExpanded={(record as any).__expanded}
            hasChildren={(record as any).__hasChildren}
            onToggleTree={() => onToggle?.(record)}
            treeSettings={treeSettings}
            onCellMouseDown={onCellMouseDown ? (e) => onCellMouseDown(index, idx, e) : undefined}
            onCellMouseEnter={onCellMouseEnter ? () => onCellMouseEnter(index, idx) : undefined}
            isInRange={isCellInRange?.(index, idx) ?? false}
            enableFillHandle={enableFillHandle && isCellInRange?.(index, idx) ? true : false}
            onFillHandle={onFillHandle}
            comments={comments.filter((c) => c.columnKey === col.key)}
            commentMode={commentMode}
            onAddComment={(text) => onAddComment?.(col.key, text)}
            onDeleteComment={onDeleteComment}
            onResolveComment={onResolveComment}
          />
        );
      })}
      {!!checkboxOnRight && checkboxCell}
    </tr>
  );
};

export const Row = memo(RowInner) as typeof RowInner;

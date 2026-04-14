export interface BaseTableSettings {
  virtualized?: boolean;
  containerHeight?: number;
  mode?: 'client' | 'server';
  loading?: boolean;
  draggableColumns?: boolean;
  frozenRows?: number;
}

export interface BaseRowSettings {
  height?: number;
  overscan?: number;
}

export interface VirtualizationParams extends BaseTableSettings, BaseRowSettings {
  scrollTop: number;
  dataLength: number;
}

export interface VirtualizationResult {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  bottomOffsetY: number;
  totalHeight: number;
}

export const calculateVirtualization = ({
  scrollTop,
  height = 50,
  containerHeight = 500,
  dataLength,
  overscan = 3,
  virtualized = true,
}: VirtualizationParams): VirtualizationResult => {
  const totalHeight = dataLength * height;

  if (!virtualized) {
    return {
      startIndex: 0,
      endIndex: dataLength,
      offsetY: 0,
      bottomOffsetY: 0,
      totalHeight,
    };
  }
  const startIndex = Math.max(0, Math.floor(scrollTop / height) - overscan);
  const endIndex = Math.min(
    dataLength,
    Math.ceil((scrollTop + containerHeight) / height) + overscan,
  );

  return {
    startIndex,
    endIndex,
    offsetY: startIndex * height,
    bottomOffsetY: Math.max(0, totalHeight - endIndex * height),
    totalHeight,
  };
};

export interface SortState {
  columnKey: string;
  direction: 'asc' | 'desc' | null;
}

export type Filters = Record<string, string>;

import { evaluateFormula } from './formulas';

export interface ColumnDef {
  key: string;
  width?: number;
  fixed?: 'left' | 'right';
  formula?: string;
}

/**
 * Processes data with sorting and filtering.
 * Framework agnostic.
 */
export const processData = <T extends Record<string, any>>(
  data: T[],
  filters: Filters,
  sortState?: SortState,
  columns: ColumnDef[] = [],
  childrenKey: string = 'children', // Now explicitly passed or defaulted
): T[] => {
  // 0. Pre-process formulas
  const hasFormulas = columns.some((c) => !!c.formula);
  let result = data.map((item) => {
    const newItem = { ...item } as Record<string, any>;
    if (hasFormulas) {
      columns.forEach((col) => {
        if (col.formula) {
          newItem[col.key] = evaluateFormula(col.formula, newItem);
        }
      });
    }
    // Recursive processing for children first
    if (newItem[childrenKey] && Array.isArray(newItem[childrenKey])) {
      newItem[childrenKey] = processData(
        newItem[childrenKey],
        filters,
        sortState,
        columns,
        childrenKey,
      );
    }
    return newItem as T;
  });

  // 1. Apply filters (bottom-up logic)
  const filterEntries = Object.entries(filters).filter(([_, v]) => !!v);
  if (filterEntries.length > 0) {
    result = result.filter((item) => {
      // Check if item matches any filter
      let matches = true;

      for (const [key, value] of filterEntries) {
        if (key === 'global') {
          const searchTerms = value.toLowerCase().split(/\s+/).filter(Boolean);
          const globalMatch = searchTerms.every((term) => {
            return columns.some((col) => {
              const itemValue = String(item[col.key] ?? '').toLowerCase();
              return itemValue.includes(term);
            });
          });
          if (!globalMatch) {
            matches = false;
            break;
          }
        } else {
          const itemValue = String(item[key] ?? '').toLowerCase();
          if (!itemValue.includes(value.toLowerCase())) {
            matches = false;
            break;
          }
        }
      }

      // If it has children that matched, keep this parent regardless
      const children = item[childrenKey];
      const hasMatchedChildren = Array.isArray(children) && children.length > 0;

      return matches || hasMatchedChildren;
    });
  }

  // 2. Apply sort (per level)
  if (sortState?.direction) {
    const { columnKey, direction } = sortState;
    result.sort((a, b) => {
      const valA = a[columnKey];
      const valB = b[columnKey];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      const comparison = valA < valB ? -1 : 1;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  return result;
};

/**
 * Flattens hierarchical data into a linear list for rendering.
 */
export const flattenTree = <T extends Record<string, any>>(
  data: T[],
  childrenKey: string = 'children',
  expandedKeys: Set<string | number> = new Set(),
  getRowKey: (record: T) => string | number,
  level: number = 0,
  forceExpand: boolean = false,
): (T & { __level: number; __hasChildren: boolean; __expanded: boolean })[] => {
  const result: (T & { __level: number; __hasChildren: boolean; __expanded: boolean })[] = [];

  data.forEach((item) => {
    const key = getRowKey(item);
    const children = item[childrenKey];
    const hasChildren = Array.isArray(children) && children.length > 0;
    const expanded = forceExpand || expandedKeys.has(key);

    result.push({
      ...item,
      __level: level,
      __hasChildren: hasChildren,
      __expanded: expanded,
    });

    if (hasChildren && expanded) {
      result.push(
        ...flattenTree(children, childrenKey, expandedKeys, getRowKey, level + 1, forceExpand),
      );
    }
  });

  return result;
};

export interface GroupRow<T> {
  __isGroupRow: true;
  __groupKey: string | number;
  __groupValue: any;
  __groupColumnKey: string;
  __groupRows: T[];
  __level: number;
  __expanded: boolean;
  __hasChildren: boolean;
  [key: string]: any;
}

/**
 * Groups flat data by one or more column keys.
 * Returns an interleaved array of group-header rows and data rows.
 */
export const groupData = <T extends Record<string, any>>(
  data: T[],
  groupByKeys: string[],
  expandedGroupKeys: Set<string | number>,
  columns: ColumnDef[],
): (T | GroupRow<T>)[] => {
  if (groupByKeys.length === 0) return data;

  const primaryKey = groupByKeys[0];

  // Group data by primary key
  const groups = new Map<any, T[]>();
  data.forEach((row) => {
    const val = row[primaryKey];
    const key = val === undefined || val === null ? '' : String(val);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  });

  const result: (T | GroupRow<T>)[] = [];

  groups.forEach((rows, groupKey) => {
    const groupValue = rows[0][primaryKey];
    const isExpanded = expandedGroupKeys.has(groupKey);

    // Compute aggregates for this group
    const aggregates: Record<string, any> = {};
    columns.forEach((col) => {
      const aggCol = col as ColumnDef & { aggregate?: string };
      if (!aggCol.aggregate) return;
      const nums = rows.map((r) => parseFloat(r[col.key])).filter((v) => !isNaN(v));
      if (nums.length === 0) return;
      switch (aggCol.aggregate) {
        case 'sum':
          aggregates[col.key] = nums.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregates[col.key] = nums.reduce((a, b) => a + b, 0) / nums.length;
          break;
        case 'count':
          aggregates[col.key] = nums.length;
          break;
        case 'min':
          aggregates[col.key] = Math.min(...nums);
          break;
        case 'max':
          aggregates[col.key] = Math.max(...nums);
          break;
      }
    });

    const groupRow: GroupRow<T> = {
      __isGroupRow: true,
      __groupKey: groupKey,
      __groupValue: groupValue,
      __groupColumnKey: primaryKey,
      __groupRows: rows,
      __level: 0,
      __expanded: isExpanded,
      __hasChildren: true,
      ...aggregates,
    };

    result.push(groupRow);

    if (isExpanded) {
      rows.forEach((row) =>
        result.push({ ...row, __level: 1, __hasChildren: false, __expanded: false } as any),
      );
    }
  });

  return result;
};

/**
 * Calculates sticky offsets for pinned columns.
 * Framework agnostic.
 */
export const calculateColumnOffsets = (columns: ColumnDef[]) => {
  const leftOffsets: number[] = [];
  let currentLeft = 0;

  columns.forEach((col) => {
    leftOffsets.push(col.fixed === 'left' ? currentLeft : 0);
    if (col.fixed === 'left') currentLeft += col.width ?? 100;
  });

  const rightOffsets: Record<string, number> = {};
  let currentRight = 0;

  [...columns].reverse().forEach((col) => {
    if (col.fixed === 'right') {
      rightOffsets[col.key] = currentRight;
      currentRight += col.width ?? 100;
    }
  });

  return { leftOffsets, rightOffsets };
};

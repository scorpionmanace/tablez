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
): T[] => {
  // 0. Pre-process formulas
  const hasFormulas = columns.some((c) => !!c.formula);
  let result = data.slice();

  if (hasFormulas) {
    result = result.map((item) => {
      const newItem = { ...item } as Record<string, any>;
      columns.forEach((col) => {
        if (col.formula) {
          newItem[col.key] = evaluateFormula(col.formula, newItem);
        }
      });
      return newItem as T;
    });
  }

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;
    if (key === 'global') {
      const searchTerms = value.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter((item) => {
        return searchTerms.every((term) => {
          return columns.some((col) => {
            const itemValue = String(item[col.key] ?? '').toLowerCase();
            return itemValue.includes(term);
          });
        });
      });
      return;
    }
    result = result.filter((item) => {
      const itemValue = String(item[key] ?? '').toLowerCase();
      return itemValue.includes(value.toLowerCase());
    });
  });

  // Apply sort
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

  // Recursive processing for children if they exist
  result = result.map((item) => {
    const childrenKey = (item as any).children ? 'children' : undefined; // Simple detection
    if (childrenKey && Array.isArray(item[childrenKey])) {
      return {
        ...item,
        [childrenKey]: processData(item[childrenKey], filters, sortState, columns),
      };
    }
    return item;
  });

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
): (T & { __level: number; __hasChildren: boolean; __expanded: boolean })[] => {
  const result: (T & { __level: number; __hasChildren: boolean; __expanded: boolean })[] = [];

  data.forEach((item) => {
    const key = getRowKey(item);
    const children = item[childrenKey];
    const hasChildren = Array.isArray(children) && children.length > 0;
    const expanded = expandedKeys.has(key);

    result.push({
      ...item,
      __level: level,
      __hasChildren: hasChildren,
      __expanded: expanded,
    });

    if (hasChildren && expanded) {
      result.push(...flattenTree(children, childrenKey, expandedKeys, getRowKey, level + 1));
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

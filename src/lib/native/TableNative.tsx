import type { ReactElement } from 'react';
import { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type {
  TableSettings,
  RowSettings,
  TableSortState,
  TableFilters,
  Column,
  TableSortDirection,
} from '../types';
import { processData, calculateColumnOffsets } from '../core/engine';
import { isImageResult } from '../core/formulas';

export interface NativeTableProps<T> {
  data: T[];
  columns: Column<T>[];

  // Grouped settings
  settings?: TableSettings;
  rowSettings?: RowSettings<T>;

  // Callbacks
  onSort?: (sortState: TableSortState) => void;
  onFilter?: (filters: TableFilters) => void;

  // State
  sortState?: TableSortState;
  filters?: TableFilters;
}

export const TableNative = <T extends Record<string, any>>({
  data,
  columns,
  settings = {},
  rowSettings = {},
  onSort,
  onFilter,
  sortState: propSortState,
  filters: propFilters,
}: NativeTableProps<T>): ReactElement => {
  const { loading = false, theme, containerStyle } = settings;

  const { height: rowHeight = 50 } = rowSettings;
  const [internalSortState, setInternalSortState] = useState<TableSortState | undefined>();
  const [internalFilters] = useState<TableFilters>({});

  const sortState = propSortState ?? internalSortState;
  const filters = propFilters ?? internalFilters;

  // Notify parent on filter change (if UI were added)
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      onFilter?.(filters);
    }
  }, [filters, onFilter]);

  const processedData = useMemo(() => {
    return processData(data, filters, sortState, columns as any);
  }, [data, filters, sortState, columns]);

  const { leftOffsets, rightOffsets } = useMemo(() => calculateColumnOffsets(columns), [columns]);

  const renderHeader = () => (
    <View style={[styles.header, theme?.header as ViewStyle]}>
      {columns.map((col, index) => {
        const isFixed = !!col.fixed;
        const stickyStyle: ViewStyle = isFixed
          ? {
              position: 'absolute',
              left: col.fixed === 'left' ? leftOffsets[index] : undefined,
              right: col.fixed === 'right' ? rightOffsets[col.key] : undefined,
              zIndex: 10,
              backgroundColor:
                ((theme?.header ?? theme?.tokens) as any)?.backgroundColor ?? '#f8fafc',
            }
          : {};

        return (
          <TouchableOpacity
            key={col.key || index}
            onPress={() => {
              if (col.sortable) {
                const currentDirection =
                  sortState?.columnKey === col.key ? sortState.direction : null;
                let nextDirection: TableSortDirection = 'asc';

                if (currentDirection === 'asc') nextDirection = 'desc';
                else if (currentDirection === 'desc') nextDirection = null;

                const newState: TableSortState = { columnKey: col.key, direction: nextDirection };
                setInternalSortState(newState);
                onSort?.(newState);
              }
            }}
            style={[
              styles.headerCell,
              { width: col.width ?? 120 },
              theme?.headerCell as ViewStyle,
              stickyStyle,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                numberOfLines={1}
                style={[styles.headerText, theme?.headerCell as TextStyle, { flex: 1 }]}
              >
                {typeof col.title === 'string' ? col.title : col.key}
              </Text>
              {!!col.sortable && (
                <View
                  style={{ marginLeft: 6, opacity: sortState?.columnKey === col.key ? 1 : 0.2 }}
                >
                  <View
                    style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 4,
                      borderRightWidth: 4,
                      borderBottomWidth: 5,
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderBottomColor:
                        sortState?.columnKey === col.key && sortState.direction === 'asc'
                          ? (theme?.tokens?.primaryColor ?? '#475569')
                          : '#94a3b8',
                      marginBottom: 2,
                    }}
                  />
                  <View
                    style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 4,
                      borderRightWidth: 4,
                      borderTopWidth: 5,
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderTopColor:
                        sortState?.columnKey === col.key && sortState.direction === 'desc'
                          ? (theme?.tokens?.primaryColor ?? '#475569')
                          : '#94a3b8',
                    }}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderRow = ({ item, index }: { item: T; index: number }) => (
    <View style={[styles.row, theme?.row as ViewStyle, { height: rowHeight }]}>
      {columns.map((col, colIndex) => {
        const value = item[col.key];
        const isFixed = !!col.fixed;
        const stickyStyle: ViewStyle = isFixed
          ? {
              position: 'absolute',
              left: col.fixed === 'left' ? leftOffsets[colIndex] : undefined,
              right: col.fixed === 'right' ? rightOffsets[col.key] : undefined,
              zIndex: 10,
              backgroundColor: ((theme?.cell ?? theme?.tokens) as any)?.backgroundColor ?? '#fff',
            }
          : {};

        const renderCellContent = () => {
          if (col.render) return col.render(value, item, index) as any;

          if (isImageResult(value)) {
            return (
              <Image
                source={{ uri: value.url }}
                style={{
                  width: value.width ?? '100%',
                  height: value.height ?? '100%',
                  resizeMode: 'contain',
                }}
              />
            );
          }

          return (
            <Text style={[styles.cellText, theme?.cell as TextStyle]}>{String(value ?? '')}</Text>
          );
        };

        return (
          <View
            key={col.key || colIndex}
            style={[
              styles.cell,
              { width: col.width ?? 120 },
              theme?.cell as ViewStyle,
              stickyStyle,
            ]}
          >
            {renderCellContent()}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, containerStyle as ViewStyle]}>
      <ScrollView horizontal bounces={false}>
        <View>
          {renderHeader()}
          <FlatList
            data={processedData}
            renderItem={renderRow}
            keyExtractor={(item, index) => (item as any).id?.toString() ?? index.toString()}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            getItemLayout={(_, index) => ({
              length: rowHeight,
              offset: rowHeight * index,
              index,
            })}
          />
        </View>
      </ScrollView>
      {!!loading && (
        <View style={styles.loadingOverlay}>
          <Text>Loading...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerCell: {
    padding: 12,
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: '700',
    color: '#475569',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cell: {
    padding: 12,
    justifyContent: 'center',
  },
  cellText: {
    color: '#1e293b',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import type { TableSettings, RowSettings, TableSortState, TableFilters, Column } from '../types';
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
}

export const TableNative = <T extends object>({
    data,
    columns,
    settings = {},
    rowSettings = {},
    onSort,
    onFilter,
}: NativeTableProps<T>) => {
    const {
        loading = false,
        theme,
        containerStyle
    } = settings;

    const {
        height: rowHeight = 50,
    } = rowSettings;
    const [sortState, setSortState] = useState<TableSortState | undefined>();
    const filters: TableFilters = {}; // Keep as placeholder for now

    // Notify parent on filter change (if UI were added)
    useMemo(() => {
        if (Object.keys(filters).length > 0) {
            onFilter?.(filters);
        }
    }, [filters, onFilter]);

    const processedData = useMemo(() => {
        return processData(data, filters, sortState, columns as any);
    }, [data, filters, sortState, columns]);

    const { leftOffsets, rightOffsets } = useMemo(() =>
        calculateColumnOffsets(columns),
        [columns]);

    const renderHeader = () => (
        <View style={[styles.header, theme?.header as any]}>
            {columns.map((col, index) => {
                const isFixed = !!col.fixed;
                const stickyStyle: ViewStyle = isFixed ? {
                    position: 'absolute',
                    left: col.fixed === 'left' ? (leftOffsets[index] as any) : undefined,
                    right: col.fixed === 'right' ? (rightOffsets[col.key] as any) : undefined,
                    zIndex: 10,
                    backgroundColor: (theme?.header as any)?.backgroundColor || '#f8fafc',
                } : {};

                return (
                    <TouchableOpacity
                        key={col.key || index}
                        onPress={() => {
                            if (col.sortable) {
                                const nextDir = sortState?.columnKey === col.key && sortState.direction === 'asc' ? 'desc' : 'asc';
                                const newState: TableSortState = { columnKey: col.key, direction: nextDir };
                                setSortState(newState);
                                onSort?.(newState);
                            }
                        }}
                        style={[
                            styles.headerCell,
                            { width: col.width || 120 },
                            theme?.headerCell as any,
                            stickyStyle
                        ]}
                    >
                        <Text style={[styles.headerText, theme?.headerCell as any]}>
                            {typeof col.title === 'string' ? col.title : col.key}
                            {sortState?.columnKey === col.key ? (sortState.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderRow = ({ item, index }: { item: T; index: number }) => (
        <View style={[styles.row, theme?.row as any, { height: rowHeight }]}>
            {columns.map((col, colIndex) => {
                const value = (item as any)[col.key];
                const isFixed = !!col.fixed;
                const stickyStyle: ViewStyle = isFixed ? {
                    position: 'absolute',
                    left: col.fixed === 'left' ? (leftOffsets[colIndex] as any) : undefined,
                    right: col.fixed === 'right' ? (rightOffsets[col.key] as any) : undefined,
                    zIndex: 10,
                    backgroundColor: (theme?.cell as any)?.backgroundColor || '#fff',
                } : {};

                const renderCellContent = () => {
                    if (col.render) return col.render(value, item, index) as any;

                    if (isImageResult(value)) {
                        return (
                            <Image
                                source={{ uri: value.url }}
                                style={{
                                    width: value.width || '100%',
                                    height: value.height || '100%',
                                    resizeMode: 'contain'
                                }}
                            />
                        );
                    }

                    return <Text style={[styles.cellText, theme?.cell as any]}>{String(value ?? '')}</Text>;
                };

                return (
                    <View
                        key={col.key || colIndex}
                        style={[
                            styles.cell,
                            { width: col.width || 120 },
                            theme?.cell as any,
                            stickyStyle
                        ]}
                    >
                        {renderCellContent()}
                    </View>
                );
            })}
        </View>
    );

    return (
        <View style={[styles.container, containerStyle]}>
            <ScrollView horizontal bounces={false}>
                <View>
                    {renderHeader()}
                    <FlatList
                        data={processedData}
                        renderItem={renderRow}
                        keyExtractor={(item, index) => (item as any).id?.toString() || index.toString()}
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
            {loading && (
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

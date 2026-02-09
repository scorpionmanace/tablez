import {
    calculateVirtualization,
    processData,
    calculateColumnOffsets,
    type SortState,
    type Filters,
    type ColumnDef
} from '../core/engine';

export interface TablezOptions<T> {
    data: T[];
    columns: ColumnDef[];
    rowHeight?: number;
    containerHeight?: number;
    overscan?: number;
    virtualized?: boolean;
    onUpdate?: (state: TablezState<T>) => void;
}

export interface TablezState<T> {
    visibleData: T[];
    startIndex: number;
    endIndex: number;
    offsetY: number;
    bottomOffsetY: number;
    totalHeight: number;
    leftOffsets: number[];
    rightOffsets: Record<string, number>;
}

/**
 * Vanilla JS / Generic Class Adapter for Tablez Engine
 */
export class TablezEngine<T extends object> {
    private options: TablezOptions<T>;
    private scrollTop: number = 0;
    private sortState?: SortState;
    private filters: Filters = {};
    private processedData: T[] = [];

    constructor(options: TablezOptions<T>) {
        this.options = {
            rowHeight: 50,
            containerHeight: 500,
            overscan: 3,
            virtualized: true,
            ...options
        };
        this.refreshData();
    }

    public setScrollTop(top: number) {
        this.scrollTop = top;
        this.emitUpdate();
    }

    public setSort(key: string, direction: 'asc' | 'desc' | null) {
        this.sortState = { columnKey: key, direction };
        this.refreshData();
    }

    public setFilter(key: string, value: string) {
        this.filters[key] = value;
        this.refreshData();
    }

    private refreshData() {
        this.processedData = processData(this.options.data, this.filters, this.sortState);
        this.emitUpdate();
    }

    private emitUpdate() {
        if (!this.options.onUpdate) return;

        const virt = calculateVirtualization({
            scrollTop: this.scrollTop,
            rowHeight: this.options.rowHeight!,
            containerHeight: this.options.containerHeight!,
            dataLength: this.processedData.length,
            overscan: this.options.overscan,
            virtualized: this.options.virtualized
        });

        const columnOffsets = calculateColumnOffsets(this.options.columns);

        this.options.onUpdate({
            visibleData: this.processedData.slice(virt.startIndex, virt.endIndex),
            startIndex: virt.startIndex,
            endIndex: virt.endIndex,
            offsetY: virt.offsetY,
            bottomOffsetY: virt.bottomOffsetY,
            totalHeight: virt.totalHeight,
            leftOffsets: columnOffsets.leftOffsets,
            rightOffsets: columnOffsets.rightOffsets,
        });
    }

    public getProcessedData() {
        return this.processedData;
    }
}

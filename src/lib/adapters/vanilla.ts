import {
    calculateVirtualization,
    processData,
    calculateColumnOffsets,
    type SortState,
    type Filters,
    type ColumnDef,
    type BaseTableSettings,
    type BaseRowSettings
} from '../core/engine';

export interface TablezOptions<T> {
    data: T[];
    columns: ColumnDef[];
    settings?: BaseTableSettings;
    rowSettings?: BaseRowSettings;
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
            ...options,
            settings: {
                virtualized: true,
                containerHeight: 500,
                ...options.settings
            },
            rowSettings: {
                height: 50,
                overscan: 3,
                ...options.rowSettings
            }
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
            dataLength: this.processedData.length,
            ...this.options.settings,
            ...this.options.rowSettings
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

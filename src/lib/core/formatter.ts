
import type { ColumnFormat } from '../types';

/**
 * Format primitive values based on ColumnType and ColumnFormat.
 */
export const formatValue = (value: any, type: string | undefined, format?: ColumnFormat): string => {
    if (value === null || value === undefined) return '';

    switch (type) {
        case 'number': {
            const num = Number(value);
            if (isNaN(num)) return String(value);

            let formattedNum = num.toString();
            if (format?.decimals !== undefined) {
                formattedNum = num.toFixed(format.decimals);
            }

            return `${format?.prefix || ''}${formattedNum}${format?.suffix || ''}`;
        }

        case 'date':
        case 'datetime': {
            const date = new Date(value);
            if (isNaN(date.getTime())) return String(value);

            if (!format?.dateFormat) {
                return type === 'datetime' ? date.toLocaleString() : date.toLocaleDateString();
            }

            return formatDate(date, format.dateFormat);
        }

        case 'boolean':
            return value ? 'True' : 'False'; // Or Checkbox logic in render

        default:
            return String(value);
    }
};

/**
 * Simple date formatter: YYYY, MM, DD, HH, mm, ss support.
 */
function formatDate(date: Date, format: string): string {
    const map: Record<string, string> = {
        'YYYY': date.getFullYear().toString(),
        'MM': String(date.getMonth() + 1).padStart(2, '0'),
        'DD': String(date.getDate()).padStart(2, '0'),
        'HH': String(date.getHours()).padStart(2, '0'),
        'mm': String(date.getMinutes()).padStart(2, '0'),
        'ss': String(date.getSeconds()).padStart(2, '0'),
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => map[match]);
}


import { useState, useMemo } from 'react';
import type { TableTheme } from '../types';

interface CalendarProps {
    value?: Date;
    onChange: (date: Date) => void;
    theme?: TableTheme;
}

const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const Calendar: React.FC<CalendarProps> = ({ value, onChange, theme }) => {
    // Current view state (year/month)
    const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());

    const { year, month } = useMemo(() => ({
        year: viewDate.getFullYear(),
        month: viewDate.getMonth()
    }), [viewDate]);

    // Generate grid
    const days = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = firstDay.getDay(); // 0 is Sunday
        const daysInMonth = lastDay.getDate();

        const grid: (number | null)[] = [];
        // Add empty cells for start offset
        for (let i = 0; i < startOffset; i++) {
            grid.push(null);
        }
        // Add days
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push(i);
        }
        return grid;
    }, [year, month]);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleDayClick = (day: number | null, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!day) return;
        const newDate = new Date(year, month, day);
        // Preserve time if value exists, else default to 00:00?
        // Let's just set date part for simplicity in this widget
        onChange(newDate);
    };

    // Styling
    const primaryColor = theme?.tokens?.primaryColor || '#3b82f6';

    return (
        <div
            style={{
                padding: '10px',
                backgroundColor: '#fff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '8px',
                width: '240px',
                fontFamily: theme?.tokens?.fontFamily || 'sans-serif',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                userSelect: 'none',
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 100
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing edit mode
            onMouseDown={(e) => e.preventDefault()} // Prevent blur
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <button
                    onClick={handlePrevMonth}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                >
                    &lt;
                </button>
                <div style={{ fontWeight: 600 }}>{months[month]} {year}</div>
                <button
                    onClick={handleNextMonth}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                >
                    &gt;
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: '4px' }}>
                {daysOfWeek.map(d => (
                    <div key={d} style={{ color: '#9ca3af', fontSize: '12px' }}>{d}</div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {days.map((day, idx) => {
                    const isSelected = value &&
                        day === value.getDate() &&
                        month === value.getMonth() &&
                        year === value.getFullYear();

                    return (
                        <div
                            key={idx}
                            onClick={(e) => handleDayClick(day, e)}
                            style={{
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: day ? 'pointer' : 'default',
                                borderRadius: '4px',
                                backgroundColor: isSelected ? primaryColor : 'transparent',
                                color: isSelected ? 'white' : (day ? '#374151' : 'transparent'),
                                fontSize: '13px'
                            }}
                            onMouseEnter={(e) => {
                                if (day && !isSelected) e.currentTarget.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                                if (day && !isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

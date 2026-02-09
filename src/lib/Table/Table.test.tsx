import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table } from './Table';
import type { Column } from '../types';

interface User {
    id: number;
    name: string;
}

const data: User[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
];

const columns: Column<User>[] = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
];

describe('Table Component', () => {
    it('renders data correctly', () => {
        render(<Table data={data} columns={columns} />);

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('handles row click', () => {
        const handleClick = vi.fn();
        render(<Table data={data} columns={columns} rowSettings={{ onClick: handleClick }} />);

        fireEvent.click(screen.getByText('Alice'));

        expect(handleClick).toHaveBeenCalledTimes(1);
        expect(handleClick).toHaveBeenCalledWith(data[0]);
    });

    describe('Virtualization', () => {
        it('renders all rows when virtualization is disabled', () => {
            const largeData = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `User ${i}`,
            }));

            render(<Table data={largeData} columns={columns} settings={{ virtualized: false }} />);

            // All rows should be rendered
            expect(screen.getByText('User 0')).toBeInTheDocument();
            expect(screen.getByText('User 99')).toBeInTheDocument();
        });

        it('renders only visible rows when virtualization is enabled', () => {
            const largeData = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `User ${i}`,
            }));

            render(
                <Table
                    data={largeData}
                    columns={columns}
                    settings={{
                        virtualized: true,
                        containerHeight: 500
                    }}
                    rowSettings={{
                        height: 50,
                        overscan: 3
                    }}
                />
            );

            // First few rows should be visible (within viewport + overscan)
            expect(screen.getByText('User 0')).toBeInTheDocument();

            // Rows far outside viewport should not be rendered
            expect(screen.queryByText('User 99')).not.toBeInTheDocument();
        });

        it('updates visible rows on scroll', async () => {
            // Mock requestAnimationFrame to run immediately
            vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
                cb(0);
                return 0;
            });

            const largeData = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `User ${i}`,
            }));

            const { container } = render(
                <Table
                    data={largeData}
                    columns={columns}
                    settings={{
                        virtualized: true,
                        containerHeight: 500
                    }}
                    rowSettings={{
                        height: 50
                    }}
                />
            );

            const scrollContainer = container.firstChild as HTMLElement;
            expect(scrollContainer).toBeInTheDocument();

            // Simulate scroll
            fireEvent.scroll(scrollContainer, { target: { scrollTop: 2500 } });

            // After scrolling, different rows should be visible
            expect(screen.queryByText('User 0')).not.toBeInTheDocument();

            vi.restoreAllMocks();
        });
    });
    describe('Sorting and Filtering', () => {
        const sortColumns: Column<User>[] = [
            { key: 'id', title: 'ID', sortable: true },
            { key: 'name', title: 'Name', sortable: true, filterable: true },
        ];

        it('sorts data client-side', () => {
            render(<Table data={data} columns={sortColumns} />);

            // Open menu and sort descending
            const menuButtons = screen.getAllByLabelText('Column Menu');
            fireEvent.click(menuButtons[1]); // Name column menu

            const descButton = screen.getByText('↓ Sort Descending');
            fireEvent.click(descButton);

            const rows = screen.getAllByRole('row');
            // Bob should be before Alice (descending)
            expect(rows[1]).toHaveTextContent('Bob');
            expect(rows[2]).toHaveTextContent('Alice');
        });

        it('filters data client-side', () => {
            render(<Table data={data} columns={sortColumns} />);

            // Open menu and search
            const menuButtons = screen.getAllByLabelText('Column Menu');
            fireEvent.click(menuButtons[1]); // Name column menu

            const searchInput = screen.getByPlaceholderText('Search Name...');
            fireEvent.change(searchInput, { target: { value: 'Ali' } });

            expect(screen.getByText('Alice')).toBeInTheDocument();
            expect(screen.queryByText('Bob')).not.toBeInTheDocument();
        });

        it('calls onSort in server mode', () => {
            const handleSort = vi.fn();
            render(<Table data={data} columns={sortColumns} settings={{ mode: "server" }} onSort={handleSort} />);

            // Open menu and sort
            const menuButtons = screen.getAllByLabelText('Column Menu');
            fireEvent.click(menuButtons[0]); // ID column menu

            const ascButton = screen.getByText('↑ Sort Ascending');
            fireEvent.click(ascButton);

            expect(handleSort).toHaveBeenCalledWith({ columnKey: 'id', direction: 'asc' });
        });

        it('toggles sort on header click', () => {
            const handleSort = vi.fn();
            const { rerender } = render(<Table data={data} columns={sortColumns} settings={{ mode: "server" }} onSort={handleSort} />);

            const idHeader = screen.getByText('ID');

            // First click -> asc
            fireEvent.click(idHeader);
            expect(handleSort).toHaveBeenCalledWith({ columnKey: 'id', direction: 'asc' });

            // Rerender with controlled state
            rerender(<Table data={data} columns={sortColumns} settings={{ mode: "server" }} onSort={handleSort} sortState={{ columnKey: 'id', direction: 'asc' }} />);

            // Second click -> desc
            fireEvent.click(screen.getByText('ID'));
            expect(handleSort).toHaveBeenCalledWith({ columnKey: 'id', direction: 'desc' });
        });
    });

    describe('Column Reordering', () => {
        it('supports programmatic column reordering', () => {
            const { rerender } = render(<Table data={data} columns={columns} />);

            // Initial order: ID then Name
            const headers = screen.getAllByRole('columnheader');
            expect(headers[0]).toHaveTextContent('ID');
            expect(headers[1]).toHaveTextContent('Name');

            // Swap order
            const reorderedColumns = [columns[1], columns[0]];
            rerender(<Table data={data} columns={reorderedColumns} />);

            const newHeaders = screen.getAllByRole('columnheader');
            expect(newHeaders[0]).toHaveTextContent('Name');
            expect(newHeaders[1]).toHaveTextContent('ID');

            // Check cells in first row
            const rows = screen.getAllByRole('row');
            // First row (index 1 because index 0 is header)
            expect(rows[1].children[0]).toHaveTextContent('Alice'); // Name first now
            expect(rows[1].children[1]).toHaveTextContent('1'); // ID second now
        });

        it('respects column draggable property', () => {
            const dragColumns: Column<User>[] = [
                { key: 'id', title: 'ID', draggable: true },
                { key: 'name', title: 'Name', draggable: false },
            ];
            render(<Table data={data} columns={dragColumns} settings={{ draggableColumns: true }} />);

            const idHeader = screen.getByText('ID').closest('th');
            const nameHeader = screen.getByText('Name').closest('th');

            expect(idHeader).toBeInTheDocument();
            expect(nameHeader).toBeInTheDocument();

            // Based on logic: draggableColumns && !isFixed && col.draggable !== false
            expect(idHeader).toHaveAttribute('draggable', 'true');
            expect(nameHeader).toHaveAttribute('draggable', 'false');
        });
    });

    describe('Frozen Rows', () => {
        it('renders frozen rows with sticky positioning', () => {
            const rowData = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `User ${i}` }));
            render(<Table data={rowData} columns={columns} settings={{ frozenRows: 2, virtualized: false }} />);

            const rows = screen.getAllByRole('row');
            // Index 0 is header. Rows 1 and 2 should be frozen.
            const row1 = rows[1];
            const row2 = rows[2];
            const row3 = rows[3];

            expect(row1).toHaveStyle({ position: 'sticky' });
            expect(row2).toHaveStyle({ position: 'sticky' });

            // Row 3 should not be sticky (unless we decide otherwise, but logic implies only first N)
            // Wait, RowComponent applies style passed. Row 3 is scrolledData, rendered normally.
            expect(row3).not.toHaveStyle({ position: 'sticky' });
        });
    });
});

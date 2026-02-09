import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Table } from './Table';
import type { Column, TableSettings } from '../types';

interface TestData {
    id: number;
    name: string;
    age: number;
}

const columns: Column<TestData>[] = [
    { key: 'id', title: 'ID', width: 50 },
    { key: 'name', title: 'Name', width: 200 },
    { key: 'age', title: 'Age', width: 100 },
];

const data: TestData[] = [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
];

describe('Table Context Menu', () => {
    it('does not show context menu by default', () => {
        const { container } = render(
            <Table
                data={data}
                columns={columns}
            />
        );

        // Right click on a row
        const row = container.querySelector('tbody tr');
        expect(row).toBeTruthy();
        if (row) {
            fireEvent.contextMenu(row);
        }

        expect(screen.queryByText('Hide Row')).toBeNull();
    });

    it('shows context menu when enabled in settings', () => {
        const settings: TableSettings = {
            contextMenu: {
                enabled: true,
                items: ['hideRow', 'hideColumn']
            }
        };

        const { container } = render(
            <Table
                data={data}
                columns={columns}
                settings={settings}
            />
        );

        const cell = container.querySelector('td'); // Click on a cell
        expect(cell).toBeTruthy();
        if (cell) {
            // context menu event bubbles from cell -> row -> table
            fireEvent.contextMenu(cell, { clientX: 100, clientY: 100 });
        }

        expect(screen.getByText('Hide Row')).toBeInTheDocument();
        expect(screen.getByText('Hide Column')).toBeInTheDocument();
    });

    it('triggers hideColumn action', () => {
        const onColumnUpdate = vi.fn();
        const settings: TableSettings = {
            contextMenu: {
                enabled: true,
                items: ['hideColumn']
            }
        };

        const { container } = render(
            <Table
                data={data}
                columns={columns}
                settings={settings}
                onColumnUpdate={onColumnUpdate}
            />
        );

        const cell = container.querySelector('td'); // Should be first cell (ID column)
        if (cell) {
            fireEvent.contextMenu(cell);
        }

        const hideOption = screen.getByText('Hide Column');
        fireEvent.click(hideOption);

        expect(onColumnUpdate).toHaveBeenCalled();
        // Check if the new columns list excludes the 'id' column
        const newCols = onColumnUpdate.mock.calls[0][0];
        expect(newCols).toHaveLength(2);
        expect(newCols.find((c: any) => c.key === 'id')).toBeUndefined();
    });

    it('executes custom actions', () => {
        const customAction = vi.fn();
        const settings: TableSettings = {
            contextMenu: {
                enabled: true,
                items: [
                    { label: 'My Action', onClick: customAction }
                ]
            }
        };

        const { container } = render(
            <Table
                data={data}
                columns={columns}
                settings={settings}
            />
        );

        const cell = container.querySelector('td');
        if (cell) {
            fireEvent.contextMenu(cell);
        }

        const customOption = screen.getByText('My Action');
        fireEvent.click(customOption);

        expect(customAction).toHaveBeenCalled();
        const args = customAction.mock.calls[0];
        expect(args[0]).toEqual(data[0]); // record
        expect(args[1]).toEqual(columns[0]); // column
    });

    it('triggers insert row action', () => {
        const onDataChange = vi.fn();
        const settings: TableSettings = {
            contextMenu: {
                enabled: true,
                items: ['insertRowBelow']
            }
        };

        const { container } = render(
            <Table
                data={data}
                columns={columns}
                settings={settings}
                onDataChange={onDataChange}
                rowSettings={{ key: 'id' }}
            />
        );

        const cells = container.querySelectorAll('td');
        const firstCell = cells[0]; // ID 1
        fireEvent.contextMenu(firstCell);

        fireEvent.click(screen.getByText('Insert Row Below'));

        expect(onDataChange).toHaveBeenCalled();
        const newData = onDataChange.mock.calls[0][0];
        expect(newData).toHaveLength(3);
        // We verify that a new item was inserted logic was simplistic (clone)
        // so we expect length 3.
    });

    it('triggers shortcut for custom action', () => {
        const customAction = vi.fn();
        const settings: TableSettings = {
            contextMenu: {
                enabled: true,
                items: [
                    { label: 'Save', onClick: customAction, shortcut: 'Mod+S' }
                ]
            }
        };

        const { container } = render(
            <Table
                data={data}
                columns={columns}
                settings={settings}
            />
        );

        const cell = container.querySelector('td');
        if (cell) {
            fireEvent.focus(cell);
            // Simulate Mod+S (Cmd+S on mac, Ctrl+S on others)
            // The match logic in Table.tsx uses /Mac/ test on navigator.platform
            // In JSDOM, we might need to mock this if we want to be sure, but let's try a simple one.
            fireEvent.keyDown(window, { key: 's', ctrlKey: true, metaKey: false });
        }

        expect(customAction).toHaveBeenCalled();
    });

    it('shows sub-menu items on hover', async () => {
        const settings: TableSettings = {
            contextMenu: {
                enabled: true,
                items: [
                    {
                        label: 'Group',
                        children: [
                            { label: 'Sub Item', onClick: vi.fn() }
                        ]
                    }
                ]
            }
        };

        const { container } = render(
            <Table
                data={data}
                columns={columns}
                settings={settings}
            />
        );

        const cell = container.querySelector('td');
        if (cell) {
            fireEvent.contextMenu(cell);
        }

        const groupOption = screen.getByText('Group');
        fireEvent.mouseEnter(groupOption);

        expect(screen.getByText('Sub Item')).toBeInTheDocument();
    });

    it('allows renaming column header via double-click', async () => {
        const onColumnUpdate = vi.fn();
        render(<Table data={data} columns={columns} settings={{ contextMenu: { enabled: true } }} onColumnUpdate={onColumnUpdate} />);

        const header = screen.getByText('Name');
        fireEvent.doubleClick(header);

        const input = screen.getByDisplayValue('Name');
        fireEvent.change(input, { target: { value: 'Full Name' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onColumnUpdate).toHaveBeenCalled();
        const call = onColumnUpdate.mock.calls[0][0];
        expect(call.find((c: any) => c.key === 'name').title).toBe('Full Name');
    });

    it('triggers header rename from context menu', async () => {
        render(<Table data={data} columns={columns} settings={{ contextMenu: { enabled: true, items: ['renameColumn'] } }} />);

        const cell = screen.getByText('Alice');
        fireEvent.contextMenu(cell);

        const renameOption = screen.getByText('Rename Column');
        fireEvent.click(renameOption);

        // Should now show input in header
        expect(screen.getByDisplayValue('Name')).toBeInTheDocument();
    });
});

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
        render(<Table data={data} columns={columns} onRowClick={handleClick} />);

        fireEvent.click(screen.getByText('Alice'));

        expect(handleClick).toHaveBeenCalledTimes(1);
        expect(handleClick).toHaveBeenCalledWith(data[0]);
    });
});

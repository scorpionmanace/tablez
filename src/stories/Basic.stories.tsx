import type { Meta, StoryObj } from '@storybook/react';
import { Table } from '../lib';
import type { Column } from '../lib';

interface Person {
  id: number;
  name: string;
  age: number;
  role: string;
  salary: number;
  active: boolean;
}

const columns: Column<Person>[] = [
  { key: 'id', title: 'ID', width: 60, sortable: true },
  { key: 'name', title: 'Name', sortable: true, filterable: true },
  { key: 'age', title: 'Age', width: 80, type: 'number', sortable: true },
  {
    key: 'role',
    title: 'Role',
    sortable: true,
    filterable: true,
    type: 'select',
    options: ['Engineer', 'Designer', 'Manager', 'Analyst'],
  },
  {
    key: 'salary',
    title: 'Salary',
    type: 'number',
    format: { prefix: '$', decimals: 0 },
    sortable: true,
  },
  { key: 'active', title: 'Active', type: 'boolean', width: 80 },
];

const data: Person[] = [
  { id: 1, name: 'Alice Johnson', age: 32, role: 'Engineer', salary: 95000, active: true },
  { id: 2, name: 'Bob Smith', age: 28, role: 'Designer', salary: 82000, active: true },
  { id: 3, name: 'Carol White', age: 41, role: 'Manager', salary: 110000, active: false },
  { id: 4, name: 'David Brown', age: 25, role: 'Analyst', salary: 70000, active: true },
  { id: 5, name: 'Eve Martinez', age: 36, role: 'Engineer', salary: 98000, active: true },
  { id: 6, name: 'Frank Lee', age: 30, role: 'Designer', salary: 85000, active: false },
  { id: 7, name: 'Grace Kim', age: 44, role: 'Manager', salary: 120000, active: true },
  { id: 8, name: 'Henry Davis', age: 27, role: 'Analyst', salary: 72000, active: true },
];

const meta: Meta<typeof Table> = {
  title: 'Table/Basic',
  component: Table,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  args: {
    data,
    columns,
    settings: {
      showColumnBorders: true,
      showRowNumbers: true,
      toolbar: {
        enabled: true,
        items: ['search', 'separator', 'download'],
      },
    },
  },
};

export const WithSelection: Story = {
  args: {
    data,
    columns,
    settings: {
      showRowNumbers: true,
      selection: { mode: 'multi', showCheckbox: true },
      toolbar: { enabled: true, items: ['search'] },
    },
  },
};

export const WithPagination: Story = {
  args: {
    data,
    columns,
    settings: {
      showRowNumbers: true,
      pagination: { enabled: true, pageSize: 3, pageSizeOptions: [3, 5, 8] },
    },
  },
};

export const Editable: Story = {
  args: {
    data,
    columns: columns.map((c) => ({ ...c, editable: true })),
    settings: { showColumnBorders: true },
  },
};

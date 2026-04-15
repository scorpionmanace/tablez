import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Table } from '../lib';
import type { Column, CellComment } from '../lib';

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  active: boolean;
  joinDate: string;
  score: number;
  sparkData: number[];
  children?: Employee[];
}

const columns: Column<Employee>[] = [
  {
    key: 'id',
    title: '#',
    width: 55,
    fixed: 'left',
    sortable: true,
    tooltip: (_, r) => `Row ID: ${r.id}`,
  },
  {
    key: 'name',
    title: 'Name',
    fixed: 'left',
    width: 160,
    sortable: true,
    filterable: true,
    editable: true,
  },
  {
    key: 'department',
    title: 'Department',
    sortable: true,
    filterable: true,
    type: 'select',
    options: ['Engineering', 'Design', 'Product', 'Sales', 'HR'],
    editable: true,
  },
  {
    key: 'role',
    title: 'Role',
    sortable: true,
    filterable: true,
    editable: true,
    tooltip: (v) => `Role: ${v}`,
  },
  {
    key: 'salary',
    title: 'Salary',
    type: 'number',
    format: { prefix: '$', decimals: 0 },
    sortable: true,
    editable: true,
    aggregate: 'sum',
  },
  {
    key: 'active',
    title: 'Active',
    type: 'boolean',
    width: 75,
    editable: true,
  },
  {
    key: 'joinDate',
    title: 'Joined',
    type: 'date',
    width: 110,
    sortable: true,
  },
  {
    key: 'score',
    title: 'Score',
    type: 'number',
    width: 85,
    sortable: true,
    highlight: true,
    format: { decimals: 1 },
  },
  {
    key: 'sparkData',
    title: 'Trend',
    width: 120,
    sparkline: { type: 'area', height: 30 },
  },
];

function makeData(n: number): Employee[] {
  const depts = ['Engineering', 'Design', 'Product', 'Sales', 'HR'];
  const roles = ['Senior', 'Junior', 'Lead', 'Manager', 'Intern'];
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: depts[i % depts.length],
    role: roles[i % roles.length],
    salary: 60000 + (i % 10) * 5000,
    active: i % 3 !== 0,
    joinDate: `2020-0${(i % 9) + 1}-15`,
    score: +(60 + Math.random() * 40).toFixed(1),
    sparkData: Array.from({ length: 8 }, () => Math.round(Math.random() * 100)),
  }));
}

const data = makeData(50);

const columnGroups = [
  { title: 'Identity', columnKeys: ['id', 'name'] },
  { title: 'Work', columnKeys: ['department', 'role', 'salary'] },
  { title: 'Metrics', columnKeys: ['score', 'sparkData'] },
];

function AllFeaturesDemo() {
  const [comments, setComments] = useState<CellComment[]>([]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Table
        data={data}
        columns={columns}
        rowSettings={{ key: 'id' }}
        settings={{
          showColumnBorders: true,
          showRowNumbers: true,
          resizable: true,
          animateRows: true,
          enableComments: true,
          enableRangeSelection: true,
          enableFillHandle: true,
          columnGroups,
          groupBy: [],
          selection: { mode: 'multi', showCheckbox: true },
          pagination: { enabled: true, pageSize: 10, pageSizeOptions: [10, 25, 50] },
          toolbar: {
            enabled: true,
            items: ['search', 'separator', 'comment', 'separator', 'columns', 'download', 'import'],
          },
          sidePanel: { enabled: true },
          statusBar: {
            showRowCount: true,
            showSelectedCount: true,
            showSum: true,
            showAvg: true,
          },
          contextMenu: {
            enabled: true,
            items: [
              'copy',
              'cut',
              'paste',
              'separator' as any,
              'insertRowBelow',
              'insertRowAbove',
              'separator' as any,
              'undo',
              'redo',
            ],
          },
        }}
        comments={comments}
        onCommentAdd={(c) => setComments((prev) => [...prev, c])}
        onCommentDelete={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
        onCommentResolve={(id) =>
          setComments((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: true } : c)))
        }
      />
    </div>
  );
}

const meta: Meta = {
  title: 'Table/All Features',
  parameters: { layout: 'fullscreen' },
};

export default meta;

export const Default: StoryObj = {
  render: () => <AllFeaturesDemo />,
};

export const TreeData: StoryObj = {
  render: () => {
    const treeData: Employee[] = [
      {
        id: 1,
        name: 'Engineering',
        department: 'Engineering',
        role: 'Department',
        salary: 0,
        active: true,
        joinDate: '',
        score: 0,
        sparkData: [],
        children: [
          {
            id: 11,
            name: 'Alice',
            department: 'Engineering',
            role: 'Senior',
            salary: 95000,
            active: true,
            joinDate: '2021-03-10',
            score: 92.5,
            sparkData: [30, 45, 60, 55, 70, 85, 90, 88],
          },
          {
            id: 12,
            name: 'Bob',
            department: 'Engineering',
            role: 'Junior',
            salary: 72000,
            active: true,
            joinDate: '2023-01-15',
            score: 75.0,
            sparkData: [20, 30, 40, 50, 55, 60, 65, 70],
          },
        ],
      },
      {
        id: 2,
        name: 'Design',
        department: 'Design',
        role: 'Department',
        salary: 0,
        active: true,
        joinDate: '',
        score: 0,
        sparkData: [],
        children: [
          {
            id: 21,
            name: 'Carol',
            department: 'Design',
            role: 'Lead',
            salary: 88000,
            active: true,
            joinDate: '2020-06-01',
            score: 88.2,
            sparkData: [50, 60, 55, 70, 75, 80, 82, 88],
          },
        ],
      },
    ];

    return (
      <Table
        data={treeData}
        columns={columns}
        rowSettings={{ key: 'id' }}
        settings={{
          showColumnBorders: true,
          showRowNumbers: true,
          treeSettings: { enabled: true, childrenKey: 'children', defaultExpanded: true },
        }}
      />
    );
  },
};

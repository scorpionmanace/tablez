import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Table } from '../lib';
import type { Column, CellComment } from '../lib';

interface Task {
  id: number;
  title: string;
  status: string;
  assignee: string;
  priority: string;
  dueDate: string;
}

const columns: Column<Task>[] = [
  { key: 'id', title: '#', width: 50 },
  { key: 'title', title: 'Task', filterable: true },
  {
    key: 'status',
    title: 'Status',
    type: 'select',
    options: ['Todo', 'In Progress', 'Done', 'Blocked'],
    width: 120,
  },
  { key: 'assignee', title: 'Assignee', width: 130, filterable: true },
  {
    key: 'priority',
    title: 'Priority',
    type: 'select',
    options: ['Low', 'Medium', 'High', 'Critical'],
    width: 110,
  },
  { key: 'dueDate', title: 'Due Date', type: 'date', width: 120 },
];

const data: Task[] = [
  {
    id: 1,
    title: 'Design system audit',
    status: 'In Progress',
    assignee: 'Alice',
    priority: 'High',
    dueDate: '2026-04-20',
  },
  {
    id: 2,
    title: 'Fix login bug',
    status: 'Todo',
    assignee: 'Bob',
    priority: 'Critical',
    dueDate: '2026-04-15',
  },
  {
    id: 3,
    title: 'Write release notes',
    status: 'Done',
    assignee: 'Carol',
    priority: 'Low',
    dueDate: '2026-04-10',
  },
  {
    id: 4,
    title: 'Performance profiling',
    status: 'Blocked',
    assignee: 'David',
    priority: 'Medium',
    dueDate: '2026-04-25',
  },
  {
    id: 5,
    title: 'Mobile responsive layout',
    status: 'In Progress',
    assignee: 'Eve',
    priority: 'High',
    dueDate: '2026-04-28',
  },
];

const initialComments: CellComment[] = [
  {
    id: 'c1',
    rowKey: 1,
    columnKey: 'status',
    text: 'Blocked on design review — waiting for UX sign-off.',
    author: 'Alice',
    timestamp: Date.now() - 3_600_000,
  },
  {
    id: 'c2',
    rowKey: 2,
    columnKey: 'priority',
    text: 'Escalated by support team. Ship ASAP.',
    author: 'Bob',
    timestamp: Date.now() - 7_200_000,
  },
];

function ControlledDemo() {
  const [comments, setComments] = useState<CellComment[]>(initialComments);

  return (
    <Table
      data={data}
      columns={columns}
      rowSettings={{ key: 'id' }}
      settings={{
        enableComments: true,
        showColumnBorders: true,
        showRowNumbers: true,
        toolbar: {
          enabled: true,
          items: ['search', 'separator', 'comment'],
        },
      }}
      comments={comments}
      onCommentAdd={(c) => setComments((prev) => [...prev, c])}
      onCommentDelete={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
      onCommentResolve={(id) =>
        setComments((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: true } : c)))
      }
    />
  );
}

const meta: Meta = {
  title: 'Table/Comments',
  parameters: { layout: 'fullscreen' },
};

export default meta;

export const Controlled: StoryObj = {
  render: () => <ControlledDemo />,
};

export const Uncontrolled: StoryObj = {
  render: () => (
    <Table
      data={data}
      columns={columns}
      rowSettings={{ key: 'id' }}
      settings={{
        enableComments: true,
        showRowNumbers: true,
        toolbar: {
          enabled: true,
          items: ['search', 'separator', 'comment'],
        },
      }}
    />
  ),
};

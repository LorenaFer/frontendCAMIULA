import type { Snippet } from 'svelte';

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: Snippet<[value: unknown, row: T, index: number]>;
}

export interface RowAction<T> {
  icon: Snippet;
  label: string;
  onclick: (row: T, index: number) => void;
  variant?: 'default' | 'danger';
  /** Show only on hover */
  hoverOnly?: boolean;
}

export interface BulkAction<T> {
  icon: Snippet;
  label: string;
  onclick: (selectedRows: T[]) => void;
  variant?: 'default' | 'danger' | 'primary';
}

export interface EditableColumn<T> {
  key: keyof T;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: Snippet<[value: T[keyof T], row: T, index: number, onChange: (key: keyof T, value: T[keyof T]) => void]>;
}

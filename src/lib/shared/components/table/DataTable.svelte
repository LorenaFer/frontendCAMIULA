<script lang="ts" generics="T extends Record<string, unknown>">
  import type { DataTableColumn, RowAction, BulkAction } from './types';

  let {
    columns,
    data,
    actions,
    bulkActions,
    rowKey,
    selectable = false,
    selectedKeys = [],
    onSelectionChange,
    onRowClick,
    sortConfig = null,
    onSortChange,
    loading = false,
    emptyMessage = 'No data available',
    class: className = '',
    bordered = false
  }: {
    columns: DataTableColumn<T>[];
    data: T[];
    /** Row actions (edit, delete, etc.) */
    actions?: RowAction<T>[];
    /** Bulk actions when rows are selected */
    bulkActions?: BulkAction<T>[];
    /** Key to use for row identity */
    rowKey: keyof T;
    /** Enable row selection */
    selectable?: boolean;
    /** Selected row keys */
    selectedKeys?: (string | number)[];
    /** Called when selection changes */
    onSelectionChange?: (keys: (string | number)[]) => void;
    /** Called when row is clicked */
    onRowClick?: (row: T, index: number) => void;
    /** Sort configuration */
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
    /** Called when sort changes */
    onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
    /** Loading state */
    loading?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    class?: string;
    bordered?: boolean;
  } = $props();

  function handleSelectAll() {
    if (!onSelectionChange) return;
    if (selectedKeys.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((row) => row[rowKey] as string | number));
    }
  }

  function handleSelectRow(key: string | number) {
    if (!onSelectionChange) return;
    if (selectedKeys.includes(key)) {
      onSelectionChange(selectedKeys.filter((k) => k !== key));
    } else {
      onSelectionChange([...selectedKeys, key]);
    }
  }

  function handleSort(key: string) {
    if (!onSortChange) return;
    if (sortConfig?.key === key) {
      onSortChange(key, sortConfig.direction === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(key, 'asc');
    }
  }

  function getSelectedRows(): T[] {
    return data.filter((row) => selectedKeys.includes(row[rowKey] as string | number));
  }

  function getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((o: unknown, key) => (o as Record<string, unknown>)?.[key], obj);
  }

  let isAllSelected = $derived(data.length > 0 && selectedKeys.length === data.length);
  let isPartialSelected = $derived(selectedKeys.length > 0 && selectedKeys.length < data.length);
  let hasSelection = $derived(selectedKeys.length > 0);
  let totalColSpan = $derived(columns.length + (selectable ? 1 : 0) + (actions && actions.length > 0 ? 1 : 0));

  let selectAllCheckboxEl: HTMLInputElement;

  $effect(() => {
    if (selectAllCheckboxEl) {
      selectAllCheckboxEl.indeterminate = isPartialSelected;
    }
  });

  const bulkActionStyles: Record<string, string> = {
    default: 'text-ink-muted hover:text-ink hover:bg-canvas-subtle',
    danger: 'text-red-600 hover:text-red-700 hover:bg-red-50',
    primary: 'text-viking-600 hover:text-viking-700 hover:bg-viking-50'
  };

  const alignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
</script>

<div class="{bordered ? 'border border-border rounded-lg' : ''} {className}">
  <!-- Bulk Actions Toolbar -->
  {#if hasSelection && bulkActions && bulkActions.length > 0}
    <div class="flex items-center justify-between px-3 py-2 bg-viking-50/50 border-b border-viking-100">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-viking-700">
          {selectedKeys.length} selected
        </span>
        <button
          type="button"
          onclick={() => onSelectionChange?.([])}
          class="text-xs text-viking-600 hover:text-viking-800 hover:underline"
        >
          Clear selection
        </button>
      </div>
      <div class="flex items-center gap-1">
        {#each bulkActions as action, index (index)}
          <button
            type="button"
            onclick={() => action.onclick(getSelectedRows())}
            class="
              inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors
              {bulkActionStyles[action.variant || 'default']}
            "
          >
            {@render action.icon()}
            {action.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead class="border-b border-border/60 sticky top-0 z-10 glass-subtle">
        <tr>
          {#if selectable}
            <th class="px-3 py-2 w-8">
              <input
                type="checkbox"
                checked={isAllSelected}
                bind:this={selectAllCheckboxEl}
                onchange={handleSelectAll}
                class="w-3.5 h-3.5 rounded border-border-strong text-ink focus:ring-border focus:ring-offset-0 cursor-pointer"
              />
            </th>
          {/if}
          {#each columns as col (String(col.key))}
            <th
              style:width={col.width}
              onclick={col.sortable ? () => handleSort(String(col.key)) : undefined}
              class="
                px-3 py-2 text-[11px] font-medium text-ink-muted uppercase tracking-wider
                {alignClasses[col.align || 'left']}
                {col.sortable ? 'cursor-pointer hover:text-ink select-none' : ''}
              "
            >
              <div class="inline-flex items-center gap-1.5 {col.align === 'right' ? 'flex-row-reverse' : ''}">
                {col.header}
                {#if col.sortable}
                  <span class="w-3 h-3 flex items-center justify-center">
                    {#if sortConfig?.key === String(col.key)}
                      {#if sortConfig.direction === 'asc'}
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      {:else}
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      {/if}
                    {:else}
                      <svg class="w-3 h-3 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                      </svg>
                    {/if}
                  </span>
                {/if}
              </div>
            </th>
          {/each}
          {#if actions && actions.length > 0}
            <th class="px-3 py-2 text-[11px] font-medium text-ink-muted uppercase tracking-wider text-right w-auto">
              Actions
            </th>
          {/if}
        </tr>
      </thead>
      <tbody class="divide-y divide-border-subtle/50 bg-surface-elevated">
        {#if loading}
          <tr>
            <td colspan={totalColSpan} class="px-4 py-12">
              <div class="flex flex-col items-center justify-center">
                <svg class="w-6 h-6 text-ink-subtle animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p class="text-sm text-ink-muted mt-2">Loading...</p>
              </div>
            </td>
          </tr>
        {:else if data.length === 0}
          <tr>
            <td colspan={totalColSpan} class="px-4 py-12">
              <div class="flex flex-col items-center justify-center text-center">
                <svg class="w-10 h-10 text-ink-subtle mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p class="text-sm font-medium text-ink">{emptyMessage}</p>
              </div>
            </td>
          </tr>
        {:else}
          {#each data as row, index (row[rowKey] as string | number)}
            {@const key = row[rowKey] as string | number}
            {@const isSelected = selectedKeys.includes(key)}
            <tr
              onclick={onRowClick ? () => onRowClick(row, index) : undefined}
              class="
                group transition-colors duration-100
                {onRowClick ? 'cursor-pointer hover:bg-canvas-subtle/80 hover:shadow-[inset_3px_0_0_var(--color-viking-400)]' : ''}
                {isSelected ? 'bg-viking-50' : ''}
              "
            >
              {#if selectable}
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <td class="px-3 py-2 w-8" onclick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onchange={() => handleSelectRow(key)}
                    class="w-3.5 h-3.5 rounded border-border-strong text-ink focus:ring-border focus:ring-offset-0 cursor-pointer"
                  />
                </td>
              {/if}
              {#each columns as col (String(col.key))}
                {@const value = typeof col.key === 'string' && col.key.includes('.')
                  ? getNestedValue(row, col.key)
                  : row[col.key as keyof T]}
                <td class="px-3 py-2 text-sm text-ink {alignClasses[col.align || 'left']}">
                  {#if col.render}
                    {@render col.render(value, row, index)}
                  {:else}
                    {String(value ?? '')}
                  {/if}
                </td>
              {/each}
              {#if actions && actions.length > 0}
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <td class="px-3 py-2 text-right" onclick={(e) => e.stopPropagation()}>
                  <div class="inline-flex items-center gap-1">
                    {#each actions as action, actionIndex (actionIndex)}
                      <button
                        type="button"
                        onclick={() => action.onclick(row, index)}
                        title={action.label}
                        class="
                          p-1.5 rounded transition-all
                          {action.hoverOnly ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-150' : ''}
                          {action.variant === 'danger'
                            ? 'text-ink-subtle hover:text-red-600 hover:bg-red-50'
                            : 'text-ink-subtle hover:text-ink hover:bg-canvas-subtle'}
                        "
                      >
                        {@render action.icon()}
                      </button>
                    {/each}
                  </div>
                </td>
              {/if}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

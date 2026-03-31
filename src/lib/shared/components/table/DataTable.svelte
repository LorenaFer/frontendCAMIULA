<script lang="ts" generics="T extends Record<string, unknown>">
  import type { DataTableColumn, RowAction, BulkAction, RowMenuItem } from './types';

  let {
    columns,
    data,
    actions,
    rowMenu,
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
    /** Row context menu items (View, Edit, Delete popover) */
    rowMenu?: RowMenuItem<T>[];
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

  function handleMenuAction(detailsEl: HTMLDetailsElement, item: RowMenuItem<T>, row: T, index: number) {
    detailsEl.open = false;
    item.onclick(row, index);
  }

  // Cerrar cualquier <details> del menú al hacer clic fuera
  $effect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.row-menu-details')) {
        document.querySelectorAll('.row-menu-details[open]').forEach((el) => {
          (el as HTMLDetailsElement).open = false;
        });
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

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
  let hasRowMenu = $derived(rowMenu && rowMenu.length > 0);
  let totalColSpan = $derived(columns.length + (selectable ? 1 : 0) + (actions && actions.length > 0 ? 1 : 0) + (hasRowMenu ? 1 : 0));

  let selectAllCheckboxEl: HTMLInputElement;

  $effect(() => {
    if (selectAllCheckboxEl) {
      selectAllCheckboxEl.indeterminate = isPartialSelected;
    }
  });

  const bulkActionStyles: Record<string, string> = {
    default: 'text-ink-muted hover:text-ink hover:bg-canvas-subtle',
    danger: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30',
    primary: 'text-viking-600 dark:text-viking-400 hover:text-viking-700 dark:hover:text-viking-300 hover:bg-viking-50 dark:hover:bg-viking-950/30'
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
    <div class="flex items-center justify-between px-3 py-2 bg-viking-50 dark:bg-viking-950/30 border-b border-viking-200 dark:border-viking-800">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-viking-700 dark:text-viking-300">
          {selectedKeys.length} selected
        </span>
        <button
          type="button"
          onclick={() => onSelectionChange?.([])}
          class="text-xs text-viking-600 dark:text-viking-400 hover:text-viking-800 dark:hover:text-viking-200 hover:underline"
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

  <div class="overflow-x-auto" style={hasRowMenu ? 'overflow: visible;' : ''}>
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
          {#if hasRowMenu}
            <th class="px-2 py-2 w-12"></th>
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
                {isSelected ? 'bg-viking-50 dark:bg-viking-950/30' : ''}
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
                            ? 'text-ink-subtle hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                            : 'text-ink-subtle hover:text-ink hover:bg-canvas-subtle'}
                        "
                      >
                        {@render action.icon()}
                      </button>
                    {/each}
                  </div>
                </td>
              {/if}
              {#if hasRowMenu && rowMenu}
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <td class="px-2 py-2 w-12 text-right" onclick={(e) => e.stopPropagation()}>
                  <details class="relative inline-block row-menu-details">
                    <summary class="p-2 rounded-lg text-ink-subtle hover:text-ink hover:bg-canvas-subtle transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                      </svg>
                    </summary>
                    <div class="absolute right-0 top-full mt-1 z-50 w-[184px] bg-surface-elevated border border-border rounded-xl shadow-[var(--shadow-3)] py-1">
                      {#each rowMenu as menuItem, mi (mi)}
                        <button
                          type="button"
                          onclick={(e) => {
                            const details = (e.currentTarget as HTMLElement).closest('details') as HTMLDetailsElement;
                            handleMenuAction(details, menuItem, row, index);
                          }}
                          class="
                            w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left
                            {menuItem.variant === 'danger'
                              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                              : 'text-ink hover:bg-canvas-subtle'}
                          "
                        >
                          {#if menuItem.icon === 'view'}
                            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                          {:else if menuItem.icon === 'edit'}
                            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                          {:else if menuItem.icon === 'delete'}
                            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                          {/if}
                          {menuItem.label}
                        </button>
                      {/each}
                    </div>
                  </details>
                </td>
              {/if}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>


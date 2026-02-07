<script lang="ts" generics="T extends Record<string, unknown>">
  import type { EditableColumn } from './types';

  let {
    columns,
    data,
    onchange,
    createRow,
    maxRows,
    minRows = 0,
    addLabel = 'Add row',
    showRowNumbers = false,
    disabled = false,
    class: className = ''
  }: {
    columns: EditableColumn<T>[];
    data: T[];
    onchange: (data: T[]) => void;
    /** Function to create a new empty row */
    createRow: () => T;
    /** Maximum number of rows allowed */
    maxRows?: number;
    /** Minimum number of rows (prevents deletion below this) */
    minRows?: number;
    /** Add button label */
    addLabel?: string;
    /** Show row numbers */
    showRowNumbers?: boolean;
    /** Disable all editing */
    disabled?: boolean;
    class?: string;
  } = $props();

  function handleAddRow() {
    if (maxRows && data.length >= maxRows) return;
    onchange([...data, createRow()]);
  }

  function handleRemoveRow(index: number) {
    if (data.length <= minRows) return;
    const newData = [...data];
    newData.splice(index, 1);
    onchange(newData);
  }

  function handleCellChange(index: number, key: keyof T, value: T[keyof T]) {
    const newData = [...data];
    newData[index] = { ...newData[index], [key]: value };
    onchange(newData);
  }

  let canAddRow = $derived(!maxRows || data.length < maxRows);
  let canRemoveRow = $derived(data.length > minRows);

  const alignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
</script>

<div class="w-full {className}">
  <div class="overflow-x-auto border border-slate-200 rounded-lg">
    <table class="w-full border-collapse">
      <thead class="bg-slate-50 border-b border-slate-200">
        <tr>
          {#if showRowNumbers}
            <th class="px-3 py-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider text-center w-12">
              #
            </th>
          {/if}
          {#each columns as col (String(col.key))}
            <th
              style:width={col.width}
              class="px-3 py-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider {alignClasses[col.align || 'left']}"
            >
              {col.header}
            </th>
          {/each}
          <th class="px-3 py-2 w-10"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 bg-white">
        {#if data.length === 0}
          <tr>
            <td
              colspan={columns.length + (showRowNumbers ? 2 : 1)}
              class="px-4 py-8 text-center text-sm text-slate-500"
            >
              No items yet. Click "{addLabel}" to add one.
            </td>
          </tr>
        {:else}
          {#each data as row, index (index)}
            <tr class="group hover:bg-slate-50">
              {#if showRowNumbers}
                <td class="px-3 py-2 text-xs text-slate-400 text-center tabular-nums">
                  {index + 1}
                </td>
              {/if}
              {#each columns as col (String(col.key))}
                <td class="px-3 py-1.5 {alignClasses[col.align || 'left']}">
                  {@render col.render(
                    row[col.key],
                    row,
                    index,
                    (key, value) => handleCellChange(index, key, value)
                  )}
                </td>
              {/each}
              <td class="px-2 py-1.5">
                <button
                  type="button"
                  onclick={() => handleRemoveRow(index)}
                  disabled={disabled || !canRemoveRow}
                  class="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
                  aria-label="Remove row"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
  <button
    type="button"
    onclick={handleAddRow}
    disabled={disabled || !canAddRow}
    class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
    {addLabel}
  </button>
</div>

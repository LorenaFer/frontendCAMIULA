<script lang="ts">
  let {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    pageSizeOptions = [10, 50, 100],
    class: className = '',
    simple = false
  }: {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange: (page: number) => void;
    /** Called when items per page changes */
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    /** Options for items per page selector */
    pageSizeOptions?: number[];
    class?: string;
    /** Show simple "< >" navigation only */
    simple?: boolean;
  } = $props();

  let showItemCount = $derived(totalItems !== undefined && itemsPerPage !== undefined);
  let startItem = $derived(showItemCount ? (currentPage - 1) * itemsPerPage! + 1 : 0);
  let endItem = $derived(showItemCount ? Math.min(currentPage * itemsPerPage!, totalItems!) : 0);

  let pages = $derived.by(() => {
    const result: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        result.push(i);
      } else if (result[result.length - 1] !== '...') {
        result.push('...');
      }
    }
    return result;
  });
</script>

{#if simple}
  <div class="flex items-center justify-between px-3 py-2 border-t border-slate-100/50 {className}">
    <span class="text-xs text-slate-500 font-mono">
      {totalItems} {totalItems === 1 ? 'item' : 'items'}
    </span>
    <div class="flex items-center gap-0.5">
      <button
        onclick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100/70 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        onclick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100/70 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  </div>
{:else}
  <div class="flex items-center justify-between px-3 py-2 border-t border-slate-100/50 {className}">
    <div class="flex items-center gap-4">
      {#if showItemCount}
        <span class="text-xs text-slate-500">
          <span class="text-slate-700 font-medium font-mono">{startItem}&ndash;{endItem}</span> of {totalItems}
        </span>
      {:else}
        <span class="text-xs text-slate-500 font-mono">
          {currentPage}/{totalPages}
        </span>
      {/if}
      {#if onItemsPerPageChange}
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">Show</span>
          <select
            value={itemsPerPage}
            onchange={(e) => onItemsPerPageChange(Number(e.currentTarget.value))}
            class="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-viking-500/30 focus:border-viking-500 cursor-pointer"
          >
            {#each pageSizeOptions as size}
              <option value={size}>{size}</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
    <div class="flex items-center gap-0.5">
      <button
        onclick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100/70 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      {#each pages as page, index (typeof page === 'number' ? page : `ellipsis-${index}`)}
        {#if page === '...'}
          <span class="px-1 text-slate-400 text-xs">&middot;&middot;&middot;</span>
        {:else}
          <button
            onclick={() => onPageChange(page as number)}
            class="
              min-w-[24px] h-6 px-1.5 text-xs font-medium rounded transition-colors font-mono
              {currentPage === page
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100/70'}
            "
          >
            {page}
          </button>
        {/if}
      {/each}
      <button
        onclick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100/70 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  </div>
{/if}

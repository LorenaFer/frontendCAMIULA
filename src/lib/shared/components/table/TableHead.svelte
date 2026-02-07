<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    children,
    class: className = '',
    sortable = false,
    sortDirection = null,
    onsort,
    align = 'left'
  }: {
    children: Snippet;
    class?: string;
    sortable?: boolean;
    sortDirection?: 'asc' | 'desc' | null;
    onsort?: () => void;
    align?: 'left' | 'center' | 'right';
  } = $props();

  const alignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
</script>

<th
  onclick={sortable ? onsort : undefined}
  class="
    px-3 py-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider
    {alignClasses[align]}
    {sortable ? 'cursor-pointer hover:text-slate-700 select-none' : ''}
    {className}
  "
>
  <div class="inline-flex items-center gap-1.5 {align === 'right' ? 'flex-row-reverse' : ''}">
    {@render children()}
    {#if sortable}
      <span class="w-3 h-3 flex items-center justify-center">
        {#if sortDirection === 'asc'}
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        {:else if sortDirection === 'desc'}
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        {:else}
          <svg class="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
          </svg>
        {/if}
      </span>
    {/if}
  </div>
</th>

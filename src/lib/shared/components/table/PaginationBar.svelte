<script lang="ts">
	let {
		page,
		total,
		pageSize = 25,
		pageSizeOptions = [10, 25, 50],
		onPageChange,
		onPageSizeChange,
		class: className = ''
	}: {
		page: number;
		total: number;
		pageSize?: number;
		pageSizeOptions?: number[];
		onPageChange: (page: number) => void;
		onPageSizeChange?: (size: number) => void;
		class?: string;
	} = $props();

	let pages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	let startItem = $derived((page - 1) * pageSize + 1);
	let endItem = $derived(Math.min(page * pageSize, total));

	let visiblePages = $derived.by(() => {
		const result: number[] = [];
		const maxVisible = 7;
		const start = Math.max(1, Math.min(page - Math.floor(maxVisible / 2), pages - maxVisible + 1));
		for (let i = start; i <= Math.min(start + maxVisible - 1, pages); i++) {
			result.push(i);
		}
		return result;
	});
</script>

{#if total > 0}
	<div class="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 border-t border-border/30 bg-canvas-subtle/30 {className}">
		<div class="flex items-center gap-3">
			<p class="text-xs text-ink-muted">
				{startItem}–{endItem} de {total}
			</p>
			{#if onPageSizeChange}
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-ink-subtle">Mostrar</span>
					<select
						class="text-xs border border-border/60 rounded-md px-1.5 py-1 bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-viking-500/40"
						value={pageSize}
						onchange={(e) => onPageSizeChange?.(Number((e.target as HTMLSelectElement).value))}
					>
						{#each pageSizeOptions as size}
							<option value={size}>{size}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		{#if pages > 1}
			<div class="flex items-center gap-1">
				<button
					type="button"
					disabled={page <= 1}
					class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle"
					onclick={() => onPageChange(page - 1)}
					aria-label="Página anterior"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
					</svg>
				</button>
				{#each visiblePages as p}
					<button
						type="button"
						class="w-7 h-7 rounded-md text-xs font-medium transition-colors
							{p === page ? 'bg-viking-600 text-white' : 'text-ink-muted hover:bg-canvas-subtle'}"
						onclick={() => onPageChange(p)}
					>
						{p}
					</button>
				{/each}
				<button
					type="button"
					disabled={page >= pages}
					class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle"
					onclick={() => onPageChange(page + 1)}
					aria-label="Página siguiente"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
					</svg>
				</button>
			</div>
		{/if}
	</div>
{/if}

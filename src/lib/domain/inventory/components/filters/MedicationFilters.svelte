<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { MedicationCategory, MedicationFilters as MedicationFiltersType } from '$domain/inventory/types.js';
	import InventoryFilters from '$domain/inventory/components/filters/InventoryFilters.svelte';

	interface Props {
		filters: MedicationFiltersType;
		categoryOptions: MedicationCategory[];
	}

	let { filters, categoryOptions }: Props = $props();

	let categoryFilter = $state(filters.category_id ?? '');

	function applyAllFilters(f: { search?: string; status?: string }) {
		const qs = new URLSearchParams();
		if (f.search) qs.set('search', f.search);
		if (f.status) qs.set('status', f.status);
		if (categoryFilter) qs.set('category_id', categoryFilter);
		qs.set('page', '1');
		goto(`?${qs}`, { replaceState: true });
	}
</script>

<!-- Filtros -->
<div class="bg-surface-elevated rounded-xl border border-border p-3 sm:p-4">
	<div class="flex flex-col sm:flex-row gap-3">
		<div class="flex-1">
			<InventoryFilters value={filters} onchange={applyAllFilters} />
		</div>
		<div class="sm:w-48">
			<label for="cat-filter" class="block text-xs font-medium text-ink-muted mb-1">Categoría</label>
			<select id="cat-filter" bind:value={categoryFilter}
				onchange={() => {
					const qs = new URLSearchParams($page.url.searchParams);
					if (categoryFilter) qs.set('category_id', categoryFilter);
					else qs.delete('category_id');
					qs.set('page', '1');
					goto(`?${qs}`, { replaceState: true });
				}}
				class="w-full h-9 px-2.5 text-sm rounded-lg border border-border bg-surface text-ink
				       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60">
				<option value="">Todas</option>
				{#each categoryOptions as cat}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>
	</div>
</div>

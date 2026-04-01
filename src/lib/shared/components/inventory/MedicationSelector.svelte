<script lang="ts">
	import type { MedicationOption } from '$shared/types/inventory.js';

	let {
		options,
		selected,
		onSelect,
		onClear,
		onCreateNew,
		placeholder = 'Buscar medicamento...',
		disabled = false
	}: {
		options: MedicationOption[];
		selected: MedicationOption | null;
		onSelect: (med: MedicationOption) => void;
		onClear: () => void;
		onCreateNew?: () => void;
		placeholder?: string;
		disabled?: boolean;
	} = $props();

	let search = $state('');
	let open = $state(false);
	let activeIndex = $state(-1);
	let containerEl: HTMLDivElement;

	const filtered = $derived(
		search.trim().length === 0
			? options.slice(0, 20)
			: options.filter(
					(m) =>
						m.generic_name.toLowerCase().includes(search.toLowerCase()) ||
						m.code.toLowerCase().includes(search.toLowerCase())
				).slice(0, 20)
	);

	function selectMed(med: MedicationOption) {
		onSelect(med);
		search = '';
		open = false;
		activeIndex = -1;
	}

	function clearSelection() {
		onClear();
		search = '';
	}

	function handleBlur(e: FocusEvent) {
		if (!containerEl.contains(e.relatedTarget as Node)) {
			open = false;
			activeIndex = -1;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				open = true;
				activeIndex = 0;
				e.preventDefault();
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				activeIndex = filtered.length > 0
					? (activeIndex + 1) % filtered.length
					: -1;
				break;
			case 'ArrowUp':
				e.preventDefault();
				activeIndex = filtered.length > 0
					? (activeIndex - 1 + filtered.length) % filtered.length
					: -1;
				break;
			case 'Enter':
				e.preventDefault();
				if (activeIndex >= 0 && activeIndex < filtered.length) {
					selectMed(filtered[activeIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				open = false;
				activeIndex = -1;
				break;
		}
	}
</script>

<div bind:this={containerEl} class="relative" onblur={handleBlur}>
	{#if selected}
		<div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-canvas-subtle">
			<span class="flex-1 text-sm text-ink">
				{selected.generic_name}
				<span class="text-xs text-ink-muted ml-1">({selected.code})</span>
			</span>
			{#if !disabled}
				<button
					type="button"
					onclick={clearSelection}
					class="p-0.5 text-ink-subtle hover:text-ink rounded"
					aria-label="Quitar medicamento"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
	{:else}
		<input
			type="search"
			bind:value={search}
			onfocus={() => (open = true)}
			oninput={() => { open = true; activeIndex = -1; }}
			onkeydown={handleKeydown}
			{placeholder}
			{disabled}
			role="combobox"
			aria-expanded={open}
			aria-controls="med-listbox"
			aria-activedescendant={activeIndex >= 0 ? `med-option-${filtered[activeIndex]?.id}` : undefined}
			autocomplete="off"
			class="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-elevated text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-iris-500/30 focus:border-iris-500 disabled:opacity-50"
		/>

		{#if open && !disabled}
			<div
				id="med-listbox"
				role="listbox"
				aria-label="Medicamentos"
				class="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface-elevated shadow-[var(--shadow-3)] max-h-52 overflow-y-auto"
			>
				{#if filtered.length > 0}
					{#each filtered as med, idx (med.id)}
						<button
							type="button"
							id="med-option-{med.id}"
							role="option"
							aria-selected={idx === activeIndex}
							onclick={() => selectMed(med)}
							class="w-full text-left px-3 py-2 text-sm hover:bg-canvas-subtle transition-colors {idx === activeIndex ? 'bg-canvas-subtle' : ''}"
						>
							<span class="font-medium text-ink">{med.generic_name}</span>
							{#if med.concentration}
								<span class="text-xs text-viking-600 dark:text-viking-400 ml-1 font-medium">{med.concentration}</span>
							{/if}
							<span class="text-xs text-ink-muted ml-2">{med.code} · {med.pharmaceutical_form}</span>
							<span class="text-xs text-ink-subtle ml-2">Stock: {med.current_stock}</span>
						</button>
					{/each}
				{:else if search.trim().length > 0}
					<div class="px-3 py-2 text-sm text-ink-muted">Sin resultados para "{search}"</div>
					{#if onCreateNew}
						<button
							type="button"
							onclick={() => { open = false; onCreateNew?.(); }}
							class="w-full text-left px-3 py-2 text-sm text-iris-600 hover:bg-canvas-subtle transition-colors font-medium border-t border-border"
						>
							+ Crear nuevo medicamento
						</button>
					{/if}
				{:else}
					<div class="px-3 py-2 text-sm text-ink-muted">Escribe para buscar...</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

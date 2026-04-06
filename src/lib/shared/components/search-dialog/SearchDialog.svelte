<script lang="ts">
	import type { Snippet } from 'svelte';
	import Portal from '$shared/components/util/Portal.svelte';

	export interface SearchResult {
		id: string;
		title: string;
		subtitle?: string;
		icon?: Snippet;
		tag?: string;
		tagVariant?: 'default' | 'success' | 'warning' | 'danger';
		href?: string;
		category?: string;
	}

	export interface SearchCategory {
		label: string;
		icon?: string;
		results: SearchResult[];
	}

	interface SearchFilter {
		id: string;
		label: string;
		icon?: Snippet;
	}

	let {
		open,
		onClose,
		onSearch,
		onSelect,
		categories = [],
		filters = [],
		placeholder = 'Buscar pacientes, citas, medicamentos...',
		recentSearches = [],
		isLoading = false
	}: {
		open: boolean;
		onClose: () => void;
		onSearch?: (query: string) => void;
		onSelect?: (result: SearchResult) => void;
		categories?: SearchCategory[];
		filters?: SearchFilter[];
		placeholder?: string;
		recentSearches?: SearchResult[];
		isLoading?: boolean;
	} = $props();

	let query = $state('');
	let selectedIndex = $state(0);
	let inputEl: HTMLInputElement;

	let allResults = $derived(categories.flatMap((cat) => cat.results));
	let totalResults = $derived(allResults.length);

	let displayCategories = $derived(
		query
			? categories
			: recentSearches.length > 0
				? [{ label: 'Recientes', results: recentSearches }]
				: []
	);

	let categoryStartIndices = $derived(
		(() => {
			let currentStart = 0;
			return categories.map((cat) => {
				const start = currentStart;
				currentStart += cat.results.length;
				return start;
			});
		})()
	);

	const tagColors: Record<string, string> = {
		default: 'bg-canvas-subtle text-ink-muted',
		success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
		warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
		danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
	};

	const categoryIcons: Record<string, string> = {
		Pacientes: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
		Citas: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
		Doctores: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0',
		Medicamentos: 'M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
		Proveedores: 'M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .415.336.75.75.75Z',
		Usuarios: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
		Recientes: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
		'Ir a': 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3'
	};

	$effect(() => {
		if (open) {
			query = '';
			selectedIndex = 0;
			setTimeout(() => inputEl?.focus(), 50);
		}
	});

	$effect(() => {
		onSearch?.(query);
	});

	$effect(() => {
		if (!open) return;

		function handleKeyDown(e: KeyboardEvent) {
			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					selectedIndex = (selectedIndex + 1) % Math.max(totalResults, 1);
					break;
				case 'ArrowUp':
					e.preventDefault();
					selectedIndex = (selectedIndex - 1 + Math.max(totalResults, 1)) % Math.max(totalResults, 1);
					break;
				case 'Enter':
					e.preventDefault();
					if (allResults[selectedIndex]) {
						handleSelect(allResults[selectedIndex]);
					}
					break;
				case 'Escape':
					e.preventDefault();
					onClose();
					break;
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});

	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => { document.body.style.overflow = ''; };
	});

	function handleSelect(result: SearchResult) {
		onSelect?.(result);
		onClose();
	}

	function clearQuery() {
		query = '';
		inputEl?.focus();
	}
</script>

{#if open}
	<Portal>
		<div
			class="flex items-end sm:items-start justify-center sm:pt-[12vh]"
			style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; isolation: isolate;"
		>
			<!-- Backdrop -->
			<div
				class="bg-black/50 dark:bg-black/70"
				style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);"
				onclick={onClose}
				aria-hidden="true"
				role="presentation"
			></div>

			<!-- Dialog -->
			<div
				class="relative w-full sm:max-w-2xl bg-surface-elevated border border-border/60 shadow-[var(--shadow-4)] overflow-hidden rounded-t-2xl sm:rounded-xl animate-fade-in-up"
				role="dialog"
				aria-modal="true"
				style="position: relative; z-index: 1;"
			>
				<!-- Drag handle mobile -->
				<div class="flex justify-center pt-3 pb-1 sm:hidden">
					<div class="w-10 h-1 bg-border-strong rounded-full"></div>
				</div>

				<!-- Search Input -->
				<div class="relative flex items-center gap-3 px-4 py-3 border-b border-border/40">
					<svg class="w-5 h-5 text-ink-subtle shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
					</svg>
					<input
						bind:this={inputEl}
						type="text"
						bind:value={query}
						{placeholder}
						class="flex-1 text-base text-ink placeholder:text-ink-subtle outline-none bg-transparent"
						autocomplete="off"
					/>
					{#if query}
						<button
							onclick={clearQuery}
							class="p-1 text-ink-subtle hover:text-ink hover:bg-canvas-subtle rounded-md transition-colors"
							aria-label="Limpiar búsqueda"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
					<kbd class="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-ink-subtle bg-canvas-subtle border border-border/60 rounded">Esc</kbd>
				</div>

				<!-- Filter Bar -->
				{#if filters.length > 0}
					<div class="flex items-center gap-2 px-4 py-2 border-b border-border/40 overflow-x-auto">
						{#each filters as filter (filter.id)}
							<button
								class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-canvas-subtle rounded-lg border border-border/40 transition-colors whitespace-nowrap"
							>
								{#if filter.icon}{@render filter.icon()}{/if}
								{filter.label}
							</button>
						{/each}
					</div>
				{/if}

				<!-- Results -->
				<div class="max-h-[50vh] overflow-y-auto">
					{#if isLoading}
						<div class="flex flex-col items-center justify-center py-12 px-4">
							<div class="w-6 h-6 border-2 border-viking-500 border-t-transparent rounded-full animate-spin mb-3"></div>
							<p class="text-sm text-ink-muted">Buscando...</p>
						</div>
					{:else if displayCategories.length > 0}
						{#each displayCategories as category, catIdx (category.label)}
							<div class="py-1.5">
								<div class="flex items-center gap-2 px-4 py-1.5">
									{#if categoryIcons[category.label]}
										<svg class="w-3.5 h-3.5 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
											<path stroke-linecap="round" stroke-linejoin="round" d={categoryIcons[category.label]} />
										</svg>
									{/if}
									<span class="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{category.label}</span>
									<span class="text-[10px] text-ink-subtle">({category.results.length})</span>
								</div>
								{#each category.results as result, idx (result.id)}
									{@const globalIdx = (categoryStartIndices[catIdx] ?? 0) + idx}
									{@const isSelected = selectedIndex === globalIdx}
									<button
										onclick={() => handleSelect(result)}
										onmouseenter={() => { selectedIndex = globalIdx; }}
										class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
											{isSelected ? 'bg-viking-50 dark:bg-viking-900/20' : 'hover:bg-canvas-subtle/70'}"
									>
										<div class="w-8 h-8 rounded-lg {isSelected ? 'bg-viking-100 dark:bg-viking-900/30' : 'bg-canvas-subtle'} flex items-center justify-center shrink-0">
											{#if result.icon}
												{@render result.icon()}
											{:else}
												<span class="text-xs font-bold {isSelected ? 'text-viking-600 dark:text-viking-400' : 'text-ink-muted'}">
													{result.title[0]?.toUpperCase() ?? '?'}
												</span>
											{/if}
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium text-ink truncate">{result.title}</span>
												{#if result.tag}
													<span class="px-1.5 py-0.5 text-[10px] font-medium rounded-full {tagColors[result.tagVariant || 'default']}">
														{result.tag}
													</span>
												{/if}
											</div>
											{#if result.subtitle}
												<p class="text-xs text-ink-muted truncate mt-0.5">{result.subtitle}</p>
											{/if}
										</div>
										{#if isSelected}
											<kbd class="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-ink-subtle bg-canvas-subtle border border-border/60 rounded">&#8629;</kbd>
										{:else}
											<svg class="w-4 h-4 text-ink-subtle/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
											</svg>
										{/if}
									</button>
								{/each}
							</div>
						{/each}
					{:else}
						<div class="flex flex-col items-center justify-center py-12 px-4">
							<div class="w-12 h-12 rounded-full bg-canvas-subtle flex items-center justify-center mb-3">
								<svg class="w-6 h-6 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
								</svg>
							</div>
							<p class="text-sm font-medium text-ink">
								{#if query}
									Sin resultados para "{query}"
								{:else}
									Buscar en el sistema
								{/if}
							</p>
							<p class="text-xs text-ink-muted mt-1">
								{#if query}
									Intenta con otros términos
								{:else}
									Pacientes, citas, medicamentos, doctores...
								{/if}
							</p>
						</div>
					{/if}
				</div>

				<!-- Footer -->
				<div class="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-canvas-subtle/50">
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-1.5 text-[11px] text-ink-subtle">
							<kbd class="px-1 py-0.5 bg-surface-elevated border border-border/60 rounded text-[10px] font-medium">&#8593;&#8595;</kbd>
							<span>Navegar</span>
						</div>
						<div class="flex items-center gap-1.5 text-[11px] text-ink-subtle">
							<kbd class="px-1 py-0.5 bg-surface-elevated border border-border/60 rounded text-[10px] font-medium">&#8629;</kbd>
							<span>Abrir</span>
						</div>
						<div class="flex items-center gap-1.5 text-[11px] text-ink-subtle">
							<kbd class="px-1 py-0.5 bg-surface-elevated border border-border/60 rounded text-[10px] font-medium">Esc</kbd>
							<span>Cerrar</span>
						</div>
					</div>
					{#if totalResults > 0}
						<span class="text-[11px] text-ink-subtle">{totalResults} resultado{totalResults !== 1 ? 's' : ''}</span>
					{/if}
				</div>
			</div>
		</div>
	</Portal>
{/if}

<script lang="ts">
	import type { Snippet } from 'svelte';
	import Portal from '$shared/components/util/Portal.svelte';

	interface SearchResult {
		id: string;
		title: string;
		subtitle?: string;
		icon?: Snippet;
		tag?: string;
		tagVariant?: 'default' | 'success' | 'warning';
		href?: string;
	}

	interface SearchCategory {
		label: string;
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
		placeholder = 'Search patients, appointments, inventory...',
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

	// Calculate total results for keyboard navigation
	let allResults = $derived(categories.flatMap((cat) => cat.results));
	let totalResults = $derived(allResults.length);

	// Determine display categories: show recent if no query
	let displayCategories = $derived(
		query
			? categories
			: recentSearches.length > 0
				? [{ label: 'Recent', results: recentSearches }]
				: []
	);

	// Calculate start indices for each category
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
		default: 'bg-gray-100 text-gray-600',
		success: 'bg-green-100 text-green-700',
		warning: 'bg-amber-100 text-amber-700'
	};

	// Focus input when dialog opens and reset state
	$effect(() => {
		if (open) {
			query = '';
			selectedIndex = 0;
			setTimeout(() => inputEl?.focus(), 50);
		}
	});

	// Handle search query changes
	$effect(() => {
		onSearch?.(query);
	});

	// Handle keyboard navigation
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
					selectedIndex =
						(selectedIndex - 1 + Math.max(totalResults, 1)) % Math.max(totalResults, 1);
					break;
				case 'Enter':
					e.preventDefault();
					if (allResults[selectedIndex]) {
						onSelect?.(allResults[selectedIndex]);
						onClose();
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

	// Lock body scroll
	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});

	function handleSelect(result: SearchResult) {
		onSelect?.(result);
		onClose();
	}

	function clearQuery() {
		query = '';
	}
</script>

{#if open}
	<Portal>
		<div
			class="flex items-end sm:items-start justify-center sm:pt-[15vh]"
			style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; isolation: isolate;"
		>
			<!-- Backdrop -->
			<div
				class="bg-gray-900/60 animate-in fade-in duration-200"
				style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);"
				onclick={onClose}
				aria-hidden="true"
				role="presentation"
			></div>

			<!-- Dialog - drawer on mobile, modal on desktop -->
			<div
				class="relative w-full sm:max-w-2xl bg-white shadow-2xl overflow-hidden rounded-t-2xl sm:rounded-xl animate-in fade-in dialog-panel duration-200"
				role="dialog"
				aria-modal="true"
				style="position: relative; z-index: 1;"
			>
				<!-- Drag handle - visible only on mobile -->
				<div class="flex justify-center pt-3 pb-1 sm:hidden">
					<div class="w-10 h-1 bg-gray-300 rounded-full"></div>
				</div>

				<!-- Search Input -->
				<div class="relative flex items-center gap-3 px-4 py-3 border-b border-gray-100">
					<svg
						class="w-5 h-5 text-gray-400 flex-shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
						/>
					</svg>
					<input
						bind:this={inputEl}
						type="text"
						bind:value={query}
						{placeholder}
						class="flex-1 text-base text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
						autocomplete="off"
					/>
					{#if query}
						<button
							onclick={clearQuery}
							class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
							aria-label="Clear search"
						>
							<svg
								class="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M6 18 18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</div>

				<!-- Filter Bar -->
				{#if filters.length > 0}
					<div
						class="flex items-center gap-2 px-4 py-2 border-b border-gray-100 overflow-x-auto"
					>
						{#each filters as filter (filter.id)}
							<button
								class="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors whitespace-nowrap"
							>
								{#if filter.icon}
									{@render filter.icon()}
								{/if}
								<span>{filter.label}</span>
								<svg
									class="w-3 h-3 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m19.5 8.25-7.5 7.5-7.5-7.5"
									/>
								</svg>
							</button>
						{/each}
					</div>
				{/if}

				<!-- Results Area -->
				<div class="max-h-[50vh] sm:max-h-[50vh] overflow-y-auto">
					{#if isLoading}
						<!-- Loading State -->
						<div class="flex flex-col items-center justify-center py-12 px-4">
							<div
								class="w-8 h-8 border-2 border-viking-500 border-t-transparent rounded-full animate-spin mb-3"
							></div>
							<p class="text-sm text-gray-500">Searching...</p>
						</div>
					{:else if displayCategories.length > 0}
						<!-- Category Sections -->
						{#each displayCategories as category, catIdx (category.label)}
							<div class="py-2">
								<div class="px-4 py-1.5">
									<span
										class="text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{category.label}
									</span>
								</div>
								{#each category.results as result, idx (result.id)}
									<button
										onclick={() => handleSelect(result)}
										class="
											w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
											{selectedIndex === (categoryStartIndices[catIdx] ?? 0) + idx ? 'bg-viking-50' : 'hover:bg-gray-50'}
										"
									>
										<div
											class="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500"
										>
											{#if result.icon}
												{@render result.icon()}
											{:else}
												<svg
													class="w-4 h-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													stroke-width="1.5"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
													/>
												</svg>
											{/if}
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium text-gray-900 truncate"
													>{result.title}</span
												>
												{#if result.tag}
													<span
														class="px-1.5 py-0.5 text-xs font-medium rounded {tagColors[
															result.tagVariant || 'default'
														]}"
													>
														{result.tag}
													</span>
												{/if}
											</div>
											{#if result.subtitle}
												<p class="text-xs text-gray-500 truncate mt-0.5">
													{result.subtitle}
												</p>
											{/if}
										</div>
										<svg
											class="w-4 h-4 text-gray-300 flex-shrink-0"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="1.5"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="m8.25 4.5 7.5 7.5-7.5 7.5"
											/>
										</svg>
									</button>
								{/each}
							</div>
						{/each}
					{:else}
						<!-- Empty State -->
						<div class="flex flex-col items-center justify-center py-12 px-4">
							<div
								class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"
							>
								<svg
									class="w-6 h-6 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="1.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
									/>
								</svg>
							</div>
							<p class="text-sm font-medium text-gray-900">
								{#if query}
									No results for "{query}"
								{:else}
									Start typing to search
								{/if}
							</p>
							<p class="text-xs text-gray-500 mt-1">
								{#if query}
									Try different keywords or filters
								{:else}
									Search patients, appointments, inventory...
								{/if}
							</p>
						</div>
					{/if}
				</div>

				<!-- Keyboard Hints -->
				<div
					class="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50/50"
				>
					<div class="flex items-center gap-1.5 text-xs text-gray-500">
						<kbd
							class="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-medium"
							>&#8593;&#8595;</kbd
						>
						<span>Navigate</span>
					</div>
					<div class="flex items-center gap-1.5 text-xs text-gray-500">
						<kbd
							class="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-medium"
							>&#8629;</kbd
						>
						<span>Open</span>
					</div>
					<div class="flex items-center gap-1.5 text-xs text-gray-500">
						<kbd
							class="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-medium"
							>Esc</kbd
						>
						<span>Close</span>
					</div>
				</div>
			</div>
		</div>
	</Portal>
{/if}

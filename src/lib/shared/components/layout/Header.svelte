<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';

	let {
		onSearchClick,
		onMenuClick,
		searchPlaceholder = 'Search...'
	}: {
		onSearchClick?: () => void;
		onMenuClick?: () => void;
		searchPlaceholder?: string;
	} = $props();

	function handleSearchClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		onSearchClick?.();
	}
</script>

<header class="glass border-b border-border/40 px-4 py-2.5 lg:px-6 sticky top-0 z-20">
	<div class="flex items-center justify-between gap-3">
		<div class="flex items-center gap-3 flex-1">
			<!-- MenuButton (mobile only) -->
			<button
				onclick={onMenuClick}
				class="p-1.5 -ml-1.5 text-ink-subtle hover:text-ink hover:bg-canvas-subtle/70 rounded-md lg:hidden transition-colors"
				aria-label="Open menu"
			>
				<svg
					class="w-5 h-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
					/>
				</svg>
			</button>

			<!-- SearchButton -->
			<button
				type="button"
				onclick={handleSearchClick}
				style:cursor="pointer"
				style:-webkit-tap-highlight-color="transparent"
				style:pointer-events="auto"
				class="flex items-center gap-2.5 flex-1 max-w-md px-3 py-1.5 text-[13px] text-ink-subtle bg-surface-elevated border border-border/60 rounded-lg hover:border-border-strong/80 hover:bg-canvas-subtle/50 transition-all text-left shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-none"
			>
				<svg
					class="h-4 w-4 flex-shrink-0 text-ink-subtle"
					style:pointer-events="none"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
					/>
				</svg>
				<span class="flex-1 truncate" style:pointer-events="none">{searchPlaceholder}</span>
				<kbd
					class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-ink-subtle bg-surface-elevated border border-border/80 rounded shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none"
					style:pointer-events="none"
				>
					<span class="text-[9px]">&#8984;</span>K
				</kbd>
			</button>
		</div>

		<div class="flex items-center gap-1">
			<!-- ThemeToggle -->
			<ThemeToggle />
		</div>
	</div>
</header>

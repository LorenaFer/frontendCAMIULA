<script lang="ts">
	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	let { items }: { items: BreadcrumbItem[] } = $props();
</script>

<nav aria-label="Navegación de ruta" class="flex items-center gap-1.5 text-sm text-ink-muted">
	{#each items as item, i}
		{#if i > 0}
			<svg class="w-3.5 h-3.5 text-ink-subtle shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
			</svg>
		{/if}
		{#if item.href && i < items.length - 1}
			<a href={item.href} class="hover:text-ink transition-colors">{item.label}</a>
		{:else}
			<span class="text-ink font-medium">{item.label}</span>
		{/if}
	{/each}
</nav>

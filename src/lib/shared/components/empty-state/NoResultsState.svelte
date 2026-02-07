<script lang="ts">
	import EmptyState from './EmptyState.svelte';

	let {
		query,
		onClear
	}: {
		query?: string;
		onClear?: () => void;
	} = $props();
</script>

{#snippet searchIcon()}
	<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
		/>
	</svg>
{/snippet}

{#snippet clearAction()}
	{#if onClear}
		<button onclick={onClear} class="text-sm text-viking-600 hover:text-viking-700 font-medium">
			Clear filters
		</button>
	{/if}
{/snippet}

<EmptyState
	icon={searchIcon}
	title={query ? `No results for "${query}"` : 'No results found'}
	description="Try adjusting your search or filters to find what you're looking for."
	action={onClear ? clearAction : undefined}
/>

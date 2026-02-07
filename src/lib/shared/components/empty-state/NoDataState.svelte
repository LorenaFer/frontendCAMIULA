<script lang="ts">
	import EmptyState from './EmptyState.svelte';

	let {
		title = 'No data yet',
		description,
		actionLabel,
		onAction
	}: {
		title?: string;
		description?: string;
		actionLabel?: string;
		onAction?: () => void;
	} = $props();
</script>

{#snippet documentIcon()}
	<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
		/>
	</svg>
{/snippet}

{#snippet createAction()}
	{#if actionLabel && onAction}
		<button
			onclick={onAction}
			class="inline-flex items-center gap-2 px-4 py-2 bg-viking-500 text-white text-sm font-medium rounded-lg hover:bg-viking-600 transition-colors"
		>
			<svg
				class="w-4 h-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			{actionLabel}
		</button>
	{/if}
{/snippet}

<EmptyState
	icon={documentIcon}
	{title}
	description={description || 'Get started by creating your first item.'}
	action={actionLabel && onAction ? createAction : undefined}
/>

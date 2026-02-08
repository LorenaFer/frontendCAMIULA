<script lang="ts">
	import EmptyState from './EmptyState.svelte';

	let {
		title = 'Something went wrong',
		description,
		onRetry
	}: {
		title?: string;
		description?: string;
		onRetry?: () => void;
	} = $props();
</script>

{#snippet errorIcon()}
	<svg
		class="w-8 h-8 text-red-400"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
		/>
	</svg>
{/snippet}

{#snippet retryAction()}
	{#if onRetry}
		<button
			onclick={onRetry}
			class="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated text-ink text-sm font-medium rounded-lg border border-border-strong hover:bg-canvas-subtle transition-colors"
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
					d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
				/>
			</svg>
			Try again
		</button>
	{/if}
{/snippet}

<EmptyState
	icon={errorIcon}
	{title}
	description={description || 'There was an error loading this data. Please try again.'}
	action={onRetry ? retryAction : undefined}
/>

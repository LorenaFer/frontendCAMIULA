<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		icon,
		title,
		description,
		action,
		class: className = ''
	}: {
		icon?: Snippet;
		title: string;
		description?: string;
		action?: Snippet;
		class?: string;
	} = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 px-4 text-center {className}">
	{#if icon}
		<div
			class="w-16 h-16 rounded-full bg-canvas-subtle flex items-center justify-center mb-4 text-ink-subtle"
		>
			{@render icon()}
		</div>
	{:else}
		<div class="w-16 h-16 rounded-full bg-canvas-subtle flex items-center justify-center mb-4">
			<svg
				class="w-8 h-8 text-ink-subtle"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
				/>
			</svg>
		</div>
	{/if}
	<h3 class="text-base font-semibold text-ink mb-1">{title}</h3>
	{#if description}
		<p class="text-sm text-ink-muted max-w-sm mb-4">{description}</p>
	{/if}
	{#if action}
		<div class="mt-2">{@render action()}</div>
	{/if}
</div>

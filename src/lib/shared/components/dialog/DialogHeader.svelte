<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getContext } from 'svelte';

	let {
		children,
		showClose = true,
		class: className = ''
	}: {
		children: Snippet;
		showClose?: boolean;
		class?: string;
	} = $props();

	const { onClose } = getContext<{ onClose: () => void }>('dialog');
</script>

<div
	class="flex-shrink-0 flex items-start justify-between gap-4 px-4 sm:px-6 pt-2 sm:pt-6 pb-4 {className}"
>
	<div class="flex-1 min-w-0">
		{@render children()}
	</div>
	{#if showClose}
		<button
			onclick={onClose}
			class="p-1.5 -m-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
			aria-label="Close dialog"
		>
			<svg
				class="w-5 h-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
			</svg>
		</button>
	{/if}
</div>

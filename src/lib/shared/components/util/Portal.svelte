<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let { children, target = 'body' }: { children: Snippet; target?: string } = $props();

	let el: HTMLDivElement;

	onMount(() => {
		const targetEl = document.querySelector(target);
		if (targetEl && el) {
			targetEl.appendChild(el);
			return () => {
				el?.parentNode?.removeChild(el);
			};
		}
	});
</script>

<div bind:this={el} style="display: contents;">
	{@render children()}
</div>

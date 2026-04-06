<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	interface Props {
		items: T[];
		itemHeight: number;
		containerHeight: number;
		overscan?: number;
		row: Snippet<[item: T, index: number]>;
		class?: string;
	}

	let {
		items,
		itemHeight,
		containerHeight,
		overscan = 3,
		row,
		class: className = ''
	}: Props = $props();

	let scrollTop = $state(0);
	let containerEl: HTMLDivElement | undefined = $state();

	const totalHeight = $derived(items.length * itemHeight);

	const startIndex = $derived(Math.max(0, Math.floor(scrollTop / itemHeight) - overscan));

	const endIndex = $derived(
		Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)
	);

	const visibleItems = $derived(items.slice(startIndex, endIndex));

	$effect(() => {
		const el = containerEl;
		if (!el) return;

		function onScroll() {
			scrollTop = el!.scrollTop;
		}

		el.addEventListener('scroll', onScroll, { passive: true });
		return () => el.removeEventListener('scroll', onScroll);
	});
</script>

<!--
	VirtualList — renderiza solo los ítems visibles + overscan.
	Soporta Chrome 49 (usa position:absolute, no CSS grid).
	Para listas > 50 ítems. itemHeight debe ser fijo y conocido.
-->
<div
	bind:this={containerEl}
	class="relative overflow-y-auto {className}"
	style="height:{containerHeight}px;"
	role="list"
>
	<!-- Spacer que da el alto total para el scroll nativo -->
	<div style="height:{totalHeight}px; position:relative;">
		{#each visibleItems as item, i (startIndex + i)}
			<div
				role="listitem"
				style="position:absolute; top:{(startIndex + i) * itemHeight}px; width:100%; height:{itemHeight}px;"
			>
				{@render row(item, startIndex + i)}
			</div>
		{/each}
	</div>
</div>

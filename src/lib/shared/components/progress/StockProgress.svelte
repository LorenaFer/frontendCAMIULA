<script lang="ts">
	import Progress from './Progress.svelte';

	type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
	type ProgressSize = 'sm' | 'md' | 'lg';

	let {
		current,
		max,
		reorderLevel,
		size = 'md',
		showLabel = true,
		class: className = ''
	}: {
		current: number;
		max: number;
		reorderLevel?: number;
		size?: ProgressSize;
		showLabel?: boolean;
		class?: string;
	} = $props();

	const percentage = $derived((current / max) * 100);
	const threshold = $derived(reorderLevel ? (reorderLevel / max) * 100 : 20);

	const variant: ProgressVariant = $derived.by(() => {
		if (percentage <= threshold) return 'danger';
		if (percentage <= threshold * 2) return 'warning';
		return 'success';
	});
</script>

<Progress value={current} {max} {variant} {size} {showLabel} class={className} />

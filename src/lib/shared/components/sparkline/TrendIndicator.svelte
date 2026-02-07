<script lang="ts">
	let {
		value,
		direction,
		class: className = ''
	}: {
		value: string | number;
		direction: 'up' | 'down' | 'neutral';
		class?: string;
	} = $props();

	const directionColors: Record<string, string> = {
		up: 'text-emerald-500',
		down: 'text-red-400',
		neutral: 'text-gray-400'
	};
</script>

<span
	class="inline-flex items-center gap-0.5 text-sm font-medium {directionColors[direction]} {className}"
>
	{#if direction === 'up'}
		<svg
			class="w-3.5 h-3.5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2.5"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
		</svg>
	{/if}
	{#if direction === 'down'}
		<svg
			class="w-3.5 h-3.5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2.5"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
		</svg>
	{/if}
	{value}
</span>

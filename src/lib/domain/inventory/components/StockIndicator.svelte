<script lang="ts">
	interface Props {
		stock: number;
		lowThreshold?: number;
		criticalThreshold?: number;
		class?: string;
	}

	let {
		stock,
		lowThreshold = 20,
		criticalThreshold = 10,
		class: className = ''
	}: Props = $props();

	type StockLevel = 'critical' | 'low' | 'ok';

	const level = $derived<StockLevel>(
		stock <= criticalThreshold ? 'critical' :
		stock <= lowThreshold      ? 'low'      :
		                             'ok'
	);

	const valueClasses = $derived(
		level === 'critical' ? 'text-red-600 dark:text-red-400 font-bold' :
		level === 'low'      ? 'text-honey-600 dark:text-honey-400 font-semibold' :
		                       'text-ink'
	);
</script>

<span class="inline-flex items-center gap-1 {className}">
	<span class="font-mono text-sm tabular-nums {valueClasses}">{stock}</span>
	{#if level === 'critical'}
		<svg
			class="w-3.5 h-3.5 text-red-500 flex-shrink-0"
			viewBox="0 0 16 16"
			fill="currentColor"
			aria-label="Stock crítico"
		>
			<path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5Zm0 6.5a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 11Z" />
		</svg>
	{:else if level === 'low'}
		<svg
			class="w-3.5 h-3.5 text-honey-500 flex-shrink-0"
			viewBox="0 0 16 16"
			fill="currentColor"
			aria-label="Stock bajo"
		>
			<path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
		</svg>
	{/if}
</span>

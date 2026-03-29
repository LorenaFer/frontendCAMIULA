<script lang="ts">
	interface Props {
		used: number;
		limit: number;
		unit: string;
		medication_name: string;
		class?: string;
	}

	let { used, limit, unit, medication_name, class: className = '' }: Props = $props();

	const percentage = $derived(
		limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
	);

	type BarLevel = 'ok' | 'warning' | 'danger';

	const barLevel = $derived<BarLevel>(
		percentage >= 100 ? 'danger'  :
		percentage >= 80  ? 'warning' :
		                    'ok'
	);

	const barColorClass = $derived(
		barLevel === 'danger'  ? 'bg-red-500'     :
		barLevel === 'warning' ? 'bg-honey-500'   :
		                         'bg-viking-500'
	);

	const labelColorClass = $derived(
		barLevel === 'danger'  ? 'text-red-600 dark:text-red-400'     :
		barLevel === 'warning' ? 'text-honey-600 dark:text-honey-400' :
		                         'text-ink-muted'
	);
</script>

<div class="space-y-1 {className}">
	<div class="flex items-center justify-between gap-2">
		<span class="text-[11px] text-ink-muted truncate">{medication_name}</span>
		<span class="text-[11px] tabular-nums font-medium shrink-0 {labelColorClass}">
			{used}/{limit} {unit}
		</span>
	</div>
	<div class="w-full h-1.5 bg-border/40 dark:bg-border/20 rounded-full overflow-hidden">
		<div
			class="h-full rounded-full transition-all duration-[var(--duration-slower)] ease-[var(--ease-gentle)] {barColorClass}"
			style="width: {percentage}%"
			role="progressbar"
			aria-valuenow={used}
			aria-valuemin={0}
			aria-valuemax={limit}
			aria-label="{medication_name}: {used} de {limit} {unit} usados este mes"
		></div>
	</div>
</div>

<script lang="ts">
	export type DispatchStatusFilter = 'all' | 'completed' | 'pending' | 'cancelled';

	interface Props {
		active: DispatchStatusFilter;
		onchange: (status: DispatchStatusFilter) => void;
	}

	let { active, onchange }: Props = $props();

	const statusFilters: { value: DispatchStatusFilter; label: string }[] = [
		{ value: 'all',       label: 'Todos' },
		{ value: 'completed', label: 'Completados' },
		{ value: 'pending',   label: 'Pendientes' },
		{ value: 'cancelled', label: 'Cancelados' }
	];
</script>

<div class="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
	{#each statusFilters as f (f.value)}
		{@const isActive = active === f.value}
		<button
			type="button"
			onclick={() => onchange(f.value)}
			aria-pressed={isActive}
			class="
				px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
				{isActive
					? 'bg-viking-500 border-viking-500 text-white'
					: 'bg-surface-elevated border-border text-ink-muted hover:text-ink hover:border-border-strong'}
			"
		>
			{f.label}
		</button>
	{/each}
</div>

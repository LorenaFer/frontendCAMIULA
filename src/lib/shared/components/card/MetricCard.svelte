<script lang="ts">
	type ChangeType = 'positive' | 'negative' | 'neutral';

	const changeColors: Record<ChangeType, string> = {
		positive: 'text-emerald-600',
		negative: 'text-red-600',
		neutral: 'text-ink-subtle'
	};

	let {
		label,
		value,
		change,
		changeType = 'neutral',
		class: className = ''
	}: {
		label: string;
		value: string | number;
		change?: string;
		changeType?: ChangeType;
		class?: string;
	} = $props();
</script>

<div class={className}>
	<div class="text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-1">
		{label}
	</div>
	<div class="flex items-baseline gap-2">
		<span class="text-2xl data-hero text-ink">{value}</span>
		{#if change}
			<span class="text-xs font-medium {changeColors[changeType]}">
				{change}
			</span>
		{/if}
	</div>
</div>

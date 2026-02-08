<script lang="ts">
	import type { Snippet } from 'svelte';
	import Card from './Card.svelte';

	type IconColor = 'default' | 'red' | 'amber' | 'green' | 'blue' | 'violet';
	type TrendDirection = 'up' | 'down' | 'neutral';
	type AccentColor = 'viking' | 'sage' | 'honey' | 'iris';

	const accentStyles: Record<AccentColor, string> = {
		viking: 'border-t-2 border-t-viking-400',
		sage: 'border-t-2 border-t-sage-400',
		honey: 'border-t-2 border-t-honey-400',
		iris: 'border-t-2 border-t-iris-400'
	};

	const iconColorStyles: Record<IconColor, string> = {
		default: 'bg-canvas-subtle/70 text-ink-muted',
		red: 'bg-red-50/70 text-red-600',
		amber: 'bg-amber-50/70 text-amber-600',
		green: 'bg-emerald-50/70 text-emerald-600',
		blue: 'bg-blue-50/70 text-blue-600',
		violet: 'bg-violet-50/70 text-violet-600'
	};

	const trendStyles: Record<TrendDirection, string> = {
		up: 'text-emerald-600',
		down: 'text-red-600',
		neutral: 'text-ink-subtle'
	};

	let {
		title,
		value,
		subtitle,
		trend,
		icon,
		iconColor = 'default',
		accent,
		class: className = '',
		onclick,
		visualization
	}: {
		title: string;
		value: string | number;
		subtitle?: string;
		trend?: {
			value: string;
			direction: TrendDirection;
		};
		icon?: Snippet;
		iconColor?: IconColor;
		accent?: AccentColor;
		class?: string;
		onclick?: () => void;
		visualization?: Snippet;
	} = $props();
</script>

<Card class="{accent ? accentStyles[accent] : ''} {className}" variant="default" padding="lg" hover={!!onclick} {onclick}>
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1 min-w-0 space-y-3">
			<!-- Title - small and secondary -->
			<div class="flex items-center gap-2.5">
				{#if icon}
					<div
						class="w-10 h-10 rounded-lg flex items-center justify-center {iconColorStyles[iconColor]}"
					>
						<span class="w-[18px] h-[18px] [&>svg]:w-[18px] [&>svg]:h-[18px]">
							{@render icon()}
						</span>
					</div>
				{/if}
				<span class="text-[13px] font-medium text-ink-muted">{title}</span>
			</div>

			<!-- Value - THE HERO -->
			<div class="flex items-baseline gap-2">
				<span
					class="text-[36px] data-hero text-ink"
				>
					{value}
				</span>
				{#if trend}
					<span class="text-xs font-medium {trendStyles[trend.direction]}">
						{#if trend.direction === 'up'}&#8593;{/if}
						{#if trend.direction === 'down'}&#8595;{/if}
						{trend.value}
					</span>
				{/if}
			</div>

			<!-- Subtitle -->
			{#if subtitle}
				<span class="block text-xs text-ink-subtle">{subtitle}</span>
			{/if}
		</div>

		<!-- Visualization area -->
		{#if visualization}
			<div class="flex-shrink-0 w-20 h-10 mt-1">
				{@render visualization()}
			</div>
		{/if}
	</div>
</Card>

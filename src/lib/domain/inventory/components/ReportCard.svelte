<script lang="ts">
	import type { Snippet } from 'svelte';
	import Card from '$shared/components/card/Card.svelte';

	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		alert?: boolean;
		icon?: Snippet;
		class?: string;
	}

	let {
		title,
		value,
		subtitle,
		alert = false,
		icon,
		class: className = ''
	}: Props = $props();

	const valueClass = $derived(
		alert ? 'text-red-600 dark:text-red-400' : 'text-ink'
	);

	const cardClass = $derived(
		alert ? 'border-red-200 dark:border-red-800' : ''
	);
</script>

<Card class="{cardClass} {className}" padding="md" variant="default">
	<div class="flex items-start justify-between gap-3">
		<div class="flex-1 min-w-0 space-y-2">
			<div class="flex items-center gap-2">
				{#if icon}
					<span
						class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
						       {alert ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
						               : 'bg-canvas-subtle/70 text-ink-muted'}"
					>
						{@render icon()}
					</span>
				{/if}
				<span class="text-[13px] font-medium text-ink-muted">{title}</span>
			</div>

			<p class="text-3xl font-semibold tabular-nums {valueClass}">{value}</p>

			{#if subtitle}
				<p class="text-xs text-ink-subtle">{subtitle}</p>
			{/if}
		</div>
	</div>
</Card>

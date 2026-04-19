<script lang="ts">
	import type { BatchStatus } from '$domain/inventory/types.js';

	interface Props {
		lot_number: string;
		status: BatchStatus;
		expiration_date: string;
		class?: string;
	}

	let { lot_number, status, expiration_date, class: className = '' }: Props = $props();

	const tagStyles: Record<BatchStatus, string> = {
		available:  'bg-sage-100 text-sage-800 border-sage-200 dark:bg-sage-900/30 dark:text-sage-300 dark:border-sage-700',
		depleted:   'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600',
		expired:    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
		quarantine: 'bg-iris-100 text-iris-800 border-iris-200 dark:bg-iris-900/30 dark:text-iris-300 dark:border-iris-700'
	};

	const labelMap: Record<BatchStatus, string> = {
		available:  'Disponible',
		depleted:   'Agotado',
		expired:    'Vencido',
		quarantine: 'Cuarentena'
	};

	const daysLeft = $derived.by(() => {
		const exp = new Date(expiration_date);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	});

	const expiryTextClass = $derived(
		daysLeft <= 30  ? 'text-red-600 dark:text-red-400' :
		daysLeft <= 90  ? 'text-honey-600 dark:text-honey-400' :
		                  'text-ink-muted'
	);
</script>

<div class="inline-flex flex-col gap-0.5 {className}">
	<span
		class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium font-mono {tagStyles[status]}"
	>
		{lot_number}
		<span class="opacity-60 font-normal text-[10px]">{labelMap[status]}</span>
	</span>
	<span class="text-[10px] {expiryTextClass} tabular-nums">
		Vence: {expiration_date}
		{#if daysLeft < 90}
			<span class="font-medium">({daysLeft}d)</span>
		{/if}
	</span>
</div>

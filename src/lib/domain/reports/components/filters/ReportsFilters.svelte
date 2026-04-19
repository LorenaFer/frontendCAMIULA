<script lang="ts">
	import Button from '$shared/components/button/Button.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import { MONTHS } from '$domain/reports/types';

	let {
		selectedTab,
		selectedYear = $bindable(),
		selectedWeek = $bindable(),
		selectedMonth = $bindable(),
		onapply
	}: {
		selectedTab: string;
		selectedYear: string;
		selectedWeek: string;
		selectedMonth: string;
		onapply: () => void;
	} = $props();

	const yearOptions = $derived(
		Array.from({ length: 5 }, (_, i) => {
			const y = new Date().getFullYear() - i;
			return { value: String(y), label: String(y) };
		})
	);

	const weekOptions = $derived(
		Array.from({ length: 52 }, (_, i) => ({
			value: String(i + 1), label: `Semana ${i + 1}`
		}))
	);

	const monthOptions = $derived(
		MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))
	);
</script>

<div class="bg-surface-elevated rounded-xl border border-border/60 p-4">
	<div class="flex flex-wrap items-end gap-3">
		<div class="w-28">
			<Select label="Año" options={yearOptions} value={selectedYear} onchange={(v) => { if (typeof v === 'string') selectedYear = v; }} />
		</div>
		{#if selectedTab === 'epi15'}
			<div class="w-36">
				<Select label="Mes" options={monthOptions} value={selectedMonth} onchange={(v) => { if (typeof v === 'string') selectedMonth = v; }} />
			</div>
		{:else}
			<div class="w-40">
				<Select label="Semana epidemiológica" options={weekOptions} value={selectedWeek} onchange={(v) => { if (typeof v === 'string') selectedWeek = v; }} />
			</div>
		{/if}
		<Button variant="primary" size="md" onclick={onapply}>Generar</Button>
	</div>
</div>

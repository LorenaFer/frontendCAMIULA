<script lang="ts">
	import { goto } from '$app/navigation';
	import { TabGroup } from '$shared/components/tabs';
	import ReportsFilters from '$domain/reports/components/filters/ReportsFilters.svelte';
	import Epi12Report from '$domain/reports/components/sections/Epi12Report.svelte';
	import Epi13Report from '$domain/reports/components/sections/Epi13Report.svelte';
	import Epi15Report from '$domain/reports/components/sections/Epi15Report.svelte';
	import type { ReportsPageData } from '$domain/reports/types';

	let { data }: { data: ReportsPageData } = $props();

	let selectedTab = $state(data.tab);
	let selectedYear = $state(String(data.year));
	let selectedWeek = $state(String(data.week));
	let selectedMonth = $state(String(data.month));

	function applyFilters() {
		const qs = new URLSearchParams();
		qs.set('tab', selectedTab);
		qs.set('year', selectedYear);
		if (selectedTab === 'epi15') qs.set('month', selectedMonth);
		else qs.set('week', selectedWeek);
		goto(`?${qs}`, { replaceState: true });
	}

	// Sync tab selection to URL when user switches tabs
	$effect(() => {
		const tab = selectedTab;
		if (tab === data.tab) return;
		const qs = new URLSearchParams();
		qs.set('tab', tab);
		qs.set('year', selectedYear);
		if (tab === 'epi15') qs.set('month', selectedMonth);
		else qs.set('week', selectedWeek);
		goto(`?${qs}`, { replaceState: true });
	});
</script>

<svelte:head>
	<title>Reportes Epidemiológicos</title>
</svelte:head>

<div class="space-y-5 animate-fade-in-up">
	<!-- Header -->
	<div>
		<h1 class="text-xl font-bold text-ink">Reportes Epidemiológicos</h1>
		<p class="text-sm text-ink-muted mt-0.5">Formularios oficiales MPPS — SIS-04</p>
	</div>

	<!-- Tabs -->
	<TabGroup
		tabs={[
			{ id: 'epi12', label: 'EPI-12', subtitle: 'Consolidado Semanal' },
			{ id: 'epi13', label: 'EPI-13', subtitle: 'Listado Nominal' },
			{ id: 'epi15', label: 'EPI-15', subtitle: 'Consolidado Mensual' }
		]}
		bind:active={selectedTab}
		variant="underline"
	/>

	<!-- Filtros -->
	<ReportsFilters
		{selectedTab}
		bind:selectedYear
		bind:selectedWeek
		bind:selectedMonth
		onapply={applyFilters}
	/>

	<!-- ═══ EPI-12: Consolidado Semanal ═══ -->
	{#if selectedTab === 'epi12'}
		<Epi12Report report={data.epi12} />
	{/if}

	<!-- ═══ EPI-13: Listado Nominal ═══ -->
	{#if selectedTab === 'epi13'}
		<Epi13Report report={data.epi13} />
	{/if}

	<!-- ═══ EPI-15: Consolidado Mensual ═══ -->
	{#if selectedTab === 'epi15'}
		<Epi15Report report={data.epi15} />
	{/if}
</div>

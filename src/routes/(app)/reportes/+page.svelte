<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Card from '$shared/components/card/Card.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Select from '$shared/components/select/Select.svelte';

	let { data }: { data: PageData } = $props();

	const AGE_GROUPS = ['<1', '1-4', '5-6', '7-9', '10-11', '12-14', '15-19', '20-24', '25-44', '45-59', '60-64', '65+'];
	const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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

	function changeTab(tab: string) {
		selectedTab = tab;
		const qs = new URLSearchParams();
		qs.set('tab', tab);
		qs.set('year', selectedYear);
		if (tab === 'epi15') qs.set('month', selectedMonth);
		else qs.set('week', selectedWeek);
		goto(`?${qs}`, { replaceState: true });
	}

	function formatDate(iso: string) {
		try {
			return new Date(iso + 'T12:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
		} catch { return iso; }
	}

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
	<div class="flex gap-1 border-b border-border">
		{#each [
			{ id: 'epi12', label: 'EPI-12', subtitle: 'Consolidado Semanal' },
			{ id: 'epi13', label: 'EPI-13', subtitle: 'Listado Nominal' },
			{ id: 'epi15', label: 'EPI-15', subtitle: 'Consolidado Mensual' }
		] as tab}
			<button
				class="px-4 py-2.5 text-sm font-medium transition-colors relative {selectedTab === tab.id ? 'text-viking-600' : 'text-ink-muted hover:text-ink'}"
				onclick={() => changeTab(tab.id)}
			>
				<span class="font-semibold">{tab.label}</span>
				<span class="hidden sm:inline text-xs font-normal ml-1">— {tab.subtitle}</span>
				{#if selectedTab === tab.id}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-viking-600"></div>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Filtros -->
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
			<Button variant="primary" size="md" onclick={applyFilters}>Generar</Button>
		</div>
	</div>

	<!-- ═══ EPI-12: Consolidado Semanal ═══ -->
	{#if selectedTab === 'epi12'}
		{#if data.epi12}
			{@const report = data.epi12}
			<Card padding="none">
				<div class="px-4 py-3 border-b border-border/60 flex items-center justify-between">
					<div>
						<h2 class="text-sm font-semibold text-ink">EPI-12 — Consolidado Semanal por Grupo Etario y Sexo</h2>
						<p class="text-xs text-ink-muted">{formatDate(report.start_date)} al {formatDate(report.end_date)} · Semana {report.week}/{report.year}</p>
					</div>
					<Badge variant="info" style="soft" size="sm">{report.total_cases} caso{report.total_cases !== 1 ? 's' : ''}</Badge>
				</div>
				{#if report.diseases.length > 0}
					<div class="overflow-x-auto">
						<table class="w-full text-xs border-collapse">
							<thead class="bg-canvas-subtle sticky top-0">
								<tr>
									<th class="px-2 py-2 text-left font-medium text-ink-muted border-b border-border/40 whitespace-nowrap sticky left-0 bg-canvas-subtle z-10">Enfermedad</th>
									<th class="px-2 py-2 text-center font-medium text-ink-muted border-b border-border/40">CIE-10</th>
									{#each AGE_GROUPS as group}
										<th class="px-1 py-1 text-center border-b border-border/40" colspan="2">
											<span class="text-[10px] font-semibold text-ink-muted">{group}</span>
											<div class="flex text-[9px] text-ink-subtle">
												<span class="flex-1">H</span>
												<span class="flex-1">M</span>
											</div>
										</th>
									{/each}
									<th class="px-2 py-2 text-center font-semibold text-ink border-b border-border/40">Total</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border/30">
								{#each report.diseases as disease}
									<tr class="hover:bg-canvas-subtle/50">
										<td class="px-2 py-2 font-medium text-ink whitespace-nowrap sticky left-0 bg-surface-elevated">{disease.disease_name}</td>
										<td class="px-2 py-2 text-center font-mono text-ink-muted">{disease.cie10}</td>
										{#each AGE_GROUPS as group}
											{@const counts = disease.age_groups[group] ?? { H: 0, M: 0 }}
											<td class="px-1 py-2 text-center font-mono {counts.H > 0 ? 'text-viking-600 dark:text-viking-400 font-semibold' : 'text-ink-subtle'}">{counts.H || '·'}</td>
											<td class="px-1 py-2 text-center font-mono {counts.M > 0 ? 'text-iris-600 dark:text-iris-400 font-semibold' : 'text-ink-subtle'}">{counts.M || '·'}</td>
										{/each}
										<td class="px-2 py-2 text-center font-mono font-bold text-ink">{disease.total}</td>
									</tr>
								{/each}
							</tbody>
							<tfoot>
								<tr class="bg-canvas-subtle font-semibold">
									<td class="px-2 py-2 text-ink sticky left-0 bg-canvas-subtle" colspan="2">TOTAL</td>
									{#each AGE_GROUPS as group}
										{@const totalH = report.diseases.reduce((s, d) => s + (d.age_groups[group]?.H ?? 0), 0)}
										{@const totalM = report.diseases.reduce((s, d) => s + (d.age_groups[group]?.M ?? 0), 0)}
										<td class="px-1 py-2 text-center font-mono text-xs {totalH > 0 ? 'text-ink' : 'text-ink-subtle'}">{totalH || '·'}</td>
										<td class="px-1 py-2 text-center font-mono text-xs {totalM > 0 ? 'text-ink' : 'text-ink-subtle'}">{totalM || '·'}</td>
									{/each}
									<td class="px-2 py-2 text-center font-mono text-ink">{report.total_cases}</td>
								</tr>
							</tfoot>
						</table>
					</div>
				{:else}
					<div class="py-12 text-center">
						<p class="text-sm text-ink-muted">Sin casos registrados para esta semana</p>
					</div>
				{/if}
			</Card>
		{:else}
			<Card padding="lg">
				<div class="text-center py-8">
					<p class="text-sm text-ink-muted">Seleccione año y semana, luego haga clic en "Generar"</p>
				</div>
			</Card>
		{/if}
	{/if}

	<!-- ═══ EPI-13: Listado Nominal ═══ -->
	{#if selectedTab === 'epi13'}
		{#if data.epi13}
			{@const report = data.epi13}
			<Card padding="none">
				<div class="px-4 py-3 border-b border-border/60 flex items-center justify-between">
					<div>
						<h2 class="text-sm font-semibold text-ink">EPI-13 — Listado Nominal de Casos</h2>
						<p class="text-xs text-ink-muted">{formatDate(report.start_date)} al {formatDate(report.end_date)} · Semana {report.week}/{report.year}</p>
					</div>
					<Badge variant="info" style="soft" size="sm">{report.total_cases} caso{report.total_cases !== 1 ? 's' : ''}</Badge>
				</div>
				{#if report.cases.length > 0}
					<div class="overflow-x-auto">
						<table class="w-full text-sm border-collapse">
							<thead class="bg-canvas-subtle">
								<tr>
									<th class="px-3 py-2 text-left text-xs font-medium text-ink-muted border-b border-border/40">#</th>
									<th class="px-3 py-2 text-left text-xs font-medium text-ink-muted border-b border-border/40">Fecha</th>
									<th class="px-3 py-2 text-left text-xs font-medium text-ink-muted border-b border-border/40">Paciente</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-ink-muted border-b border-border/40">Edad</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-ink-muted border-b border-border/40">Sexo</th>
									<th class="px-3 py-2 text-left text-xs font-medium text-ink-muted border-b border-border/40">Dirección</th>
									<th class="px-3 py-2 text-left text-xs font-medium text-ink-muted border-b border-border/40">Enfermedad</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-ink-muted border-b border-border/40">CIE-10</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border/30">
								{#each report.cases as caso, i}
									<tr class="hover:bg-canvas-subtle/50">
										<td class="px-3 py-2.5 text-xs text-ink-muted">{i + 1}</td>
										<td class="px-3 py-2.5 text-xs font-mono text-ink">{formatDate(caso.date)}</td>
										<td class="px-3 py-2.5 text-sm font-medium text-ink">{caso.patient_name}</td>
										<td class="px-3 py-2.5 text-center text-sm font-mono text-ink">{caso.age}</td>
										<td class="px-3 py-2.5 text-center">
											<Badge variant={caso.sex === 'M' ? 'info' : 'warning'} style="soft" size="xs">{caso.sex}</Badge>
										</td>
										<td class="px-3 py-2.5 text-xs text-ink-muted max-w-[200px] truncate">{caso.address || '—'}</td>
										<td class="px-3 py-2.5 text-sm text-ink">{caso.disease}</td>
										<td class="px-3 py-2.5 text-center font-mono text-xs text-ink-muted">{caso.cie10}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="py-12 text-center">
						<p class="text-sm text-ink-muted">Sin casos registrados para esta semana</p>
					</div>
				{/if}
			</Card>
		{:else}
			<Card padding="lg">
				<div class="text-center py-8">
					<p class="text-sm text-ink-muted">Seleccione año y semana, luego haga clic en "Generar"</p>
				</div>
			</Card>
		{/if}
	{/if}

	<!-- ═══ EPI-15: Consolidado Mensual ═══ -->
	{#if selectedTab === 'epi15'}
		{#if data.epi15}
			{@const report = data.epi15}
			<Card padding="none">
				<div class="px-4 py-3 border-b border-border/60 flex items-center justify-between">
					<div>
						<h2 class="text-sm font-semibold text-ink">EPI-15 — Consolidado Mensual de Morbilidad</h2>
						<p class="text-xs text-ink-muted">{MONTHS[report.month - 1]} {report.year}</p>
					</div>
					<Badge variant="info" style="soft" size="sm">{report.total_cases} caso{report.total_cases !== 1 ? 's' : ''}</Badge>
				</div>
				{#if report.categories.length > 0}
					<div class="overflow-x-auto">
						<table class="w-full text-sm border-collapse">
							<thead class="bg-canvas-subtle sticky top-0">
								<tr>
									<th class="px-3 py-2 text-left text-xs font-medium text-ink-muted border-b border-border/40 w-10">#</th>
									<th class="px-3 py-2 text-left text-xs font-medium text-ink-muted border-b border-border/40">Enfermedad</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-ink-muted border-b border-border/40 w-16">CIE-10</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-ink-muted border-b border-border/40 w-20">Mes</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-ink-muted border-b border-border/40 w-20">Acumulado</th>
								</tr>
							</thead>
							<tbody>
								{#each report.categories as category}
									<!-- Category header -->
									<tr class="bg-viking-50/50 dark:bg-viking-900/10">
										<td colspan="5" class="px-3 py-2 text-xs font-bold text-viking-700 dark:text-viking-300 uppercase tracking-wider">
											{category.name}
										</td>
									</tr>
									{#each category.subcategories as sub}
										<!-- Subcategory header -->
										<tr class="bg-canvas-subtle/50">
											<td colspan="5" class="px-3 py-1.5 text-[11px] font-semibold text-ink-muted pl-6">
												{sub.name}
											</td>
										</tr>
										{#each sub.diseases as disease}
											<tr class="hover:bg-canvas-subtle/50 {disease.count > 0 ? '' : 'opacity-50'}">
												<td class="px-3 py-2 text-xs text-ink-muted font-mono text-center">{disease.order}</td>
												<td class="px-3 py-2 text-sm text-ink pl-8">{disease.name}</td>
												<td class="px-3 py-2 text-center text-xs font-mono text-ink-muted">{disease.cie10_range}</td>
												<td class="px-3 py-2 text-center font-mono {disease.count > 0 ? 'text-ink font-semibold' : 'text-ink-subtle'}">{disease.count}</td>
												<td class="px-3 py-2 text-center font-mono {disease.accumulated > 0 ? 'text-ink' : 'text-ink-subtle'}">{disease.accumulated}</td>
											</tr>
										{/each}
									{/each}
								{/each}
							</tbody>
							<tfoot>
								<tr class="bg-canvas-subtle font-semibold border-t-2 border-border">
									<td colspan="3" class="px-3 py-2.5 text-sm text-ink">TOTAL GENERAL</td>
									<td class="px-3 py-2.5 text-center font-mono text-ink">{report.total_cases}</td>
									<td class="px-3 py-2.5 text-center font-mono text-ink">{report.total_cases}</td>
								</tr>
							</tfoot>
						</table>
					</div>
				{:else}
					<div class="py-12 text-center">
						<p class="text-sm text-ink-muted">Sin casos registrados para este mes</p>
					</div>
				{/if}
			</Card>
		{:else}
			<Card padding="lg">
				<div class="text-center py-8">
					<p class="text-sm text-ink-muted">Seleccione año y mes, luego haga clic en "Generar"</p>
				</div>
			</Card>
		{/if}
	{/if}
</div>

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

	// Traducción de categorías y enfermedades del EPI-15 (backend devuelve en inglés)
	const translations: Record<string, string> = {
		// Categorías
		'I. Infectious and Parasitic Diseases': 'I. Enfermedades Infecciosas y Parasitarias',
		'II. Neoplasms': 'II. Neoplasias',
		'III. Blood Diseases': 'III. Enfermedades de la Sangre',
		'IV. Endocrine and Metabolic Diseases': 'IV. Enfermedades Endocrinas y Metabólicas',
		'V. Mental and Behavioral Disorders': 'V. Trastornos Mentales y del Comportamiento',
		'VI. Nervous System Diseases': 'VI. Enfermedades del Sistema Nervioso',
		'VII. Eye Diseases': 'VII. Enfermedades del Ojo',
		'VIII. Ear Diseases': 'VIII. Enfermedades del Oído',
		'IX. Circulatory System Diseases': 'IX. Enfermedades del Sistema Circulatorio',
		'X. Respiratory System Diseases': 'X. Enfermedades del Sistema Respiratorio',
		'XI. Digestive System Diseases': 'XI. Enfermedades del Sistema Digestivo',
		'XII. Skin Diseases': 'XII. Enfermedades de la Piel',
		'XIII. Musculoskeletal Diseases': 'XIII. Enfermedades del Sistema Osteomuscular',
		'XIV. Genitourinary Diseases': 'XIV. Enfermedades del Sistema Genitourinario',
		'XV. Pregnancy and Childbirth': 'XV. Embarazo, Parto y Puerperio',
		'XVI. Perinatal Conditions': 'XVI. Condiciones Perinatales',
		'XVII. Congenital Malformations': 'XVII. Malformaciones Congénitas',
		'XVIII. Symptoms and Signs': 'XVIII. Síntomas y Signos',
		'XIX. Injury and Poisoning': 'XIX. Traumatismos y Envenenamientos',
		'XX. External Causes': 'XX. Causas Externas',
		// Subcategorías
		'Ia. Waterborne and Foodborne': 'Ia. Transmitidas por agua y alimentos',
		'Ib. Vaccine-preventable Diseases': 'Ib. Prevenibles por vacunación',
		'Ic. Tuberculosis': 'Ic. Tuberculosis',
		'Id. Zoonoses': 'Id. Zoonosis',
		'Ie. STIs': 'Ie. Infecciones de transmisión sexual',
		'If. Vector-borne Diseases': 'If. Transmitidas por vectores',
		'Ig. Viral Hepatitis': 'Ig. Hepatitis virales',
		'Ih. Other Infectious Diseases': 'Ih. Otras enfermedades infecciosas',
		'IIa. Neoplasms': 'IIa. Neoplasias',
		'IIIa. Blood Disorders': 'IIIa. Trastornos de la sangre',
		'IVa. Endocrine/Metabolic': 'IVa. Endocrinas y metabólicas',
		'Va. Mental Health': 'Va. Salud mental',
		'VIa. Nervous System': 'VIa. Sistema nervioso',
		'VIIa. Eye': 'VIIa. Enfermedades del ojo',
		'VIIIa. Ear': 'VIIIa. Enfermedades del oído',
		'IXa. Cardiovascular': 'IXa. Cardiovasculares',
		'Xa. Upper Respiratory': 'Xa. Vías respiratorias superiores',
		'Xa. Acute Respiratory': 'Xa. Respiratorias agudas',
		'Xb. Lower Respiratory': 'Xb. Vías respiratorias inferiores',
		'Xb. Chronic Respiratory Diseases': 'Xb. Enfermedades respiratorias crónicas',
		'XIa. Digestive Diseases': 'XIa. Enfermedades digestivas',
		'XIIa. Skin Diseases': 'XIIa. Enfermedades de la piel',
		'XIIIa. Musculoskeletal': 'XIIIa. Osteomusculares',
		'XIVa. Genitourinary': 'XIVa. Genitourinarias',
		'XVa. Obstetric': 'XVa. Obstétricas',
		'XVIa. Perinatal': 'XVIa. Perinatales',
		'XVIIa. Congenital': 'XVIIa. Congénitas',
		'XVIIIa. Symptoms': 'XVIIIa. Síntomas',
		'XIXa. Injuries': 'XIXa. Traumatismos',
		'XXa. Other': 'XXa. Otras causas',
		// Enfermedades comunes
		'Cholera (A00)': 'Cólera (A00)',
		'Amebiasis (A06)': 'Amebiasis (A06)',
		'Typhoid and Paratyphoid fever (A01)': 'Fiebre tifoidea y paratifoidea (A01)',
		'Food poisoning (A05)': 'Intoxicación alimentaria (A05)',
		'Hepatitis A (B15)': 'Hepatitis A (B15)',
		'Measles (B05)': 'Sarampión (B05)',
		'Rubella (B06)': 'Rubéola (B06)',
		'Varicella (B01)': 'Varicela (B01)',
		'Pulmonary Tuberculosis (A15)': 'Tuberculosis pulmonar (A15)',
		'Extrapulmonary Tuberculosis (A17-A19)': 'Tuberculosis extrapulmonar (A17-A19)',
		'Essential hypertension (I10)': 'Hipertensión arterial esencial (I10)',
		'Acute nasopharyngitis (J00)': 'Rinofaringitis aguda (J00)',
		'Influenza (J09-J11)': 'Influenza (J09-J11)',
		'Pneumonia (J12-J18)': 'Neumonía (J12-J18)',
		'Asthma (J45)': 'Asma (J45)',
		'Diabetes mellitus (E10-E14)': 'Diabetes mellitus (E10-E14)',
		'Malnutrition (E40-E46)': 'Desnutrición (E40-E46)',
		'Dengue (A90-A91)': 'Dengue (A90-A91)',
		'Malaria (B50-B54)': 'Malaria (B50-B54)',
		'Chagas disease (B57)': 'Enfermedad de Chagas (B57)',
		'Syphilis (A50-A53)': 'Sífilis (A50-A53)',
		'Gonorrhea (A54)': 'Gonorrea (A54)',
		'HIV/AIDS (B20-B24)': 'VIH/SIDA (B20-B24)',
		// Respiratorias
		'Common cold (J00)': 'Resfriado común (J00)',
		'Acute sinusitis (J01)': 'Sinusitis aguda (J01)',
		'Acute pharyngitis (J02)': 'Faringitis aguda (J02)',
		'Acute tonsillitis (J03)': 'Amigdalitis aguda (J03)',
		'Acute bronchitis (J20)': 'Bronquitis aguda (J20)',
		'COPD (J44)': 'EPOC (J44)',
		// Digestivas
		'Gastritis and duodenitis (K29)': 'Gastritis y duodenitis (K29)',
		'Gastric and duodenal ulcer (K25-K27)': 'Úlcera gástrica y duodenal (K25-K27)',
		// Musculoesqueléticas
		'Low back pain (M54)': 'Lumbalgia (M54)',
		// Genitourinarias
		'Urinary tract infection (N39)': 'Infección urinaria (N39)',
		'Vaginitis (N76)': 'Vaginitis (N76)',
		// Traumatismos
		'Fractures (S02-S92)': 'Fracturas (S02-S92)',
		'Open wounds (S01-S91)': 'Heridas abiertas (S01-S91)',
		// Otras
		'Other causes': 'Otras causas',
		'Anemia (D50-D64)': 'Anemia (D50-D64)',
		'Obesity (E66)': 'Obesidad (E66)',
		'Conjunctivitis (H10)': 'Conjuntivitis (H10)',
		'Otitis media (H65-H66)': 'Otitis media (H65-H66)',
		'Ischemic heart disease (I20-I25)': 'Cardiopatía isquémica (I20-I25)',
		'Cerebrovascular disease (I60-I69)': 'Enfermedad cerebrovascular (I60-I69)',
		'Dermatitis (L20-L30)': 'Dermatitis (L20-L30)',
		'Scabies (B86)': 'Escabiosis (B86)',
		'Intestinal parasitosis (B65-B83)': 'Parasitosis intestinal (B65-B83)',
		'Leishmaniasis (B55)': 'Leishmaniasis (B55)',
		'Leptospirosis (A27)': 'Leptospirosis (A27)',
		'Rabies (A82)': 'Rabia (A82)',
		'Hepatitis B (B16)': 'Hepatitis B (B16)',
		'Hepatitis C (B17.1)': 'Hepatitis C (B17.1)',
		'Whooping cough (A37)': 'Tos ferina (A37)',
		'Diphtheria (A36)': 'Difteria (A36)',
		'Tetanus (A33-A35)': 'Tétanos (A33-A35)',
		'Mumps (B26)': 'Parotiditis (B26)',
		'Meningitis (G00-G03)': 'Meningitis (G00-G03)',
		'Epilepsy (G40)': 'Epilepsia (G40)',
	};

	// Traducir dinámicamente: busca en el diccionario, si no encuentra usa original
	// También traduce patrones como "Diarrhea in children <1 year"
	function t(text: string): string {
		if (translations[text]) return translations[text];
		// Traducir patrones de diarrea
		if (text.startsWith('Diarrhea')) {
			return text
				.replace('Diarrhea in children', 'Diarrea en niños')
				.replace('Diarrhea', 'Diarrea')
				.replace('years', 'años')
				.replace('year', 'año');
		}
		return text;
	}

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
											{t(category.name)}
										</td>
									</tr>
									{#each category.subcategories as sub}
										<!-- Subcategory header -->
										<tr class="bg-canvas-subtle/50">
											<td colspan="5" class="px-3 py-1.5 text-[11px] font-semibold text-ink-muted pl-6">
												{t(sub.name)}
											</td>
										</tr>
										{#each sub.diseases as disease}
											<tr class="hover:bg-canvas-subtle/50 {disease.count > 0 ? '' : 'opacity-50'}">
												<td class="px-3 py-2 text-xs text-ink-muted font-mono text-center">{disease.order}</td>
												<td class="px-3 py-2 text-sm text-ink pl-8">{t(disease.name)}</td>
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

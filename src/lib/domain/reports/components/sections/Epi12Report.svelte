<script lang="ts">
	import Card from '$shared/components/card/Card.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import { AGE_GROUPS, formatReportDate, type EPI12Data } from '$domain/reports/types';

	let { report }: { report: EPI12Data | null } = $props();
</script>

{#if report}
	{@const r = report}
	<Card padding="none">
		<div class="px-4 py-3 border-b border-border/60 flex items-center justify-between">
			<div>
				<h2 class="text-sm font-semibold text-ink">EPI-12 — Consolidado Semanal por Grupo Etario y Sexo</h2>
				<p class="text-xs text-ink-muted">{formatReportDate(r.start_date)} al {formatReportDate(r.end_date)} · Semana {r.week}/{r.year}</p>
			</div>
			<Badge variant="info" style="soft" size="sm">{r.total_cases} caso{r.total_cases !== 1 ? 's' : ''}</Badge>
		</div>
		{#if r.diseases.length > 0}
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
						{#each r.diseases as disease}
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
								{@const totalH = r.diseases.reduce((s, d) => s + (d.age_groups[group]?.H ?? 0), 0)}
								{@const totalM = r.diseases.reduce((s, d) => s + (d.age_groups[group]?.M ?? 0), 0)}
								<td class="px-1 py-2 text-center font-mono text-xs {totalH > 0 ? 'text-ink' : 'text-ink-subtle'}">{totalH || '·'}</td>
								<td class="px-1 py-2 text-center font-mono text-xs {totalM > 0 ? 'text-ink' : 'text-ink-subtle'}">{totalM || '·'}</td>
							{/each}
							<td class="px-2 py-2 text-center font-mono text-ink">{r.total_cases}</td>
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

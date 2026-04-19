<script lang="ts">
	import Card from '$shared/components/card/Card.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import { formatReportDate, type EPI13Data } from '$domain/reports/types';

	let { report }: { report: EPI13Data | null } = $props();
</script>

{#if report}
	{@const r = report}
	<Card padding="none">
		<div class="px-4 py-3 border-b border-border/60 flex items-center justify-between">
			<div>
				<h2 class="text-sm font-semibold text-ink">EPI-13 — Listado Nominal de Casos</h2>
				<p class="text-xs text-ink-muted">{formatReportDate(r.start_date)} al {formatReportDate(r.end_date)} · Semana {r.week}/{r.year}</p>
			</div>
			<Badge variant="info" style="soft" size="sm">{r.total_cases} caso{r.total_cases !== 1 ? 's' : ''}</Badge>
		</div>
		{#if r.cases.length > 0}
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
						{#each r.cases as caso, i}
							<tr class="hover:bg-canvas-subtle/50">
								<td class="px-3 py-2.5 text-xs text-ink-muted">{i + 1}</td>
								<td class="px-3 py-2.5 text-xs font-mono text-ink">{formatReportDate(caso.date)}</td>
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

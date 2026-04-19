<script lang="ts">
	import Card from '$shared/components/card/Card.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import { MONTHS, t, type EPI15Data } from '$domain/reports/types';

	let { report }: { report: EPI15Data | null } = $props();
</script>

{#if report}
	{@const r = report}
	<Card padding="none">
		<div class="px-4 py-3 border-b border-border/60 flex items-center justify-between">
			<div>
				<h2 class="text-sm font-semibold text-ink">EPI-15 — Consolidado Mensual de Morbilidad</h2>
				<p class="text-xs text-ink-muted">{MONTHS[r.month - 1]} {r.year}</p>
			</div>
			<Badge variant="info" style="soft" size="sm">{r.total_cases} caso{r.total_cases !== 1 ? 's' : ''}</Badge>
		</div>
		{#if r.categories.length > 0}
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
						{#each r.categories as category}
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
							<td class="px-3 py-2.5 text-center font-mono text-ink">{r.total_cases}</td>
							<td class="px-3 py-2.5 text-center font-mono text-ink">{r.total_cases}</td>
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

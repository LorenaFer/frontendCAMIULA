<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { AppointmentFilters as AppointmentFiltersType, CitaConPaciente, TimeSlot } from '$domain/appointments/types.js';
	import AppointmentFilters from '$domain/appointments/components/filters/AppointmentFilters.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import { deserialize } from '$app/forms';
	import AppointmentAnalystKpiCards from '$domain/appointments/components/stats/AppointmentAnalystKpiCards.svelte';
	import AppointmentAnalystBreakdown from '$domain/appointments/components/views/AppointmentAnalystBreakdown.svelte';
	import AppointmentAnalystTable from '$domain/appointments/components/tables/AppointmentAnalystTable.svelte';
	import AppointmentDetailDialog from '$domain/appointments/components/dialogs/AppointmentDetailDialog.svelte';
	import AppointmentCancelDialog from '$domain/appointments/components/dialogs/AppointmentCancelDialog.svelte';
	import AppointmentRescheduleDialog from '$domain/appointments/components/dialogs/AppointmentRescheduleDialog.svelte';

	let { data }: { data: PageData } = $props();

	function applyFilters(filters: AppointmentFiltersType) {
		const qs = new URLSearchParams();
		if (filters.fecha) qs.set('fecha', filters.fecha);
		if (filters.doctor_id) qs.set('doctor_id', String(filters.doctor_id));
		if (filters.especialidad_id) qs.set('especialidad_id', String(filters.especialidad_id));
		if (filters.estado) qs.set('estado', filters.estado);
		if (filters.search) qs.set('search', filters.search);
		qs.set('page', '1');
		goto(`?${qs}`, { replaceState: true });
	}

	function changePage(p: number, ps?: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		if (ps) qs.set('page_size', String(ps));
		goto(`?${qs}`, { replaceState: true });
	}

	const pagination = $derived(data.citas.pagination);

	function exportar() {
		const qs = new URLSearchParams($page.url.searchParams);
		window.location.href = `?/exportarExcel&${qs}`;
	}

	let viewingCita = $state<CitaConPaciente | null>(null);
	let cancellingCita = $state<CitaConPaciente | null>(null);
	let reschedulingCita = $state<CitaConPaciente | null>(null);

	async function loadRescheduleSlots(
		doctorId: string,
		fecha: string,
		esNuevo: boolean
	): Promise<{ slots: TimeSlot[]; duracion: 30 | 60 }> {
		const fd = new FormData();
		fd.set('doctorId', doctorId);
		fd.set('fecha', fecha);
		fd.set('esNuevo', String(esNuevo));
		const res = await fetch('?/obtenerSlots', { method: 'POST', body: fd });
		const result = deserialize(await res.text());
		if (result.type === 'success' && result.data) {
			const d = result.data as Record<string, unknown>;
			return {
				slots: (d.slots as TimeSlot[]) ?? [],
				duracion: (d.duracion as 30 | 60) ?? 30
			};
		}
		return { slots: [], duracion: 30 };
	}
</script>

<svelte:head>
	<title>Gestión de Citas — Analista</title>
</svelte:head>

<div class="space-y-4 sm:space-y-5 animate-fade-in-up">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Gestión de Citas</h1>
			<p class="text-xs text-ink-muted mt-0.5">Vista de Analista</p>
		</div>
		<Button variant="ghost" size="sm" onclick={exportar}>Exportar CSV</Button>
	</div>

	<!-- KPI Cards — Fila principal -->
	<AppointmentAnalystKpiCards stats={data.stats} />

	<!-- Breakdown BI (toggle + cards) -->
	<AppointmentAnalystBreakdown stats={data.stats} />

	<!-- Filtros -->
	<div class="bg-surface rounded-xl border border-border p-3 sm:p-4">
		<AppointmentFilters
			doctores={data.doctores}
			especialidades={data.especialidades}
			value={data.filters}
			onchange={applyFilters}
		/>
	</div>

	<!-- Tabla -->
	<AppointmentAnalystTable
		items={data.citas.items}
		{pagination}
		onView={(c) => { viewingCita = c; }}
		onCancel={(c) => { cancellingCita = c; }}
		onPageChange={(p) => changePage(p)}
		onPageSizeChange={(ps) => changePage(1, ps)}
	/>
</div>

<!-- Modal de detalle de cita -->
{#if viewingCita}
	<AppointmentDetailDialog
		cita={viewingCita}
		onClose={() => { viewingCita = null; }}
		onReschedule={(c) => { reschedulingCita = c; viewingCita = null; }}
		onCancel={(c) => { cancellingCita = c; viewingCita = null; }}
	/>
{/if}

<!-- Modal de confirmación de cancelación -->
{#if cancellingCita}
	<AppointmentCancelDialog
		cita={cancellingCita}
		onClose={() => { cancellingCita = null; }}
	/>
{/if}

<!-- Modal de reagendamiento -->
{#if reschedulingCita}
	<AppointmentRescheduleDialog
		cita={reschedulingCita}
		doctores={data.doctores}
		onClose={() => { reschedulingCita = null; }}
		loadSlots={loadRescheduleSlots}
	/>
{/if}

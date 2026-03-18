<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { AppointmentFilters as AppointmentFiltersType, CitaConPaciente } from '$shared/types/appointments.js';
	import type { DataTableColumn, RowAction } from '$shared/components/table/types.js';
	// DataTable requires T extends Record<string,unknown>; cast CitaConPaciente to satisfy it
	type CitaRow = CitaConPaciente & Record<string, unknown>;
	import AppointmentFilters from '$shared/components/appointments/AppointmentFilters.svelte';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import StatCard from '$shared/components/card/StatCard.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';

	let { data }: { data: PageData } = $props();

	function applyFilters(filters: AppointmentFiltersType) {
		const qs = new URLSearchParams();
		if (filters.fecha) qs.set('fecha', filters.fecha);
		if (filters.doctorId) qs.set('doctorId', String(filters.doctorId));
		if (filters.especialidadId) qs.set('especialidadId', String(filters.especialidadId));
		if (filters.estado) qs.set('estado', filters.estado);
		if (filters.search) qs.set('search', filters.search);
		qs.set('page', '1');
		goto(`?${qs}`, { replaceState: true });
	}

	function changePage(p: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		goto(`?${qs}`, { replaceState: true });
	}

	const statsTotal = $derived(data.citas.total);
	const statsPendientes = $derived(
		(data.citas.data as CitaConPaciente[]).filter((c) => c.estado === 'pendiente').length
	);
	const statsAtendidas = $derived(
		(data.citas.data as CitaConPaciente[]).filter((c) => c.estado === 'atendida').length
	);

	function exportar() {
		const qs = new URLSearchParams($page.url.searchParams);
		window.location.href = `?/exportarExcel&${qs}`;
	}

	function formatFecha(fecha: string) {
		const [y, m, d] = fecha.split('-');
		return `${d}/${m}/${y}`;
	}

	async function cancelarCita(cita: CitaConPaciente) {
		if (!confirm('¿Cancelar esta cita?')) return;
		const fd = new FormData();
		fd.set('citaId', String(cita.id));
		await fetch('?/cancelarCita', { method: 'POST', body: fd });
		await invalidateAll();
	}
</script>

<!-- Snippets para columnas del DataTable -->
{#snippet pacienteCell(_v: unknown, row: CitaRow)}
	<div class="flex items-center gap-2.5">
		<div class="w-8 h-8 rounded-full bg-viking-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
			{row.paciente.nombre[0]}{row.paciente.apellido[0]}
		</div>
		<div class="min-w-0">
			<p class="font-medium text-ink truncate">
				{row.paciente.nombre} {row.paciente.apellido}
				{#if row.es_primera_vez}<span class="ml-1 text-[10px] text-viking-600 font-semibold">★ 1ra</span>{/if}
			</p>
			<p class="text-xs text-ink-muted">NHM {row.paciente.nhm}</p>
		</div>
	</div>
{/snippet}

{#snippet doctorCell(_v: unknown, row: CitaRow)}
	<div>
		<p class="font-medium text-ink">Dr. {row.doctor.apellido}</p>
		<p class="text-xs text-ink-muted">{row.doctor.especialidad?.nombre ?? '—'}</p>
	</div>
{/snippet}

{#snippet fechaCell(v: unknown)}
	<span class="font-mono text-sm">{formatFecha(String(v))}</span>
{/snippet}

{#snippet estadoCell(_v: unknown, row: CitaRow)}
	<AppointmentStatusBadge status={row.estado} />
{/snippet}

{#snippet cancelIcon()}
	<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
	</svg>
{/snippet}

<svelte:head>
	<title>Gestión de Citas — Analista</title>
</svelte:head>

<div class="space-y-6 animate-fade-in-up">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-display text-xl font-bold text-ink">Gestión de Citas</h1>
			<p class="text-sm text-ink-muted mt-0.5">Vista de Analista</p>
		</div>
		<Button variant="ghost" onclick={exportar}>Exportar CSV</Button>
	</div>

	<!-- Stats -->
	<div class="flex flex-wrap gap-4">
		<StatCard title="Total filtradas" value={String(statsTotal)} />
		<StatCard title="Pendientes (página)" value={String(statsPendientes)} />
		<StatCard title="Atendidas (página)" value={String(statsAtendidas)} />
	</div>

	<!-- Filtros -->
	<div class="bg-surface rounded-xl border border-border p-4">
		<AppointmentFilters
			doctores={data.doctores}
			especialidades={data.especialidades}
			value={data.filters}
			onchange={applyFilters}
		/>
	</div>

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'paciente_id', header: 'Paciente', render: pacienteCell },
				{ key: 'doctor_id',   header: 'Doctor',   render: doctorCell },
				{ key: 'fecha',       header: 'Fecha',    width: '110px', render: fechaCell },
				{ key: 'hora_inicio', header: 'Hora',     width: '80px'  },
				{ key: 'estado',      header: 'Estado',   width: '130px', align: 'center', render: estadoCell },
			] satisfies DataTableColumn<CitaRow>[]}
			data={data.citas.data as CitaRow[]}
			rowKey="id"
			emptyMessage="No hay citas que coincidan con los filtros aplicados."
			actions={[
				{
					icon: cancelIcon,
					label: 'Cancelar cita',
					variant: 'danger',
					hoverOnly: false,
					onclick: (row) => {
						if (row.estado === 'pendiente' || row.estado === 'confirmada') {
							cancelarCita(row as CitaConPaciente);
						}
					}
				}
			] satisfies RowAction<CitaRow>[]}
		/>

		<!-- Paginación -->
		{#if data.citas.total > data.citas.pageSize}
			<div class="flex items-center justify-between px-4 py-3 border-t border-border">
				<span class="text-xs text-ink-muted">
					{(data.citas.page - 1) * data.citas.pageSize + 1}–{Math.min(data.citas.page * data.citas.pageSize, data.citas.total)} de {data.citas.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" disabled={data.citas.page <= 1} onclick={() => changePage(data.citas.page - 1)}>
						Anterior
					</Button>
					<Button variant="ghost" disabled={!data.citas.hasNext} onclick={() => changePage(data.citas.page + 1)}>
						Siguiente
					</Button>
				</div>
			</div>
		{/if}
	</Card>
</div>

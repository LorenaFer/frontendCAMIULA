<script lang="ts">
	import type { CitaConPaciente, PaginationMeta } from '$domain/appointments/types.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	import AppointmentStatusBadge from '$domain/appointments/components/widgets/AppointmentStatusBadge.svelte';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import PaginationBar from '$shared/components/table/PaginationBar.svelte';

	type CitaRow = CitaConPaciente & Record<string, unknown>;

	let {
		items,
		pagination,
		onView,
		onCancel,
		onPageChange,
		onPageSizeChange
	}: {
		items: CitaConPaciente[];
		pagination: PaginationMeta;
		onView: (cita: CitaConPaciente) => void;
		onCancel: (cita: CitaConPaciente) => void;
		onPageChange: (page: number) => void;
		onPageSizeChange: (pageSize: number) => void;
	} = $props();

	function formatFecha(fecha: string) {
		const [y, m, d] = fecha.split('-');
		return `${d}/${m}/${y}`;
	}

	const citaMenu: RowMenuItem<CitaRow>[] = [
		{ label: 'Ver detalle', icon: 'view', onclick: (row) => { onView({ ...row } as unknown as CitaConPaciente); } },
		{ label: 'Cancelar cita', icon: 'delete', variant: 'danger', onclick: (row) => {
			const cita = row as unknown as CitaConPaciente;
			if (cita.estado === 'pendiente' || cita.estado === 'confirmada') {
				onCancel({ ...cita });
			}
		}}
	];
</script>

{#snippet pacienteCell(_v: unknown, row: CitaRow)}
	<div class="flex items-center gap-2.5">
		<div class="w-8 h-8 rounded-full bg-viking-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
			{row.paciente.nombre[0]}{row.paciente.apellido[0]}
		</div>
		<div class="min-w-0">
			<p class="font-medium text-ink truncate">
				{row.paciente.nombre} {row.paciente.apellido}
				{#if row.es_primera_vez}<span class="ml-1 text-xs text-viking-600 font-semibold">★ 1ra</span>{/if}
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

<Card padding="none">
	<DataTable
		columns={[
			{ key: 'paciente_id', header: 'Paciente', render: pacienteCell },
			{ key: 'doctor_id',   header: 'Doctor',   render: doctorCell },
			{ key: 'fecha',       header: 'Fecha',    width: '110px', render: fechaCell },
			{ key: 'hora_inicio', header: 'Hora',     width: '80px'  },
			{ key: 'estado',      header: 'Estado',   width: '130px', align: 'center', render: estadoCell },
		] satisfies DataTableColumn<CitaRow>[]}
		data={items as CitaRow[]}
		rowKey="id"
		rowMenu={citaMenu}
		emptyMessage="No hay citas que coincidan con los filtros aplicados."
	/>

	<PaginationBar
		page={pagination.page}
		total={pagination.total}
		pageSize={pagination.page_size}
		pageSizeOptions={[10, 25, 50, 100]}
		{onPageChange}
		{onPageSizeChange}
	/>
</Card>

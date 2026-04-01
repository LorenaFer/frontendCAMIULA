<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { AppointmentFilters as AppointmentFiltersType, CitaConPaciente } from '$shared/types/appointments.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	type CitaRow = CitaConPaciente & Record<string, unknown>;
	import AppointmentFilters from '$shared/components/appointments/AppointmentFilters.svelte';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import StatCard from '$shared/components/card/StatCard.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Sparkline from '$shared/components/sparkline/Sparkline.svelte';
	import DoctorAvailabilityCalendar from '$shared/components/appointments/DoctorAvailabilityCalendar.svelte';
	import TimeSlotPicker from '$shared/components/appointments/TimeSlotPicker.svelte';
	import type { TimeSlot, DoctorOption } from '$shared/types/appointments.js';
	import { enhance, deserialize } from '$app/forms';
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';

	let { data }: { data: PageData } = $props();

	let showBreakdown = $state(false);

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

	function changePage(p: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		goto(`?${qs}`, { replaceState: true });
	}

	// ─── Métricas derivadas ──────────────────────────────────
	const stats = $derived(data.stats);

	const atendidas = $derived(stats.byStatus['atendida'] ?? 0);
	const noAsistio = $derived(stats.byStatus['no_asistio'] ?? 0);
	const canceladas = $derived(stats.byStatus['cancelada'] ?? 0);
	const pendientes = $derived(stats.byStatus['pendiente'] ?? 0);
	const confirmadas = $derived(stats.byStatus['confirmada'] ?? 0);

	const completionRate = $derived(
		stats.total > 0 ? Math.round((atendidas / stats.total) * 100) : 0
	);
	const noShowRate = $derived(
		stats.total > 0 ? Math.round((noAsistio / stats.total) * 100) : 0
	);
	const cancellationRate = $derived(
		stats.total > 0 ? Math.round((canceladas / stats.total) * 100) : 0
	);
	const firstTimeRate = $derived(
		stats.total > 0 ? Math.round((stats.firstTimeCount / stats.total) * 100) : 0
	);

	const patientTypeLabels: Record<string, string> = {
		empleado: 'Empleados',
		estudiante: 'Estudiantes',
		profesor: 'Profesores',
		tercero: 'Terceros'
	};

	const topSpecialty = $derived(stats.bySpecialty[0]?.name ?? '—');
	const peakHour = $derived(
		stats.peakHours.length > 0
			? stats.peakHours.reduce((a, b) => (b.count > a.count ? b : a)).hour
			: '—'
	);

	function exportar() {
		const qs = new URLSearchParams($page.url.searchParams);
		window.location.href = `?/exportarExcel&${qs}`;
	}

	function formatFecha(fecha: string) {
		const [y, m, d] = fecha.split('-');
		return `${d}/${m}/${y}`;
	}

	const tenantId = $derived($page.params.tenantId);
	let viewingCita = $state<CitaConPaciente | null>(null);
	let cancellingCita = $state<CitaConPaciente | null>(null);

	// Reagendamiento
	let reschedulingCita = $state<CitaConPaciente | null>(null);
	let rescheduleDate = $state('');
	let rescheduleSlots = $state<TimeSlot[]>([]);
	let rescheduleSelectedSlot = $state('');
	let rescheduleSlotDuracion = $state<30 | 60>(30);
	let rescheduleLoadingSlots = $state(false);

	const rescheduleMinDate = $derived(() => {
		const d = new Date();
		d.setDate(d.getDate() + 2);
		return d.toISOString().slice(0, 10);
	});

	const rescheduleDoctor = $derived(
		reschedulingCita ? data.doctores.find((d: DoctorOption) => d.id === reschedulingCita!.doctor_id) ?? null : null
	);

	const rescheduleAvailableDates = $derived.by(() => {
		if (!rescheduleDoctor || !rescheduleDoctor.dias_trabajo?.length) return [];
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth() + 1;
		const daysInMonth = new Date(year, month, 0).getDate();
		const mo = String(month).padStart(2, '0');
		const minD = rescheduleMinDate();
		const dates: string[] = [];
		for (let d = 1; d <= daysInMonth; d++) {
			const fecha = `${year}-${mo}-${String(d).padStart(2, '0')}`;
			if (fecha < minD) continue;
			const dow = new Date(fecha + 'T12:00:00').getDay();
			const dayOfWeek = dow === 0 ? 7 : dow;
			if (rescheduleDoctor.dias_trabajo.includes(dayOfWeek)) dates.push(fecha);
		}
		return dates;
	});

	async function loadRescheduleSlots(date: string) {
		rescheduleDate = date;
		rescheduleSelectedSlot = '';
		rescheduleSlots = [];
		if (!reschedulingCita) return;

		rescheduleLoadingSlots = true;
		try {
			const fd = new FormData();
			fd.set('doctorId', reschedulingCita.doctor_id);
			fd.set('fecha', date);
			fd.set('esNuevo', String(reschedulingCita.es_primera_vez));
			const res = await fetch('?/obtenerSlots', { method: 'POST', body: fd });
			const result = deserialize(await res.text());
			if (result.type === 'success' && result.data) {
				const d = result.data as Record<string, unknown>;
				rescheduleSlots = (d.slots as TimeSlot[]) ?? [];
				rescheduleSlotDuracion = (d.duracion as 30 | 60) ?? 30;
			}
		} catch { /* ignore */ } finally {
			rescheduleLoadingSlots = false;
		}
	}

	const citaMenu: RowMenuItem<CitaRow>[] = [
		{ label: 'Ver detalle', icon: 'view', onclick: (row) => { viewingCita = { ...row } as unknown as CitaConPaciente; } },
		{ label: 'Cancelar cita', icon: 'delete', variant: 'danger', onclick: (row) => {
			const cita = row as unknown as CitaConPaciente;
			if (cita.estado === 'pendiente' || cita.estado === 'confirmada') {
				cancellingCita = { ...cita };
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


<!-- Sparkline snippets para StatCards -->
{#snippet trendSparkline()}
	{#if stats.dailyTrend.length >= 2}
		<Sparkline data={stats.dailyTrend} color="blue" />
	{/if}
{/snippet}

{#snippet noShowSparkBars()}
	{#if stats.peakHours.length >= 2}
		<Sparkline data={stats.peakHours.map(h => h.count)} variant="bars" color="warning" />
	{/if}
{/snippet}

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
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		<StatCard
			title="Total Citas"
			value={stats.total}
			subtitle={pendientes + confirmadas > 0 ? `${pendientes + confirmadas} en agenda` : undefined}
			accent="viking"
			visualization={trendSparkline}
		/>
		<StatCard
			title="Tasa de Atención"
			value="{completionRate}%"
			subtitle="{atendidas} de {stats.total} atendidas"
			accent="sage"
			trend={completionRate >= 70 ? { value: 'Buena', direction: 'up' } : completionRate > 0 ? { value: 'Baja', direction: 'down' } : undefined}
		/>
		<StatCard
			title="Inasistencias"
			value="{noShowRate}%"
			subtitle="{noAsistio} no asistieron"
			accent={noShowRate > 15 ? 'honey' : undefined}
			trend={noShowRate > 15 ? { value: 'Alto', direction: 'up' } : noShowRate > 0 ? { value: `${noAsistio}`, direction: 'neutral' } : undefined}
		/>
		<StatCard
			title="Cancelaciones"
			value="{cancellationRate}%"
			subtitle="{canceladas} canceladas"
			trend={cancellationRate > 20 ? { value: 'Alto', direction: 'up' } : undefined}
		/>
	</div>

	<!-- Breakdown toggle -->
	<button
		type="button"
		class="flex items-center gap-1.5 text-xs font-medium text-viking-600 dark:text-viking-400 hover:underline"
		onclick={() => (showBreakdown = !showBreakdown)}
	>
		<svg
			class="w-3.5 h-3.5 transition-transform duration-200 {showBreakdown ? 'rotate-180' : ''}"
			fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
		</svg>
		{showBreakdown ? 'Ocultar' : 'Ver'} desglose detallado
	</button>

	<!-- Breakdown Cards (colapsable) -->
	{#if showBreakdown}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in-up">

			<!-- Distribución por especialidad -->
			<Card padding="lg">
				<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
					Por Especialidad
				</h3>
				<div class="space-y-2">
					{#each stats.bySpecialty as spec (spec.name)}
						{@const pct = stats.total > 0 ? Math.round((spec.count / stats.total) * 100) : 0}
						<div class="flex items-center gap-3">
							<span class="text-xs text-ink flex-1 truncate">{spec.name}</span>
							<div class="w-24 h-1.5 bg-canvas-subtle rounded-full overflow-hidden">
								<div class="h-full bg-viking-500 rounded-full" style:width="{pct}%"></div>
							</div>
							<span class="text-xs font-mono text-ink-muted w-8 text-right">{spec.count}</span>
						</div>
					{/each}
					{#if stats.bySpecialty.length === 0}
						<p class="text-xs text-ink-subtle">Sin datos</p>
					{/if}
				</div>
			</Card>

			<!-- Carga por doctor -->
			<Card padding="lg">
				<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
					Carga por Doctor
				</h3>
				<div class="space-y-2.5">
					{#each stats.byDoctor as doc (doc.name)}
						{@const atendidasPct = doc.count > 0 ? Math.round((doc.atendidas / doc.count) * 100) : 0}
						<div>
							<div class="flex items-center justify-between mb-0.5">
								<span class="text-xs font-medium text-ink">{doc.name}</span>
								<span class="text-xs text-ink-subtle">{doc.specialty}</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="flex-1 h-1.5 bg-canvas-subtle rounded-full overflow-hidden">
									<div class="h-full bg-sage-500 rounded-full" style:width="{atendidasPct}%"></div>
								</div>
								<span class="text-xs font-mono text-ink-muted w-16 text-right">
									{doc.atendidas}/{doc.count}
								</span>
							</div>
						</div>
					{/each}
					{#if stats.byDoctor.length === 0}
						<p class="text-xs text-ink-subtle">Sin datos</p>
					{/if}
				</div>
			</Card>

			<!-- Insights mixtos -->
			<Card padding="lg">
				<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
					Insights
				</h3>
				<div class="space-y-3">
					<!-- Pacientes nuevos vs retorno -->
					<div>
						<div class="flex items-center justify-between mb-1.5">
							<span class="text-xs text-ink-muted">Pacientes nuevos vs retorno</span>
							<span class="text-xs font-semibold text-ink">{firstTimeRate}% nuevos</span>
						</div>
						<div class="flex h-2 rounded-full overflow-hidden">
							{#if stats.firstTimeCount > 0}
								<div
									class="bg-viking-500 h-full"
									style:width="{firstTimeRate}%"
									title="Primera vez: {stats.firstTimeCount}"
								></div>
							{/if}
							{#if stats.returningCount > 0}
								<div
									class="bg-iris-400 h-full"
									style:width="{100 - firstTimeRate}%"
									title="Retorno: {stats.returningCount}"
								></div>
							{/if}
						</div>
						<div class="flex justify-between mt-1">
							<span class="text-xs text-viking-600 dark:text-viking-400">Nuevos ({stats.firstTimeCount})</span>
							<span class="text-xs text-iris-600 dark:text-iris-400">Retorno ({stats.returningCount})</span>
						</div>
					</div>

					<!-- Tipo de paciente -->
					<div>
						<span class="text-xs text-ink-muted block mb-1.5">Por tipo de paciente</span>
						<div class="flex flex-wrap gap-1.5">
							{#each Object.entries(stats.byPatientType) as [tipo, count] (tipo)}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-canvas-subtle text-ink border border-border/50">
									{patientTypeLabels[tipo] ?? tipo}
									<span class="font-mono font-bold text-ink">{count}</span>
								</span>
							{/each}
						</div>
					</div>

					<!-- Hora pico y top especialidad -->
					<div class="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
						<div>
							<span class="text-xs text-ink-subtle block">Hora pico</span>
							<span class="text-sm font-semibold text-ink font-mono">{peakHour}</span>
						</div>
						<div>
							<span class="text-xs text-ink-subtle block">Top especialidad</span>
							<span class="text-sm font-semibold text-ink">{topSpecialty}</span>
						</div>
					</div>

					<!-- Distribución por hora -->
					{#if stats.peakHours.length >= 2}
						<div>
							<span class="text-xs text-ink-subtle block mb-1">Distribución horaria</span>
							<div class="flex items-end gap-0.5 h-8">
								{#each stats.peakHours as h (h.hour)}
									{@const maxCount = Math.max(...stats.peakHours.map(x => x.count))}
									{@const heightPct = maxCount > 0 ? (h.count / maxCount) * 100 : 0}
									<div class="flex-1 flex flex-col items-center gap-0.5">
										<div
											class="w-full bg-viking-400 dark:bg-viking-600 rounded-sm min-h-[2px]"
											style:height="{heightPct}%"
											title="{h.hour}: {h.count} citas"
										></div>
										<span class="text-xs text-ink-subtle">{h.hour.split(':')[0]}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</Card>
		</div>
	{/if}

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
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'paciente_id', header: 'Paciente', render: pacienteCell },
				{ key: 'doctor_id',   header: 'Doctor',   render: doctorCell },
				{ key: 'fecha',       header: 'Fecha',    width: '110px', render: fechaCell },
				{ key: 'hora_inicio', header: 'Hora',     width: '80px'  },
				{ key: 'estado',      header: 'Estado',   width: '130px', align: 'center', render: estadoCell },
			] satisfies DataTableColumn<CitaRow>[]}
			data={data.citas.items as CitaRow[]}
			rowKey="id"
			rowMenu={citaMenu}
			emptyMessage="No hay citas que coincidan con los filtros aplicados."
		/>

		<!-- Paginación -->
		{#if data.citas.pagination.total > data.citas.pagination.page_size}
			<div class="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-t border-border">
				<span class="text-xs text-ink-muted">
					{(data.citas.pagination.page - 1) * data.citas.pagination.page_size + 1}–{Math.min(data.citas.pagination.page * data.citas.pagination.page_size, data.citas.pagination.total)} de {data.citas.pagination.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" disabled={data.citas.pagination.page <= 1} onclick={() => changePage(data.citas.pagination.page - 1)}>
						Anterior
					</Button>
					<Button variant="ghost" size="sm" disabled={!data.citas.pagination.has_next} onclick={() => changePage(data.citas.pagination.page + 1)}>
						Siguiente
					</Button>
				</div>
			</div>
		{/if}
	</Card>
</div>

<!-- Modal de detalle de cita -->
{#if viewingCita}
	{@const c = viewingCita}
	<Dialog open={true} onClose={() => { viewingCita = null; }} size="md">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal">{formatFecha(c.fecha)} · {c.hora_inicio}–{c.hora_fin}</p>
			<h2 class="text-base font-semibold text-ink">Detalle de cita</h2>
		</DialogHeader>
		<DialogBody>
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<p class="text-ink-muted">Paciente</p>
					<p class="font-medium text-ink">{c.paciente.nombre} {c.paciente.apellido}</p>
					<p class="text-xs text-ink-muted">NHM {c.paciente.nhm} · {c.paciente.cedula}</p>
				</div>
				<div>
					<p class="text-ink-muted">Estado</p>
					<AppointmentStatusBadge status={c.estado} />
				</div>
				<div>
					<p class="text-ink-muted">Doctor</p>
					<p class="font-medium text-ink">Dr. {c.doctor.nombre} {c.doctor.apellido}</p>
					<p class="text-xs text-ink-muted">{c.doctor.especialidad?.nombre ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Duración</p>
					<p class="font-medium text-ink">{c.duracion_min} min{c.es_primera_vez ? ' · Primera vez' : ''}</p>
				</div>
				{#if c.motivo_consulta}
					<div class="col-span-2">
						<p class="text-ink-muted">Motivo</p>
						<p class="text-ink">{c.motivo_consulta}</p>
					</div>
				{/if}
				{#if c.observaciones}
					<div class="col-span-2">
						<p class="text-ink-muted">Observaciones</p>
						<p class="text-ink">{c.observaciones}</p>
					</div>
				{/if}
			</div>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={() => { viewingCita = null; }}>Cerrar</Button>
			{#if c.estado === 'pendiente' || c.estado === 'confirmada'}
				<Button type="button" variant="soft" size="md" onclick={() => {
					reschedulingCita = c;
					rescheduleDate = '';
					rescheduleSlots = [];
					rescheduleSelectedSlot = '';
					viewingCita = null;
				}}>Reagendar</Button>
				<Button type="button" variant="danger" size="md" onclick={() => { cancellingCita = c; viewingCita = null; }}>Cancelar cita</Button>
			{/if}
		</DialogFooter>
	</Dialog>
{/if}

<!-- Modal de confirmación de cancelación -->
{#if cancellingCita}
	{@const c = cancellingCita}
	<Dialog open={true} onClose={() => { cancellingCita = null; }} size="sm">
		<DialogHeader>
			<h2 class="text-base font-semibold text-ink">Cancelar cita</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/cancelarCita"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						const nombre = cancellingCita?.paciente?.nombre ?? '';
						cancellingCita = null;
						await invalidateAll();
						toastSuccess('Cita cancelada', `La cita de ${nombre} fue cancelada correctamente.`);
					} else {
						toastError('Error al cancelar', 'No se pudo cancelar la cita. Intente nuevamente.');
					}
				};
			}}
		>
			<input type="hidden" name="citaId" value={c.id} />
			<DialogBody>
				<p class="text-sm text-ink mb-3">¿Está seguro de que desea cancelar esta cita?</p>
				<div class="bg-canvas-subtle rounded-lg border border-border/60 p-3 space-y-1 text-sm">
					<p class="font-medium text-ink">{c.paciente.nombre} {c.paciente.apellido}</p>
					<p class="text-ink-muted">{formatFecha(c.fecha)} · {c.hora_inicio}–{c.hora_fin}</p>
					<p class="text-ink-muted">Dr. {c.doctor.nombre} {c.doctor.apellido} — {c.doctor.especialidad?.nombre}</p>
				</div>
				<p class="text-sm text-honey-700 dark:text-honey-400 mt-3">Esta acción no se puede deshacer.</p>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { cancellingCita = null; }}>No cancelar</Button>
				<Button type="submit" variant="danger" size="md">Sí, cancelar cita</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}

<!-- Modal de reagendamiento -->
{#if reschedulingCita}
	{@const c = reschedulingCita}
	{@const selectedSlotObj = rescheduleSlots.find((s) => s.hora_inicio === rescheduleSelectedSlot)}
	<Dialog open={true} onClose={() => { reschedulingCita = null; }} size="lg">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal">{c.paciente.nombre} {c.paciente.apellido} — Dr. {c.doctor.nombre} {c.doctor.apellido}</p>
			<h2 class="text-base font-semibold text-ink">Reagendar cita</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/reagendarCita"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						const nombre = reschedulingCita?.paciente?.nombre ?? '';
						const fecha = rescheduleDate;
						reschedulingCita = null;
						await invalidateAll();
						toastSuccess('Cita reagendada', `La cita de ${nombre} fue movida al ${fecha}.`);
					} else {
						toastError('Error al reagendar', 'No se pudo reagendar la cita. Intente nuevamente.');
					}
				};
			}}
		>
			<input type="hidden" name="citaId" value={c.id} />
			<input type="hidden" name="fecha" value={rescheduleDate} />
			<input type="hidden" name="hora_inicio" value={rescheduleSelectedSlot} />
			<input type="hidden" name="hora_fin" value={selectedSlotObj?.hora_fin ?? ''} />
			<input type="hidden" name="duracion" value={rescheduleSlotDuracion} />

			<DialogBody>
				<div class="space-y-4">
					<div class="bg-canvas-subtle rounded-lg border border-border/60 p-3 text-sm">
						<p class="text-ink-muted">Cita actual: <strong class="text-ink">{formatFecha(c.fecha)} · {c.hora_inicio}–{c.hora_fin}</strong></p>
					</div>

						<div>
						<p class="text-sm font-semibold text-ink mb-2">Seleccione nueva fecha</p>
						<DoctorAvailabilityCalendar
							year={new Date().getFullYear()}
							month={new Date().getMonth() + 1}
							availableDates={rescheduleAvailableDates}
							minDate={rescheduleMinDate()}
							selected={rescheduleDate}
							onSelect={loadRescheduleSlots}
							onMonthChange={() => {}}
						/>
					</div>

					{#if rescheduleDate}
						<div>
							<p class="text-sm font-semibold text-ink mb-2">Seleccione horario {rescheduleLoadingSlots ? '(cargando...)' : ''}</p>
							<TimeSlotPicker
								slots={rescheduleSlots}
								selected={rescheduleSelectedSlot}
								onSelect={(slot: TimeSlot) => { rescheduleSelectedSlot = slot.hora_inicio; }}
							/>
						</div>
					{/if}
				</div>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { reschedulingCita = null; }}>Cancelar</Button>
				<Button type="submit" variant="primary" size="md" disabled={!rescheduleSelectedSlot}>
					Confirmar reagendamiento
				</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}

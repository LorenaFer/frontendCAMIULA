<script lang="ts">
	import type { DoctorOption, Especialidad, AppointmentFilters, CitaEstado } from '$shared/types/appointments.js';
	import Input from '$shared/components/input/Input.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import Button from '$shared/components/button/Button.svelte';

	interface Props {
		doctores: DoctorOption[];
		especialidades: Especialidad[];
		value: AppointmentFilters;
		onchange: (filters: AppointmentFilters) => void;
		class?: string;
	}

	let { doctores, especialidades, value, onchange, class: className = '' }: Props = $props();

	let local = $state<AppointmentFilters>({ ...value });

	const estadoOpciones = [
		{ value: '', label: 'Todos los estados' },
		{ value: 'pendiente', label: 'Pendiente' },
		{ value: 'confirmada', label: 'Confirmada' },
		{ value: 'atendida', label: 'Atendida' },
		{ value: 'cancelada', label: 'Cancelada' },
		{ value: 'no_asistio', label: 'No asistió' }
	];

	const doctorOpciones = $derived([
		{ value: '', label: 'Todos los doctores' },
		...doctores.map((d) => ({ value: String(d.id), label: d.nombreCompleto }))
	]);

	const especialidadOpciones = $derived([
		{ value: '', label: 'Todas las especialidades' },
		...especialidades.map((e) => ({ value: String(e.id), label: e.nombre }))
	]);

	function apply() {
		onchange({ ...local });
	}

	function clear() {
		local = {};
		onchange({});
	}
</script>

<div class="flex flex-wrap gap-3 items-end {className}">
	<div class="flex-1 min-w-40">
		<Input
			label="Fecha"
			type="date"
			value={local.fecha ?? ''}
			oninput={(e) => {
				local.fecha = (e.target as HTMLInputElement).value || undefined;
			}}
		/>
	</div>

	<div class="flex-1 min-w-40">
		<Select
			label="Especialidad"
			options={especialidadOpciones}
			value={local.especialidadId ? String(local.especialidadId) : ''}
			onchange={(v) => { if (typeof v === 'string') local.especialidadId = v ? Number(v) : undefined; }}
		/>
	</div>

	<div class="flex-1 min-w-40">
		<Select
			label="Doctor"
			options={doctorOpciones}
			value={local.doctorId ? String(local.doctorId) : ''}
			onchange={(v) => { if (typeof v === 'string') local.doctorId = v ? Number(v) : undefined; }}
		/>
	</div>

	<div class="flex-1 min-w-40">
		<Select
			label="Estado"
			options={estadoOpciones}
			value={local.estado ?? ''}
			onchange={(v) => { if (typeof v === 'string') local.estado = (v as CitaEstado) || undefined; }}
		/>
	</div>

	<div class="flex-1 min-w-40">
		<Input
			label="Buscar paciente"
			type="search"
			placeholder="Nombre, apellido o cédula"
			value={local.search ?? ''}
			oninput={(e) => {
				local.search = (e.target as HTMLInputElement).value || undefined;
			}}
		/>
	</div>

	<div class="flex gap-2">
		<Button variant="primary" onclick={apply}>Filtrar</Button>
		<Button variant="ghost" onclick={clear}>Limpiar</Button>
	</div>
</div>

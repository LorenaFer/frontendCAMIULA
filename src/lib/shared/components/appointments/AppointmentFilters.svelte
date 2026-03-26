<script lang="ts">
	import type { DoctorOption, Especialidad, AppointmentFilters, CitaEstado } from '$shared/types/appointments.js';
	import Input from '$shared/components/input/Input.svelte';
	import DateInput from '$shared/components/input/DateInput.svelte';
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
		...doctores.map((d) => ({ value: d.id, label: d.nombre_completo }))
	]);

	const especialidadOpciones = $derived([
		{ value: '', label: 'Todas las especialidades' },
		...especialidades.map((e) => ({ value: e.id, label: e.nombre }))
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
		<DateInput
			label="Fecha"
			value={local.fecha ?? ''}
			oninput={(e) => {
				local.fecha = e.target.value || undefined;
			}}
		/>
	</div>

	<div class="flex-1 min-w-40">
		<Select
			label="Especialidad"
			options={especialidadOpciones}
			value={local.especialidad_id ?? ''}
			onchange={(v) => { if (typeof v === 'string') local.especialidad_id = v || undefined; }}
		/>
	</div>

	<div class="flex-1 min-w-40">
		<Select
			label="Doctor"
			options={doctorOpciones}
			value={local.doctor_id ?? ''}
			onchange={(v) => { if (typeof v === 'string') local.doctor_id = v || undefined; }}
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

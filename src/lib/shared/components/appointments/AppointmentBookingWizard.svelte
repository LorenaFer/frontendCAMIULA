<script lang="ts">
	/**
	 * AppointmentBookingWizard — Wizard público de agendamiento (5 pasos).
	 *
	 * Usa Stepper directamente (NO MultiStepDialog) porque es full-page,
	 * no un modal. El estado del wizard se gestiona localmente con $state.
	 *
	 * Pasos:
	 *   1. Identificación (NHM o cédula)
	 *   2. Registro (si el paciente no existe)
	 *   3. Selección de doctor y especialidad
	 *   4. Selección de fecha y horario
	 *   5. Confirmación
	 */
	import type { DoctorOption, Especialidad, TimeSlot, PacientePublic } from '$shared/types/appointments.js';
	import Stepper from '$shared/components/stepper/Stepper.svelte';
	import type { Step } from '$shared/components/stepper/types.js';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import DoctorAvailabilityCalendar from './DoctorAvailabilityCalendar.svelte';
	import TimeSlotPicker from './TimeSlotPicker.svelte';

	interface Props {
		doctores: DoctorOption[];
		especialidades: Especialidad[];
		tenantId: string;
		minDate: string;
		class?: string;
	}

	let { doctores, especialidades, tenantId, minDate, class: className = '' }: Props = $props();

	// ─── Estado del wizard ────────────────────────────────────

	let currentStep = $state(0);
	let loading = $state(false);
	let formError = $state('');

	// Paso 1 — Identificación
	let queryType = $state<'nhm' | 'cedula'>('cedula');
	let query = $state('');
	let paciente = $state<PacientePublic | null>(null);
	let esNuevo = $state(false);

	// Paso 2 — Registro
	let regNombre = $state('');
	let regApellido = $state('');
	let regCedula = $state('');
	let regRelacion = $state('empleado');
	let regParentesco = $state('');
	let regTitularCedula = $state('');
	let regTipoSangre = $state('');
	let regAlergias = $state('');
	let regContacto = $state('');

	// Paso 3 — Doctor
	let selectedEspecialidadId = $state('');
	let selectedDoctorId = $state('');

	const doctoresFiltrados = $derived(
		selectedEspecialidadId
			? doctores.filter((d) => String(d.especialidadId) === selectedEspecialidadId)
			: doctores
	);

	const especialidadOpciones = $derived([
		{ value: '', label: 'Seleccione especialidad' },
		...especialidades.map((e) => ({ value: String(e.id), label: e.nombre }))
	]);

	const doctorOpciones = $derived([
		{ value: '', label: 'Seleccione doctor' },
		...doctoresFiltrados.map((d) => ({ value: String(d.id), label: d.nombreCompleto }))
	]);

	// Paso 4 — Fecha y hora
	const today = new Date();
	let calYear = $state(today.getFullYear());
	let calMonth = $state(today.getMonth() + 1);
	let selectedDate = $state('');
	let slots = $state<TimeSlot[]>([]);
	let selectedSlot = $state('');
	let slotDuracion = $state<30 | 60>(30);
	let loadingSlots = $state(false);

	// Fechas disponibles: derivadas síncronamente de diasTrabajo del doctor
	const availableDates = $derived.by(() => {
		const doctor = doctores.find((d) => String(d.id) === selectedDoctorId);
		if (!doctor || !doctor.diasTrabajo.length) return [];

		const daysInMonth = new Date(calYear, calMonth, 0).getDate();
		const mo = String(calMonth).padStart(2, '0');
		const dates: string[] = [];

		for (let d = 1; d <= daysInMonth; d++) {
			const fecha = `${calYear}-${mo}-${String(d).padStart(2, '0')}`;
			if (fecha < minDate) continue;
			const dow = new Date(fecha + 'T12:00:00').getDay();
			const dayOfWeek = dow === 0 ? 7 : dow;
			if (doctor.diasTrabajo.includes(dayOfWeek)) dates.push(fecha);
		}
		return dates;
	});

	// ─── Pasos del stepper ────────────────────────────────────

	const steps: Step[] = [
		{ id: 'identificacion', title: 'Identificación', description: 'NHM o cédula' },
		{ id: 'datos', title: 'Datos', description: 'Información personal' },
		{ id: 'doctor', title: 'Doctor', description: 'Especialidad y médico' },
		{ id: 'horario', title: 'Horario', description: 'Fecha y hora' },
		{ id: 'confirmar', title: 'Confirmar', description: 'Resumen de la cita' }
	];

	// ─── Navegación ───────────────────────────────────────────

	function next() { if (currentStep < steps.length - 1) currentStep++; }
	function prev() { if (currentStep > 0) { currentStep--; formError = ''; } }


	// ─── Helper: POST JSON al endpoint REST ──────────────────

	async function api<T = unknown>(action: string, body: Record<string, unknown>): Promise<{ ok: boolean; data: T; message: string }> {
		const res = await fetch(`/${tenantId}/agendar`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, ...body })
		});
		const json = await res.json();
		if (json.status === 'success') return { ok: true, data: json.data as T, message: json.message };
		throw Object.assign(new Error(json.message ?? 'Error desconocido'), { httpStatus: res.status });
	}

	// ─── Paso 1: buscar paciente ──────────────────────────────

	async function buscarPaciente() {
		if (!query.trim()) { formError = 'Ingrese su cédula o NHM'; return; }
		formError = '';
		loading = true;
		try {
			const { data } = await api<{ found: boolean; paciente: PacientePublic | null }>('buscarPaciente', { query: query.trim(), queryType });
			if (data.found) {
				paciente = data.paciente;
				esNuevo = false;
				currentStep = 2;
			} else {
				esNuevo = true;
				if (queryType === 'cedula') regCedula = query.trim();
				currentStep = 1;
			}
		} catch (e) {
			formError = e instanceof Error ? e.message : 'Error de conexión. Intente nuevamente.';
		} finally {
			loading = false;
		}
	}

	// ─── Paso 2: registrar paciente ───────────────────────────

	async function registrarPaciente() {
		if (!regNombre || !regApellido || !regCedula) {
			formError = 'Nombre, apellido y cédula son requeridos';
			return;
		}
		formError = '';
		loading = true;
		try {
			const { data } = await api<{ paciente: PacientePublic }>('registrarPaciente', {
				nombre: regNombre, apellido: regApellido, cedula: regCedula,
				relacion_univ: regRelacion, parentesco: regParentesco,
				titular_cedula: regTitularCedula, tipo_sangre: regTipoSangre,
				alergias: regAlergias, numero_contacto: regContacto
			});
			paciente = data.paciente;
			esNuevo = true;
			currentStep = 2;
		} catch (e) {
			formError = e instanceof Error ? e.message : 'Error de conexión. Intente nuevamente.';
		} finally {
			loading = false;
		}
	}

	// ─── Paso 4: cargar slots ─────────────────────────────────

	async function cargarSlots(date: string) {
		selectedDate = date;
		selectedSlot = '';
		slots = [];
		if (!selectedDoctorId) return;

		loadingSlots = true;
		try {
			const { data } = await api<{ slots: TimeSlot[]; duracion: 30 | 60 }>('obtenerSlots', {
				doctorId: Number(selectedDoctorId), fecha: date, esNuevo
			});
			slots = data.slots;
			slotDuracion = data.duracion;
		} catch {
			slots = [];
		} finally {
			loadingSlots = false;
		}
	}

	// ─── Paso 5: confirmar cita ───────────────────────────────

	async function confirmarCita() {
		if (!paciente || !selectedDoctorId || !selectedDate || !selectedSlot) {
			formError = 'Faltan datos para confirmar la cita';
			return;
		}
		formError = '';
		loading = true;
		try {
			const slotObj = slots.find((s) => s.hora_inicio === selectedSlot);
			if (!slotObj) { formError = 'Horario inválido'; return; }

			const { data } = await api<{ redirectUrl: string }>('confirmarCita', {
				pacienteId: paciente.id, doctorId: Number(selectedDoctorId),
				especialidadId: Number(selectedEspecialidadId),
				fecha: selectedDate, hora_inicio: slotObj.hora_inicio,
				hora_fin: slotObj.hora_fin, duracion_min: slotDuracion,
				es_primera_vez: esNuevo
			});
			window.location.href = data.redirectUrl;
			return;
		} catch (e) {
			formError = e instanceof Error ? e.message : 'Error de conexión. Intente nuevamente.';
		} finally {
			loading = false;
		}
	}

	const doctorSeleccionado = $derived(doctores.find((d) => String(d.id) === selectedDoctorId));
	const especialidadSeleccionada = $derived(especialidades.find((e) => String(e.id) === selectedEspecialidadId));
</script>

<div class="max-w-2xl mx-auto {className}">
	<!-- Stepper de progreso -->
	<div class="mb-8">
		<Stepper {steps} {currentStep} variant="compact" />
	</div>

	<!-- Error global -->
	{#if formError}
		<div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
			{formError}
		</div>
	{/if}

	<!-- ── Paso 1: Identificación ── -->
	{#if currentStep === 0}
		<div class="space-y-5 animate-fade-in-up">
			<h2 class="text-xl font-semibold text-ink">¿Cuál es su identificación?</h2>
			<p class="text-sm text-ink-muted">Ingrese su cédula o Número de Historia Médica (NHM) para verificar si ya está registrado.</p>

			<div class="flex gap-3">
				<label class="flex items-center gap-2 text-sm text-ink cursor-pointer">
					<input type="radio" bind:group={queryType} value="cedula" class="accent-viking-600" />
					Cédula
				</label>
				<label class="flex items-center gap-2 text-sm text-ink cursor-pointer">
					<input type="radio" bind:group={queryType} value="nhm" class="accent-viking-600" />
					NHM
				</label>
			</div>

			<Input
				label={queryType === 'cedula' ? 'Cédula de identidad (ej: V-12345678)' : 'Número de Historia Médica'}
				placeholder={queryType === 'cedula' ? 'V-12345678' : '1001'}
				bind:value={query}
				oninput={() => formError = ''}
			/>

			<Button variant="primary" fullWidth onclick={buscarPaciente} isLoading={loading}>
				Continuar
			</Button>
		</div>

	<!-- ── Paso 2: Registro ── -->
	{:else if currentStep === 1}
		<div class="space-y-5 animate-fade-in-up">
			<h2 class="text-xl font-semibold text-ink">Crear su ficha médica</h2>
			<p class="text-sm text-ink-muted">No encontramos su registro. Complete los siguientes datos para agendarse.</p>

			<div class="flex flex-wrap gap-3">
				<div class="flex-1 min-w-40">
					<Input label="Nombre *" bind:value={regNombre} />
				</div>
				<div class="flex-1 min-w-40">
					<Input label="Apellido *" bind:value={regApellido} />
				</div>
			</div>

			<Input label="Cédula (ej: V-12345678) *" bind:value={regCedula} />

			<fieldset>
				<legend class="block text-sm font-medium text-ink mb-1">Relación con la universidad *</legend>
				<div class="flex flex-wrap gap-3">
					{#each [['empleado','Empleado'],['estudiante','Estudiante'],['profesor','Profesor'],['tercero','Familiar/Tercero']] as [val, lbl]}
						<label class="flex items-center gap-2 text-sm text-ink cursor-pointer">
							<input type="radio" bind:group={regRelacion} value={val} class="accent-viking-600" />
							{lbl}
						</label>
					{/each}
				</div>
			</fieldset>

			{#if regRelacion === 'tercero'}
				<div class="p-4 bg-surface-elevated rounded-lg border border-border space-y-3">
					<p class="text-sm font-medium text-ink">Datos del titular universitario</p>
					<fieldset>
						<legend class="block text-sm font-medium text-ink mb-1">Parentesco</legend>
						<div class="flex gap-3">
							{#each [['hijo','Hijo/a'],['padre','Padre'],['madre','Madre']] as [val, lbl]}
								<label class="flex items-center gap-2 text-sm text-ink cursor-pointer">
									<input type="radio" bind:group={regParentesco} value={val} class="accent-viking-600" />
									{lbl}
								</label>
							{/each}
						</div>
					</fieldset>
					<Input label="Cédula del titular (ej: V-12345678)" bind:value={regTitularCedula} placeholder="V-XXXXXXXX" />
				</div>
			{/if}

			<div class="p-4 bg-surface-elevated rounded-lg border border-border space-y-3">
				<p class="text-sm font-medium text-ink">Datos médicos básicos</p>
				<div class="flex flex-wrap gap-3">
					<div class="flex-1 min-w-32">
						<Input label="Tipo de sangre" bind:value={regTipoSangre} placeholder="O+" />
					</div>
					<div class="flex-1 min-w-32">
						<Input label="Teléfono de contacto" bind:value={regContacto} placeholder="0412-XXXXXXX" />
					</div>
				</div>
				<Input label="Alergias (separadas por coma)" bind:value={regAlergias} placeholder="Penicilina, Aspirina" />
			</div>

			<div class="flex gap-3">
				<Button variant="ghost" onclick={prev}>Volver</Button>
				<Button variant="primary" fullWidth onclick={registrarPaciente} isLoading={loading}>
					Registrarme y continuar
				</Button>
			</div>
		</div>

	<!-- ── Paso 3: Doctor ── -->
	{:else if currentStep === 2}
		<div class="space-y-5 animate-fade-in-up">
			<h2 class="text-xl font-semibold text-ink">Seleccione el servicio médico</h2>

			{#if paciente}
				<div class="flex items-center gap-2 p-3 bg-surface-elevated rounded-lg text-sm text-ink-muted border border-border">
					<span>Paciente: <b class="text-ink">{paciente.nombre} {paciente.apellido}</b></span>
					{#if esNuevo}<span class="ml-2 text-viking-600 font-medium text-xs">★ Nuevo paciente — cita de 60 min</span>{/if}
				</div>
			{/if}

			<Select
				label="Especialidad"
				options={especialidadOpciones}
				value={selectedEspecialidadId}
				onchange={(v) => { if (typeof v === 'string') { selectedEspecialidadId = v; selectedDoctorId = ''; } }}
			/>

			<Select
				label="Doctor"
				options={doctorOpciones}
				value={selectedDoctorId}
				onchange={(v) => { if (typeof v === 'string') selectedDoctorId = v; }}
				disabled={!selectedEspecialidadId}
			/>

			<div class="flex gap-3">
				{#if !esNuevo}<Button variant="ghost" onclick={prev}>Volver</Button>{/if}
				<Button
					variant="primary"
					fullWidth
					disabled={!selectedDoctorId}
					onclick={next}
				>
					Continuar
				</Button>
			</div>
		</div>

	<!-- ── Paso 4: Fecha y hora ── -->
	{:else if currentStep === 3}
		<div class="space-y-6 animate-fade-in-up">
			<h2 class="text-xl font-semibold text-ink">Seleccione fecha y hora</h2>

			{#if esNuevo}
				<div class="p-3 bg-viking-50 dark:bg-viking-900/20 border border-viking-200 dark:border-viking-800 rounded-lg text-sm text-viking-700 dark:text-viking-300">
					Como es su primera consulta, el bloque reservado será de <b>60 minutos</b>.
				</div>
			{/if}

		<DoctorAvailabilityCalendar
			year={calYear}
			month={calMonth}
			{availableDates}
			{minDate}
			selected={selectedDate}
			onSelect={cargarSlots}
			onMonthChange={(y, m) => { calYear = y; calMonth = m; }}
		/>

			{#if selectedDate}
				<div class="mt-4">
					<h3 class="text-sm font-semibold text-ink mb-3">
						Horarios disponibles — {selectedDate}
						{#if esNuevo}<span class="text-xs font-normal text-ink-muted">(bloques de 60 min)</span>{/if}
					</h3>
					{#if loadingSlots}
						<div class="flex gap-2 flex-wrap">
							{#each Array(8) as _}
								<div class="w-16 h-9 rounded bg-surface-elevated animate-pulse"></div>
							{/each}
						</div>
					{:else}
						<TimeSlotPicker
							{slots}
							selected={selectedSlot}
							onSelect={(s) => selectedSlot = s.hora_inicio}
						/>
					{/if}
				</div>
			{/if}

			<div class="flex gap-3">
				<Button variant="ghost" onclick={prev}>Volver</Button>
				<Button
					variant="primary"
					fullWidth
					disabled={!selectedSlot}
					onclick={next}
				>
					Continuar
				</Button>
			</div>
		</div>

	<!-- ── Paso 5: Confirmación ── -->
	{:else if currentStep === 4}
		<div class="space-y-6 animate-fade-in-up">
			<h2 class="text-xl font-semibold text-ink">Confirme su cita</h2>

			<div class="divide-y divide-border border border-border rounded-lg overflow-hidden">
				{#each [
					{ label: 'Paciente', value: paciente ? `${paciente.nombre} ${paciente.apellido}` : '' },
					{ label: 'Especialidad', value: especialidadSeleccionada?.nombre ?? '' },
					{ label: 'Doctor', value: doctorSeleccionado?.nombreCompleto ?? '' },
					{ label: 'Fecha', value: selectedDate },
					{ label: 'Hora', value: selectedSlot },
					{ label: 'Duración', value: `${slotDuracion} minutos${esNuevo ? ' (primera consulta)' : ''}` }
				] as row}
					<div class="flex px-4 py-3 bg-surface">
						<span class="w-32 text-sm text-ink-muted shrink-0">{row.label}</span>
						<span class="text-sm font-medium text-ink">{row.value}</span>
					</div>
				{/each}
			</div>

			<p class="text-xs text-ink-muted">
				Al confirmar acepta que sus datos serán utilizados exclusivamente para la gestión médica interna.
			</p>

			<div class="flex gap-3">
				<Button variant="ghost" onclick={prev}>Modificar</Button>
				<Button variant="primary" fullWidth onclick={confirmarCita} isLoading={loading}>
					Confirmar cita
				</Button>
			</div>
		</div>
	{/if}
</div>

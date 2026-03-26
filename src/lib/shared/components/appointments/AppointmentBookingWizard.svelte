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
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import Textarea from '$shared/components/input/Textarea.svelte';
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

	// Paso 2 — Registro (campos planilla ULA)
	let regNombre = $state('');
	let regApellido = $state('');
	let regCedula = $state('');
	let regSexo = $state('');
	let regFechaNacimiento = $state('');
	let regLugarNacimiento = $state('');
	let regEstadoCivil = $state('');
	let regReligion = $state('');
	let regProcedencia = $state('');
	let regDireccionHabitacion = $state('');
	let regTelefono = $state('');
	let regProfesion = $state('');
	let regOcupacionActual = $state('');
	let regDireccionTrabajo = $state('');
	let regClasificacionEconomica = $state('');
	let regTipoBase = $state('');
	let regFamiliarDe = $state('');
	const esFamiliar = $derived(regTipoBase === 'familiar');
	let regParentesco = $state('');
	let regTitularCedula = $state('');
	let regTipoSangre = $state('');
	let regAlergias = $state('');
	let regContacto = $state('');
	// Contacto de emergencia
	let regEmergenciaNombre = $state('');
	let regEmergenciaParentesco = $state('');
	let regEmergenciaDireccion = $state('');
	let regEmergenciaTelefono = $state('');

	// Paso 5 — Motivo y observaciones
	let motivoConsulta = $state('');
	let observaciones = $state('');

	// Paso 3 — Doctor
	let selectedEspecialidadId = $state('');
	let selectedDoctorId = $state('');

	const doctoresFiltrados = $derived(
		selectedEspecialidadId
			? doctores.filter((d) => d.especialidad_id === selectedEspecialidadId)
			: doctores
	);

	const especialidadOpciones = $derived([
		{ value: '', label: 'Seleccione especialidad' },
		...especialidades.map((e) => ({ value: e.id, label: e.nombre }))
	]);

	const doctorOpciones = $derived([
		{ value: '', label: 'Seleccione doctor' },
		...doctoresFiltrados.map((d) => ({ value: d.id, label: d.nombre_completo }))
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

	// Fechas disponibles: derivadas síncronamente de dias_trabajo del doctor
	const availableDates = $derived.by(() => {
		const doctor = doctores.find((d) => d.id === selectedDoctorId);
		if (!doctor || !doctor.dias_trabajo.length) return [];

		const daysInMonth = new Date(calYear, calMonth, 0).getDate();
		const mo = String(calMonth).padStart(2, '0');
		const dates: string[] = [];

		for (let d = 1; d <= daysInMonth; d++) {
			const fecha = `${calYear}-${mo}-${String(d).padStart(2, '0')}`;
			if (fecha < minDate) continue;
			const dow = new Date(fecha + 'T12:00:00').getDay();
			const dayOfWeek = dow === 0 ? 7 : dow;
			if (doctor.dias_trabajo.includes(dayOfWeek)) dates.push(fecha);
		}
		return dates;
	});

	// ─── Pasos ───────────────────────────────────────────────

	const steps = [
		{ title: 'Identificación' },
		{ title: 'Datos personales' },
		{ title: 'Especialidad y doctor' },
		{ title: 'Fecha y hora' },
		{ title: 'Confirmación' }
	];

	const stepMaxWidth = $derived(
		currentStep === 0 ? 'max-w-[440px]' :
		currentStep === 1 ? 'max-w-2xl' :
		currentStep === 2 ? 'max-w-lg' :
		currentStep === 3 ? 'max-w-2xl' :
		'max-w-lg'
	);

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
				sexo: regSexo, fecha_nacimiento: regFechaNacimiento,
				lugar_nacimiento: regLugarNacimiento, estado_civil: regEstadoCivil,
				religion: regReligion, procedencia: regProcedencia,
				direccion_habitacion: regDireccionHabitacion, telefono: regTelefono,
				profesion: regProfesion, ocupacion_actual: regOcupacionActual,
				direccion_trabajo: regDireccionTrabajo,
				clasificacion_economica: regClasificacionEconomica,
				relacion_univ: esFamiliar ? regFamiliarDe : regTipoBase, parentesco: regParentesco,
				titular_cedula: regTitularCedula, tipo_sangre: regTipoSangre,
				alergias: regAlergias, numero_contacto: regContacto,
				emergencia_nombre: regEmergenciaNombre,
				emergencia_parentesco: regEmergenciaParentesco,
				emergencia_direccion: regEmergenciaDireccion,
				emergencia_telefono: regEmergenciaTelefono
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
				doctorId: selectedDoctorId, fecha: date, esNuevo
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
				pacienteId: paciente.id, doctorId: selectedDoctorId,
				especialidadId: selectedEspecialidadId,
				fecha: selectedDate, hora_inicio: slotObj.hora_inicio,
				hora_fin: slotObj.hora_fin, duracion_min: slotDuracion,
				es_primera_vez: esNuevo,
				motivo_consulta: motivoConsulta || undefined,
				observaciones: observaciones || undefined
			});
			window.location.href = data.redirectUrl;
			return;
		} catch (e) {
			formError = e instanceof Error ? e.message : 'Error de conexión. Intente nuevamente.';
		} finally {
			loading = false;
		}
	}

	const doctorSeleccionado = $derived(doctores.find((d) => d.id === selectedDoctorId));
	const especialidadSeleccionada = $derived(especialidades.find((e) => e.id === selectedEspecialidadId));

</script>

<!-- Wrapper: centra vertical solo en Step 1, flujo normal en 2-5 -->
<div class="{currentStep === 0 ? 'min-h-[calc(100vh-7rem)] flex items-center justify-center' : 'flex justify-center py-3 sm:py-5'} px-2 sm:px-4 {className}">
	<div class="w-full {stepMaxWidth} mx-auto">

		<!-- Error (fuera de la card) -->
		{#if formError}
			<div class="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
				{formError}
			</div>
		{/if}

		<!-- La card -->
		<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-2)]">

			<!-- Card header -->
			{#if currentStep === 0}
				<!-- Step 1: branding sin progreso -->
				<div class="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-border/40">
					<div class="flex items-center gap-2.5 mb-1">
						<svg class="w-5 h-5 text-viking-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<h2 class="text-base font-semibold text-ink">Agendar Cita Médica</h2>
					</div>
					<p class="text-xs text-ink-muted">Servicio Médico Universitario</p>
				</div>
			{:else}
				<!-- Steps 2-5: branding + barra de progreso -->
				<div class="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-border/40">
					<div class="flex items-center justify-between mb-3">
						<div class="flex items-center gap-2">
							<div class="w-7 h-7 rounded-lg bg-viking-600 flex items-center justify-center">
								<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
							<p class="text-sm font-semibold text-ink">Agendar Cita</p>
						</div>
						<span class="text-xs text-ink-muted tabular-nums">Paso {currentStep + 1} de {steps.length}</span>
					</div>
					<div class="h-1 w-full rounded-full bg-border/60 overflow-hidden">
						<div
							class="h-full rounded-full bg-viking-500 transition-all duration-500 ease-out"
							style="width: {((currentStep + 1) / steps.length) * 100}%"
						></div>
					</div>
					<p class="text-xs text-ink-muted mt-2">{steps[currentStep].title}</p>
				</div>
			{/if}

			<!-- Card body -->
			{#key currentStep}
				<div class="px-4 sm:px-6 py-4 sm:py-5 animate-fade-in-up">

					<!-- ── Paso 1: Identificación ── -->
					{#if currentStep === 0}
						<div class="space-y-4">
							<p class="text-sm text-ink">Ingrese su cédula o NHM para verificar si ya está registrado.</p>

							<div class="flex gap-4">
								<label class="flex items-center gap-1.5 text-sm text-ink cursor-pointer">
									<input type="radio" bind:group={queryType} value="cedula" class="accent-viking-600" />
									Cédula
								</label>
								<label class="flex items-center gap-1.5 text-sm text-ink cursor-pointer">
									<input type="radio" bind:group={queryType} value="nhm" class="accent-viking-600" />
									NHM
								</label>
							</div>

							<Input
								label={queryType === 'cedula' ? 'Cédula de identidad' : 'Número de Historia Médica'}
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
						<div>
							<div class="mb-4">
								<h2 class="text-lg font-semibold text-ink">Identificación del paciente</h2>
								<p class="text-xs text-ink-muted mt-0.5">Complete los datos para crear su ficha médica.</p>
							</div>

							<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Datos personales</p>
							<div class="space-y-2.5 mb-5">
								<div class="flex flex-col sm:flex-row gap-2.5">
									<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Nombres *" bind:value={regNombre} inputSize="sm" /></div>
									<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Apellidos *" bind:value={regApellido} inputSize="sm" /></div>
								</div>
								<div class="flex flex-col sm:flex-row gap-2.5 sm:items-end">
									<div class="flex-1 min-w-0 sm:min-w-36"><Input label="C.I. *" bind:value={regCedula} placeholder="V-12345678" inputSize="sm" /></div>
									<div class="flex-1 min-w-0 sm:min-w-28">
										<fieldset>
											<legend class="block text-xs font-medium text-ink mb-1">Sexo</legend>
											<div class="flex gap-3">
												{#each [['M','M'],['F','F']] as [val, lbl]}
													<label class="flex items-center gap-1.5 text-sm text-ink cursor-pointer">
														<input type="radio" bind:group={regSexo} value={val} class="accent-viking-600" />
														{lbl}
													</label>
												{/each}
											</div>
										</fieldset>
									</div>
								</div>
								<div class="flex flex-col sm:flex-row gap-2.5">
									<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Fecha de nacimiento" type="date" bind:value={regFechaNacimiento} inputSize="sm" /></div>
									<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Lugar de nacimiento" bind:value={regLugarNacimiento} placeholder="Ciudad, Estado" inputSize="sm" /></div>
								</div>
								<fieldset>
									<legend class="block text-xs font-medium text-ink mb-1">Estado civil</legend>
									<div class="flex flex-wrap gap-x-3 gap-y-1">
										{#each [['soltero','Soltero/a'],['casado','Casado/a'],['divorciado','Divorciado/a'],['viudo','Viudo/a'],['union_libre','Unión libre']] as [val, lbl]}
											<label class="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
												<input type="radio" bind:group={regEstadoCivil} value={val} class="accent-viking-600" />
												{lbl}
											</label>
										{/each}
									</div>
								</fieldset>
								<div class="flex flex-col sm:flex-row gap-2.5">
									<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Religión" bind:value={regReligion} inputSize="sm" /></div>
									<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Procedencia" bind:value={regProcedencia} placeholder="Ciudad o estado" inputSize="sm" /></div>
								</div>
							</div>

							<div class="border-t border-border/40 pt-4 mb-5">
								<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Contacto y ubicación</p>
								<div class="space-y-2.5">
									<Input label="Dirección de habitación" bind:value={regDireccionHabitacion} placeholder="Av., calle, urbanización, casa/apto" inputSize="sm" />
									<div class="flex flex-col sm:flex-row gap-2.5">
										<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Teléfono *" bind:value={regTelefono} placeholder="0412-XXXXXXX" inputSize="sm" /></div>
										<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Dirección del trabajo" bind:value={regDireccionTrabajo} inputSize="sm" /></div>
									</div>
								</div>
							</div>

							<div class="border-t border-border/40 pt-4 mb-5">
								<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Datos profesionales</p>
								<div class="flex flex-col sm:flex-row gap-2.5">
									<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Profesión" bind:value={regProfesion} inputSize="sm" /></div>
									<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Ocupación actual" bind:value={regOcupacionActual} inputSize="sm" /></div>
									<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Clasificación económica" bind:value={regClasificacionEconomica} inputSize="sm" /></div>
								</div>
							</div>

							<div class="border-t border-border/40 pt-4 mb-5">
								<fieldset>
									<legend class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Relación con la universidad *</legend>
									<div class="flex flex-wrap gap-x-4 gap-y-1.5">
										{#each [['P','Profesor'],['E','Empleado'],['O','Obrero'],['B','Estudiante'],['familiar','Familiar'],['X','Caso Especial']] as [val, lbl]}
											<label class="flex items-center gap-1.5 text-sm text-ink cursor-pointer">
												<input type="radio" bind:group={regTipoBase} value={val} class="accent-viking-600" />
												{lbl}
											</label>
										{/each}
									</div>
								</fieldset>
								{#if esFamiliar}
									<div class="mt-3 pl-4 border-l-2 border-viking-200 dark:border-viking-800 space-y-2">
										<fieldset>
											<legend class="block text-xs font-medium text-ink mb-1">Familiar de</legend>
											<div class="flex flex-wrap gap-x-3 gap-y-1">
												{#each [['R','Profesor'],['S','Empleado'],['T','Obrero'],['C','Estudiante'],['F','Otro']] as [val, lbl]}
													<label class="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
														<input type="radio" bind:group={regFamiliarDe} value={val} class="accent-viking-600" />
														{lbl}
													</label>
												{/each}
											</div>
										</fieldset>
										<fieldset>
											<legend class="block text-xs font-medium text-ink mb-1">Parentesco</legend>
											<div class="flex flex-wrap gap-x-3 gap-y-1">
												{#each [['hijo','Hijo/a'],['padre','Padre'],['madre','Madre'],['conyuge','Cónyuge'],['otro','Otro']] as [val, lbl]}
													<label class="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
														<input type="radio" bind:group={regParentesco} value={val} class="accent-viking-600" />
														{lbl}
													</label>
												{/each}
											</div>
										</fieldset>
										<Input label="Cédula del titular" bind:value={regTitularCedula} placeholder="V-XXXXXXXX" inputSize="sm" />
									</div>
								{/if}
							</div>

							<div class="border-t border-border/40 pt-4 mb-5">
								<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Datos médicos</p>
								<div class="space-y-2.5">
									<div class="flex flex-col sm:flex-row gap-2.5">
										<div class="flex-1 min-w-0 sm:min-w-28"><Input label="Grupo sanguíneo" bind:value={regTipoSangre} placeholder="O+" inputSize="sm" /></div>
										<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Teléfono contacto médico" bind:value={regContacto} placeholder="0412-XXXXXXX" inputSize="sm" /></div>
									</div>
									<Input label="Alergias (separadas por coma)" bind:value={regAlergias} placeholder="Penicilina, Aspirina" inputSize="sm" />
								</div>
							</div>

							<div class="border-t border-border/40 pt-4 mb-5">
								<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Contacto de emergencia</p>
								<div class="space-y-2.5">
									<div class="flex flex-col sm:flex-row gap-2.5">
										<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Nombre completo" bind:value={regEmergenciaNombre} inputSize="sm" /></div>
										<div class="flex-1 min-w-0 sm:min-w-28"><Input label="Parentesco" bind:value={regEmergenciaParentesco} placeholder="Esposa, Hijo" inputSize="sm" /></div>
									</div>
									<div class="flex flex-col sm:flex-row gap-2.5">
										<div class="flex-1 min-w-0 sm:min-w-36"><Input label="Dirección" bind:value={regEmergenciaDireccion} inputSize="sm" /></div>
										<div class="flex-1 min-w-0 sm:min-w-28"><Input label="Teléfono" bind:value={regEmergenciaTelefono} placeholder="0412-XXXXXXX" inputSize="sm" /></div>
									</div>
								</div>
							</div>

							<div class="flex gap-3 pt-2 border-t border-border/40">
								<Button variant="ghost" onclick={prev}>Volver</Button>
								<Button variant="primary" fullWidth onclick={registrarPaciente} isLoading={loading}>
									Registrarme y continuar
								</Button>
							</div>
						</div>

					<!-- ── Paso 3: Doctor ── -->
					{:else if currentStep === 2}
						<div class="space-y-4">
							<h2 class="text-lg font-semibold text-ink">Seleccione el servicio médico</h2>

							{#if paciente}
								<div class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-ink-muted border border-border/60">
									<span>Paciente: <b class="text-ink">{paciente.nombre} {paciente.apellido}</b></span>
									{#if esNuevo}<span class="ml-2 text-viking-600 font-medium">Primera vez — 60 min</span>{/if}
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
								<Button variant="primary" fullWidth disabled={!selectedDoctorId} onclick={next}>
									Continuar
								</Button>
							</div>
						</div>

					<!-- ── Paso 4: Fecha y hora ── -->
					{:else if currentStep === 3}
						<div class="space-y-3 sm:space-y-4">
							<h2 class="text-base sm:text-lg font-semibold text-ink">Seleccione fecha y hora</h2>

							{#if esNuevo}
								<div class="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-viking-50 dark:bg-viking-900/20 border border-viking-200 dark:border-viking-800 rounded-lg text-[11px] sm:text-xs text-viking-700 dark:text-viking-300">
									Primera consulta — <b>60 minutos</b>.
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
								<div>
									<h3 class="text-xs sm:text-sm font-semibold text-ink mb-2">
										Horarios — {selectedDate}
										{#if esNuevo}<span class="text-[10px] sm:text-xs font-normal text-ink-muted">(60 min)</span>{/if}
									</h3>
									{#if loadingSlots}
										<div class="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
											{#each Array(8) as _}
												<div class="h-8 sm:h-9 rounded-lg bg-canvas-subtle animate-pulse"></div>
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
								<Button variant="primary" fullWidth disabled={!selectedSlot} onclick={next}>
									Continuar
								</Button>
							</div>
						</div>

					<!-- ── Paso 5: Confirmación ── -->
					{:else if currentStep === 4}
						<div class="space-y-4">
							<h2 class="text-lg font-semibold text-ink">Confirme su cita</h2>

							<div class="divide-y divide-border/50 border border-border/60 rounded-lg overflow-hidden">
								{#each [
									{ label: 'Paciente', value: paciente ? `${paciente.nombre} ${paciente.apellido}` : '' },
									{ label: 'Especialidad', value: especialidadSeleccionada?.nombre ?? '' },
									{ label: 'Doctor', value: doctorSeleccionado?.nombre_completo ?? '' },
									{ label: 'Fecha', value: selectedDate },
									{ label: 'Hora', value: selectedSlot },
									{ label: 'Duración', value: `${slotDuracion} min${esNuevo ? ' (primera vez)' : ''}` }
								] as row}
									<div class="flex px-3 py-2">
										<span class="w-24 text-xs text-ink-muted shrink-0">{row.label}</span>
										<span class="text-sm font-medium text-ink">{row.value}</span>
									</div>
								{/each}
							</div>

							<div class="space-y-2.5">
								<Textarea
									label="Motivo de la consulta"
									value={motivoConsulta}
									oninput={(e) => motivoConsulta = (e.target as HTMLTextAreaElement).value}
									placeholder="Describa brevemente el motivo de su visita"
									rows={2}
									textareaSize="sm"
								/>
								<Textarea
									label="Observaciones"
									value={observaciones}
									oninput={(e) => observaciones = (e.target as HTMLTextAreaElement).value}
									placeholder="Detalles adicionales sobre su problema o síntomas"
									rows={2}
									hint="Opcional — información relevante para el médico"
									textareaSize="sm"
								/>
							</div>

							<p class="text-[11px] text-ink-subtle">
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
			{/key}
		</div>

		<!-- Texto de ayuda -->
		<p class="text-center text-[10px] text-ink-subtle mt-3">
			Lun–Vie 8:00–5:00 PM · ¿Ayuda? Contacte la línea interna
		</p>
	</div>
</div>

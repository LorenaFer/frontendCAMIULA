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
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';

	interface Props {
		doctores: DoctorOption[];
		especialidades: Especialidad[];
		minDate: string;
		/** Paciente ya logueado — salta el step de identificación */
		loggedPatient?: PacientePublic | null;
		class?: string;
	}

	let { doctores, especialidades, minDate, loggedPatient = null, class: className = '' }: Props = $props();

	// ─── Estado del wizard ────────────────────────────────────

	// Si hay paciente logueado, saltar step 0 (identificación) e ir directo a step 1 (doctor)
	let currentStep = $state(loggedPatient ? 1 : 0);
	let loading = $state(false);
	let formError = $state('');

	// Paso 1 — Identificación (auto-detect: NHM si < 100000 y numérico puro, sino cédula)
	let query = $state('');
	const queryType = $derived.by<'nhm' | 'cedula'>(() => {
		const trimmed = query.trim().replace(/[^0-9]/g, '');
		return trimmed.length > 0 && Number(trimmed) < 100000 && query.trim() === trimmed ? 'nhm' : 'cedula';
	});
	let paciente = $state<PacientePublic | null>(loggedPatient ?? null);
	let esNuevo = $state(loggedPatient?.es_nuevo ?? false);
	let pacienteNoEncontrado = $state(false);

	// Paso 5 — Motivo y observaciones
	let motivoConsulta = $state('');
	let observaciones = $state('');

	// Paso 3 — Doctor
	let selectedEspecialidadId = $state('');
	let selectedDoctorId = $state('');
	let doctorSearch = $state('');

	const doctoresFiltrados = $derived.by(() => {
		let result = doctores;
		const q = doctorSearch.trim().toLowerCase();
		if (q) {
			result = result.filter((d) =>
				d.nombre_completo.toLowerCase().includes(q) ||
				d.especialidad.toLowerCase().includes(q)
			);
		} else if (selectedEspecialidadId) {
			result = result.filter((d) => d.especialidad_id === selectedEspecialidadId);
		}
		return result;
	});

	function selectDoctor(doc: DoctorOption) {
		selectedDoctorId = doc.id;
		selectedEspecialidadId = doc.especialidad_id;
		doctorSearch = doc.nombre_completo;
	}

	const especialidadOpciones = $derived([
		{ value: '', label: 'Todas las especialidades' },
		...especialidades.map((e) => ({ value: e.id, label: e.nombre }))
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
		{ title: 'Especialidad y doctor' },
		{ title: 'Fecha y hora' },
		{ title: 'Confirmación' }
	];

	const stepMaxWidth = $derived(
		currentStep === 0 ? 'max-w-[440px]' :
		currentStep === 1 ? 'max-w-lg' :
		currentStep === 2 ? 'max-w-2xl' :
		'max-w-lg'
	);

	// ─── Navegación ───────────────────────────────────────────

	function next() { if (currentStep < steps.length - 1) currentStep++; }
	function prev() { if (currentStep > 0) { currentStep--; formError = ''; } }


	// ─── Helper: POST JSON al endpoint REST ──────────────────

	async function api<T = unknown>(action: string, body: Record<string, unknown>): Promise<{ ok: boolean; data: T; message: string }> {
		const res = await fetch('/agendar', {
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
		pacienteNoEncontrado = false;
		loading = true;
		try {
			const { data } = await api<{ found: boolean; paciente: PacientePublic | null }>('buscarPaciente', { query: query.trim(), queryType: queryType });
			if (data.found) {
				paciente = data.paciente;
				esNuevo = data.paciente?.es_nuevo ?? false;
				currentStep = 1; // Ir a selección de doctor (antes era step 2)
			} else {
				pacienteNoEncontrado = true;
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error de conexión. Intente nuevamente.';
			formError = msg;
			toastError('No se encontró el paciente', msg);
		} finally {
			loading = false;
		}
	}

	// ─── Paso 4: cargar slots (con caché + pre-fetch) ────────

	const slotsCache = new Map<string, { slots: TimeSlot[]; duracion: 30 | 60 }>();

	async function fetchSlotsForDate(date: string): Promise<{ slots: TimeSlot[]; duracion: 30 | 60 }> {
		const cacheKey = `${selectedDoctorId}:${date}:${esNuevo}`;
		if (slotsCache.has(cacheKey)) return slotsCache.get(cacheKey)!;

		const { data } = await api<{ slots: TimeSlot[]; duracion: 30 | 60 }>('obtenerSlots', {
			doctorId: selectedDoctorId, fecha: date, esNuevo
		});
		slotsCache.set(cacheKey, data);
		return data;
	}

	async function cargarSlots(date: string) {
		selectedDate = date;
		selectedSlot = '';
		slots = [];
		if (!selectedDoctorId) return;

		loadingSlots = true;
		try {
			const result = await fetchSlotsForDate(date);
			slots = result.slots;
			slotDuracion = result.duracion;
		} catch {
			slots = [];
		} finally {
			loadingSlots = false;
		}
	}

	/** Pre-fetch slots de las primeras 3 fechas disponibles (fire & forget) */
	function prefetchSlots() {
		if (!selectedDoctorId || availableDates.length === 0) return;
		const toFetch = availableDates.slice(0, 3);
		for (const date of toFetch) {
			fetchSlotsForDate(date).catch(() => {});
		}
	}

	// Lanzar pre-fetch al llegar al paso de fecha/hora
	$effect(() => {
		if (currentStep === 2) prefetchSlots();
	});

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
			const msg = e instanceof Error ? e.message : 'Error de conexión. Intente nuevamente.';
			formError = msg;
			toastError('No se pudo agendar', msg);
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
							<p class="text-sm text-ink">Ingrese su cédula de identidad o número de historia médica.</p>

							<Input
								label="Cédula o NHM"
								placeholder="Ej: V-12345678 o 1001"
								bind:value={query}
								oninput={() => { formError = ''; pacienteNoEncontrado = false; }}
								inputSize="lg"
							/>

							{#if query.trim()}
								<p class="text-xs text-ink-muted">
									Buscando como: <strong>{queryType === 'nhm' ? 'N° de Historia Médica' : 'Cédula de identidad'}</strong>
								</p>
							{/if}

							<Button variant="primary" fullWidth onclick={buscarPaciente} isLoading={loading}>
								Continuar
							</Button>

							{#if pacienteNoEncontrado}
								<div class="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
									<div class="flex items-start gap-2.5">
										<svg class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
										</svg>
										<div>
											<p class="text-sm font-semibold text-amber-800 dark:text-amber-200">Paciente no registrado</p>
											<p class="text-xs text-amber-700 dark:text-amber-300 mt-1">
												No se encontró un paciente con la cédula o NHM ingresado. El paciente debe registrarse primero a través del portal.
											</p>
										</div>
									</div>
									<a
										href="/portal/registro"
										class="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-viking-600 text-white text-sm font-medium hover:bg-viking-700 transition-colors"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
										</svg>
										Ir al portal de registro
									</a>
								</div>
							{/if}
						</div>

					<!-- ── Paso 2: Doctor ── -->
					{:else if currentStep === 1}
						<div class="space-y-4">
							<h2 class="text-lg font-semibold text-ink">Seleccione el servicio médico</h2>

							{#if paciente}
								<div class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-ink-muted border border-border/60">
									<span>Paciente: <b class="text-ink">{paciente.nombre} {paciente.apellido}</b></span>
									{#if esNuevo}<span class="ml-2 text-viking-600 font-medium">Primera vez — 60 min</span>{/if}
								</div>
							{/if}

							<Input
								label="Buscar doctor o especialidad"
								placeholder="Ej: Cardiología, Dr. Pérez..."
								bind:value={doctorSearch}
								oninput={() => { selectedDoctorId = ''; }}
							/>

							{#if !doctorSearch.trim()}
								<Select
									label="O filtrar por especialidad"
									options={especialidadOpciones}
									value={selectedEspecialidadId}
									onchange={(v) => { if (typeof v === 'string') { selectedEspecialidadId = v; selectedDoctorId = ''; } }}
								/>
							{/if}

							<!-- Lista de doctores encontrados -->
							{#if doctoresFiltrados.length > 0}
								<div class="space-y-1.5 max-h-48 overflow-y-auto">
									{#each doctoresFiltrados as doc (doc.id)}
										<button
											type="button"
											class="w-full text-left px-3 py-2.5 rounded-lg border transition-colors
												{selectedDoctorId === doc.id
													? 'border-viking-400 bg-viking-50 dark:bg-viking-900/20'
													: 'border-border/60 hover:bg-canvas-subtle'}"
											onclick={() => selectDoctor(doc)}
										>
											<p class="text-sm font-medium text-ink">{doc.nombre_completo}</p>
											<p class="text-xs text-ink-muted">{doc.especialidad}</p>
										</button>
									{/each}
								</div>
							{:else if doctorSearch.trim()}
								<p class="text-sm text-ink-muted text-center py-3">No se encontraron doctores para "{doctorSearch}"</p>
							{/if}

							<div class="flex gap-3">
								<Button variant="ghost" onclick={prev}>Volver</Button>
								<Button variant="primary" fullWidth disabled={!selectedDoctorId} onclick={next}>
									Continuar
								</Button>
							</div>
						</div>

					<!-- ── Paso 3: Fecha y hora ── -->
					{:else if currentStep === 2}
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

					<!-- ── Paso 4: Confirmación ── -->
					{:else if currentStep === 3}
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

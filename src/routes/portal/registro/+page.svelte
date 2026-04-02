<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import DateInput from '$shared/components/input/DateInput.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import Textarea from '$shared/components/input/Textarea.svelte';
	import { toastError } from '$shared/components/toast/toast.svelte.js';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
	let step = $state(0); // 0-4

	// Mostrar errores del server como toast
	$effect(() => {
		if (form?.error) {
			toastError('Error en el registro', form.error);
		}
	});

	const stepLabels = [
		'I. Identificación',
		'II. Datos Personales',
		'III. Relación Universitaria',
		'IV. Direcciones y Emergencia',
		'V. Alergias y Alertas'
	];

	// I. Identificación
	let apellido = $state('');
	let nombre = $state('');
	let cedula = $state('');
	let telefono = $state('');
	let correo = $state('');

	// II. Datos personales + socio-económica
	let sexo = $state('');
	let fechaNacimiento = $state('');
	let pais = $state('Venezuela');
	let estadoGeo = $state('');
	let ciudad = $state('');
	let estadoCivil = $state('');
	let tipoSangre = $state('');
	let religion = $state('');
	let clasificacionEconomica = $state('');
	let profesion = $state('');
	let ocupacionActual = $state('');

	// III. Relación universitaria
	let relacionBase = $state('');
	const esFamiliar = $derived(relacionBase === 'familiar');
	let familiarDe = $state('');
	let parentesco = $state('');
	let titularCedula = $state('');

	// IV. Direcciones + Emergencia
	let direccionHabitacion = $state('');
	let direccionTrabajo = $state('');
	let emergenciaNombre = $state('');
	let emergenciaParentesco = $state('');
	let emergenciaTelefono = $state('');
	let emergenciaDireccion = $state('');

	// V. Alergias
	let tieneAlergias = $state(false);
	let alergias = $state('');
	let alertasMedicas = $state('');

	// Validaciones por step
	const step0Valid = $derived(!!nombre && !!apellido && !!cedula && !!telefono);
	const step1Valid = $derived(!!sexo && !!fechaNacimiento);
	const step2Valid = $derived(!!relacionBase);
	const step3Valid = $derived(!!direccionHabitacion && !!emergenciaNombre && !!emergenciaTelefono);
</script>

<svelte:head><title>Registro — Portal Paciente</title></svelte:head>

<div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
	<div class="max-w-lg w-full">
		<a href="/portal" class="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-5 transition-colors">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
			Volver al portal
		</a>

		<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-2)] p-5 sm:p-6">
			<!-- Header -->
			<div class="text-center mb-1">
				<h1 class="text-xl font-bold text-ink">Registro de Paciente</h1>
				<p class="text-xs text-ink-muted mt-1">{stepLabels[step]}</p>
			</div>

			<!-- Progress -->
			<div class="flex gap-1 mb-5">
				{#each [0, 1, 2, 3, 4] as s}
					<div class="h-1 flex-1 rounded-full transition-colors {s <= step ? 'bg-viking-500' : 'bg-border/60'}"></div>
				{/each}
			</div>

			<!-- Steps -->
			{#if step === 0}
				<!-- I. Identificación -->
				<div class="space-y-3">
					<div class="grid grid-cols-2 gap-3">
						<Input label="Apellidos *" bind:value={apellido} />
						<Input label="Nombres *" bind:value={nombre} />
					</div>
					<Input label="C.I. / Documento de Identidad *" bind:value={cedula} placeholder="V-12345678" />
					<div class="grid grid-cols-2 gap-3">
						<Input label="Teléfono *" bind:value={telefono} placeholder="(0000) 000-0000" />
						<Input label="Correo electrónico" bind:value={correo} placeholder="email@ejemplo.com" type="email" />
					</div>
					<div class="flex gap-3 pt-2">
						<Button variant="primary" fullWidth disabled={!step0Valid} onclick={() => { step = 1; }}>
							Siguiente
						</Button>
					</div>
				</div>

			{:else if step === 1}
				<!-- II. Datos Personales + Socio-económica -->
				<div class="space-y-3">
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-sm font-medium text-ink mb-1.5">Sexo *</label>
							<div class="flex gap-2">
								{#each [['M', 'Masculino'], ['F', 'Femenino']] as [val, lbl]}
									<label class="flex items-center gap-2 text-sm text-ink cursor-pointer px-3 py-2 rounded-lg border transition-colors flex-1 justify-center
										{sexo === val ? 'border-viking-400 bg-viking-50 dark:bg-viking-900/20' : 'border-border/60 hover:bg-canvas-subtle'}">
										<input type="radio" bind:group={sexo} value={val} class="accent-viking-600 w-4 h-4" />
										{lbl}
									</label>
								{/each}
							</div>
						</div>
						<DateInput label="Fecha de nacimiento *" bind:value={fechaNacimiento} />
					</div>
					<div class="grid grid-cols-3 gap-2">
						<Input label="País" bind:value={pais} />
						<Input label="Estado" bind:value={estadoGeo} placeholder="Mérida" />
						<Input label="Ciudad" bind:value={ciudad} placeholder="Mérida" />
					</div>

					<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider pt-1">Información socio-económica</p>
					<div class="grid grid-cols-3 gap-2">
						<Select label="Estado civil" value={estadoCivil} onchange={(v) => { estadoCivil = v; }} options={[
							{ value: '', label: 'Seleccione' },
							{ value: 'soltero', label: 'Soltero/a' },
							{ value: 'casado', label: 'Casado/a' },
							{ value: 'divorciado', label: 'Divorciado/a' },
							{ value: 'viudo', label: 'Viudo/a' },
							{ value: 'union_libre', label: 'Unión libre' }
						]} />
						<Select label="Grupo sanguíneo" value={tipoSangre} onchange={(v) => { tipoSangre = v; }} options={[
							{ value: '', label: 'Seleccione' },
							...'O+ O- A+ A- B+ B- AB+ AB-'.split(' ').map(v => ({ value: v, label: v }))
						]} />
						<Input label="Religión" bind:value={religion} />
					</div>
					<div class="grid grid-cols-3 gap-2">
						<Input label="Clasif. económica" bind:value={clasificacionEconomica} />
						<Input label="Profesión" bind:value={profesion} />
						<Input label="Ocupación actual" bind:value={ocupacionActual} />
					</div>
					<div class="flex gap-3 pt-2">
						<Button variant="ghost" onclick={() => { step = 0; }}>Volver</Button>
						<Button variant="primary" fullWidth disabled={!step1Valid} onclick={() => { step = 2; }}>Siguiente</Button>
					</div>
				</div>

			{:else if step === 2}
				<!-- III. Relación universitaria -->
				<div class="space-y-3">
					<label class="block text-sm font-medium text-ink mb-1">¿Cuál es su relación con la universidad? *</label>
					<div class="space-y-2">
						{#each [['P','Profesor/a'],['E','Empleado/a'],['O','Obrero/a'],['B','Estudiante'],['familiar','Familiar'],['X','Caso especial']] as [val, lbl]}
							<label class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors
								{relacionBase === val ? 'border-viking-400 bg-viking-50 dark:bg-viking-900/20' : 'border-border/60 hover:bg-canvas-subtle'}">
								<input type="radio" bind:group={relacionBase} value={val} class="accent-viking-600 w-4 h-4" />
								<span class="text-sm text-ink">{lbl}</span>
							</label>
						{/each}
					</div>

					{#if esFamiliar}
						<div class="pl-4 border-l-2 border-viking-200 dark:border-viking-800 space-y-3 mt-2">
							<label class="block text-sm font-medium text-ink mb-1">Familiar de</label>
							<div class="flex flex-wrap gap-2">
								{#each [['R','Profesor'],['S','Empleado'],['T','Obrero'],['C','Estudiante'],['F','Otro']] as [val, lbl]}
									<label class="flex items-center gap-2 text-sm text-ink cursor-pointer px-3 py-1.5 rounded-lg border
										{familiarDe === val ? 'border-viking-400 bg-viking-50 dark:bg-viking-900/20' : 'border-border/60'}">
										<input type="radio" bind:group={familiarDe} value={val} class="accent-viking-600" />
										{lbl}
									</label>
								{/each}
							</div>
							<label class="block text-sm font-medium text-ink mb-1">Parentesco</label>
							<div class="flex flex-wrap gap-2">
								{#each [['hijo','Hijo/a'],['padre','Padre'],['madre','Madre'],['conyuge','Cónyuge'],['otro','Otro']] as [val, lbl]}
									<label class="flex items-center gap-2 text-sm text-ink cursor-pointer px-3 py-1.5 rounded-lg border
										{parentesco === val ? 'border-viking-400 bg-viking-50 dark:bg-viking-900/20' : 'border-border/60'}">
										<input type="radio" bind:group={parentesco} value={val} class="accent-viking-600" />
										{lbl}
									</label>
								{/each}
							</div>
							<Input label="Cédula del titular *" bind:value={titularCedula} placeholder="V-XXXXXXXX" />
						</div>
					{/if}

					<div class="flex gap-3 pt-2">
						<Button variant="ghost" onclick={() => { step = 1; }}>Volver</Button>
						<Button variant="primary" fullWidth disabled={!step2Valid} onclick={() => { step = 3; }}>Siguiente</Button>
					</div>
				</div>

			{:else if step === 3}
				<!-- IV. Direcciones + Contacto de emergencia -->
				<div class="space-y-3">
					<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider">Direcciones</p>
					<Input label="Dirección de habitación *" bind:value={direccionHabitacion} placeholder="Av., calle, urbanización, casa/apto" />
					<Input label="Dirección de trabajo" bind:value={direccionTrabajo} placeholder="Dirección laboral" />

					<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider pt-2">Contacto de emergencia</p>
					<div class="grid grid-cols-2 gap-2">
						<Input label="Nombre del familiar *" bind:value={emergenciaNombre} placeholder="Nombre completo" />
						<Input label="Parentesco *" bind:value={emergenciaParentesco} placeholder="Madre, padre..." />
					</div>
					<div class="grid grid-cols-2 gap-2">
						<Input label="Teléfono *" bind:value={emergenciaTelefono} placeholder="(0000) 000-0000" />
						<Input label="Dirección" bind:value={emergenciaDireccion} placeholder="Dirección del contacto" />
					</div>
					<div class="flex gap-3 pt-2">
						<Button variant="ghost" onclick={() => { step = 2; }}>Volver</Button>
						<Button variant="primary" fullWidth disabled={!step3Valid} onclick={() => { step = 4; }}>Siguiente</Button>
					</div>
				</div>

			{:else}
				<!-- V. Alergias y alertas -->
				<form method="POST" use:enhance={() => {
					loading = true;
					return async ({ result }) => {
						loading = false;
						if (result.type === 'redirect') {
							window.location.href = result.location;
						} else if (result.type === 'failure') {
							toastError('Error en el registro', (result.data as { error?: string })?.error ?? 'Error desconocido');
						}
					};
				}}>
					<!-- Hidden fields para todos los datos -->
					<input type="hidden" name="nombre" value={nombre} />
					<input type="hidden" name="apellido" value={apellido} />
					<input type="hidden" name="cedula" value={cedula} />
					<input type="hidden" name="telefono" value={telefono} />
					<input type="hidden" name="correo" value={correo} />
					<input type="hidden" name="sexo" value={sexo} />
					<input type="hidden" name="fecha_nacimiento" value={fechaNacimiento} />
					<input type="hidden" name="pais" value={pais} />
					<input type="hidden" name="estado_geo" value={estadoGeo} />
					<input type="hidden" name="ciudad" value={ciudad} />
					<input type="hidden" name="estado_civil" value={estadoCivil} />
					<input type="hidden" name="tipo_sangre" value={tipoSangre} />
					<input type="hidden" name="religion" value={religion} />
					<input type="hidden" name="clasificacion_economica" value={clasificacionEconomica} />
					<input type="hidden" name="profesion" value={profesion} />
					<input type="hidden" name="ocupacion_actual" value={ocupacionActual} />
					<input type="hidden" name="relacion_univ" value={esFamiliar ? familiarDe : relacionBase} />
					<input type="hidden" name="parentesco" value={parentesco} />
					<input type="hidden" name="titular_cedula" value={titularCedula} />
					<input type="hidden" name="direccion_habitacion" value={direccionHabitacion} />
					<input type="hidden" name="direccion_trabajo" value={direccionTrabajo} />
					<input type="hidden" name="emergencia_nombre" value={emergenciaNombre} />
					<input type="hidden" name="emergencia_parentesco" value={emergenciaParentesco} />
					<input type="hidden" name="emergencia_telefono" value={emergenciaTelefono} />
					<input type="hidden" name="emergencia_direccion" value={emergenciaDireccion} />
					<input type="hidden" name="alergias" value={tieneAlergias ? alergias : ''} />
					<input type="hidden" name="alertas_medicas" value={alertasMedicas} />

					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<label class="text-sm font-medium text-ink">¿Presenta alergias?</label>
							<button
								type="button"
								role="switch"
								aria-checked={tieneAlergias}
								class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {tieneAlergias ? 'bg-viking-600' : 'bg-border'}"
								onclick={() => { tieneAlergias = !tieneAlergias; }}
							>
								<span class="inline-block h-4 w-4 rounded-full bg-white transition-transform {tieneAlergias ? 'translate-x-6' : 'translate-x-1'}"></span>
							</button>
							<span class="text-sm text-ink-muted">{tieneAlergias ? 'Sí' : 'No'}</span>
						</div>

						{#if tieneAlergias}
							<Textarea label="Descripción de alergias" value={alergias} oninput={(e) => { alergias = (e.target as HTMLTextAreaElement).value; }} placeholder="Medicamentos, alimentos, otros" rows={2} />
						{/if}

						<Textarea label="Alertas médicas (condiciones crónicas)" value={alertasMedicas} oninput={(e) => { alertasMedicas = (e.target as HTMLTextAreaElement).value; }} placeholder="Ej: Diabetes, Hipertensión, Marcapasos..." rows={2} />

						<div class="px-3 py-2 bg-viking-50 dark:bg-viking-900/20 border border-viking-200 dark:border-viking-800 rounded-lg text-xs text-viking-700 dark:text-viking-300 flex items-start gap-2">
							<svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
							<span>Sus datos están protegidos bajo protocolo HIPAA/ULA.</span>
						</div>

						<div class="flex gap-3 pt-2">
							<Button type="button" variant="ghost" onclick={() => { step = 3; }}>Volver</Button>
							<Button type="submit" variant="primary" fullWidth isLoading={loading}>
								Guardar registro
							</Button>
						</div>
					</div>
				</form>
			{/if}
		</div>

		<p class="text-center text-xs text-ink-subtle mt-5">
			¿Ya tiene expediente? <a href="/portal/login" class="text-viking-600 hover:underline">Ingresar con cédula →</a>
		</p>
	</div>
</div>

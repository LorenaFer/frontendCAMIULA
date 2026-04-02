<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ActionData } from './$types';
	import Button from '$shared/components/button/Button.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import CardBody from '$shared/components/card/CardBody.svelte';
	import CardDescription from '$shared/components/card/CardDescription.svelte';
	import CardFooter from '$shared/components/card/CardFooter.svelte';
	import CardHeader from '$shared/components/card/CardHeader.svelte';
	import CardTitle from '$shared/components/card/CardTitle.svelte';
	import DateInput from '$shared/components/input/DateInput.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import PhoneInput from '$shared/components/input/PhoneInput.svelte';
	import Switch from '$shared/components/input/Switch.svelte';
	import Textarea from '$shared/components/input/Textarea.svelte';
	import Select from '$shared/components/select/Select.svelte';

	let { form }: { form: ActionData } = $props();

	const sexoOptions = [
		{ value: 'M', label: 'Masculino' },
		{ value: 'F', label: 'Femenino' }
	];

	const estadoCivilOptions = [
		{ value: 'soltero', label: 'Soltero/a' },
		{ value: 'casado', label: 'Casado/a' },
		{ value: 'divorciado', label: 'Divorciado/a' },
		{ value: 'viudo', label: 'Viudo/a' },
		{ value: 'union_libre', label: 'Union libre' }
	];

	const relacionUnivOptions = [
		{ value: 'P', label: 'P - Profesor' },
		{ value: 'E', label: 'E - Empleado' },
		{ value: 'O', label: 'O - Obrero' },
		{ value: 'F', label: 'F - Familiar' },
		{ value: 'B', label: 'B - Estudiante' },
		{ value: 'C', label: 'C - Familiar de Estudiante' },
		{ value: 'R', label: 'R - Familiar de Profesor' },
		{ value: 'S', label: 'S - Familiar de Empleado' },
		{ value: 'T', label: 'T - Familiar de Obrero' },
		{ value: 'X', label: 'X - Caso Especial' }
	];

	const sangreOptions = [
		{ value: 'O+', label: 'O+' },
		{ value: 'O-', label: 'O-' },
		{ value: 'A+', label: 'A+' },
		{ value: 'A-', label: 'A-' },
		{ value: 'B+', label: 'B+' },
		{ value: 'B-', label: 'B-' },
		{ value: 'AB+', label: 'AB+' },
		{ value: 'AB-', label: 'AB-' }
	];

	let values = $state({
		apellido: '',
		nombre: '',
		cedula: '',
		nhm: '',
		codigo_servicio: '',
		email: '',
		sexo: '',
		edad: '',
		fecha_nacimiento: '',
		pais: '',
		estado: '',
		ciudad: '',
		telefono: '',
		estado_civil: '',
		grupo_sanguineo: '',
		religion: '',
		clasificacion_economica: '',
		profesion: '',
		ocupacion_actual: '',
		direccion_habitacion: '',
		direccion_trabajo: '',
		nombre_familiar: '',
		parentesco: '',
		telefono_familiar: '',
		direccion_familiar: '',
		presenta_alergias: false,
		descripcion_alergias: '',
		otras_alertas: '',
		relacion_univ: ''
	});

	$effect(() => {
		if (form?.values) {
			values = { ...values, ...form.values };
		}
	});
</script>

<svelte:head>
  <title>Registro de Historia Medica</title>
  <meta name="description" content="Registro integral de paciente" />
</svelte:head>

<main class="p-6 lg:p-8 bg-canvas">
  <section class="max-w-6xl mx-auto space-y-6">
    <Card padding="none" class="overflow-hidden">
      <div class="h-1 w-full bg-viking-500"></div>
      <div class="px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-xl font-semibold text-ink tracking-tight">Identificacion del Paciente</h1>
          <p class="mt-1 text-xs text-ink-muted font-mono">
            Formulario de registro obligatorio · Universidad de Los Andes · Centro Ambulatorio
          </p>
        </div>
        {@render headerAction()}
      </div>
    </Card>

    <form method="POST" class="space-y-6">
      {#if form?.error}
        <Card variant="ghost" class="border-honey-300/70 dark:border-honey-700/50 bg-honey-50/70 dark:bg-honey-900/30 shadow-sm" padding="sm">
          <CardDescription class="text-honey-800 dark:text-honey-300">{form.error}</CardDescription>
        </Card>
      {/if}

      {#if form?.success}
        <Card variant="ghost" class="border-sage-300/70 dark:border-sage-700/50 bg-sage-50/70 dark:bg-sage-900/30 shadow-sm" padding="sm">
          <CardDescription class="text-sage-800 dark:text-sage-300">Paciente registrado exitosamente.</CardDescription>
        </Card>
      {/if}

      <Card padding="none">
        <CardHeader class="px-5 py-4 border-b border-border-subtle/70">
          <CardTitle class="flex items-center gap-2 text-sm font-semibold">
            <span class="inline-flex w-6 h-6 items-center justify-center rounded-md bg-viking-50 dark:bg-viking-900/30 text-viking-600 dark:text-viking-400" aria-hidden="true">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5h7.5m-7.5 4.5h7.5m-7.5 4.5h4.5M3 5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v13.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V5.25Z" />
              </svg>
            </span>
            I. Identificacion
          </CardTitle>
          <CardDescription>Datos administrativos y de afiliacion del paciente.</CardDescription>
        </CardHeader>
        <CardBody class="px-5 py-5">
          <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Input name="apellido" label="Apellidos" bind:value={values.apellido} required error={form?.fieldErrors?.apellido} placeholder="Apellidos" />
            <Input name="nombre" label="Nombres" bind:value={values.nombre} required error={form?.fieldErrors?.nombre} placeholder="Nombres" />
            <Input name="cedula" label="C.I. / Documento Identidad" bind:value={values.cedula} required error={form?.fieldErrors?.cedula} placeholder="V-00.000.000" />
            <Input name="nhm" label="Historia N. (6 digitos)" bind:value={values.nhm} placeholder="000000" />
            <Input name="codigo_servicio" label="Codigo servicio" bind:value={values.codigo_servicio} placeholder="Codigo" />
            <Input name="email" type="email" label="Correo electronico" bind:value={values.email} placeholder="email@ejemplo.com" class="xl:col-span-2" />
            <Select
              name="relacion_univ"
              label="Relacion universitaria"
              value={values.relacion_univ}
              onchange={(v) => values.relacion_univ = v}
              options={relacionUnivOptions}
              placeholder="Seleccione relacion"
              error={form?.fieldErrors?.relacion_univ}
            />
          </section>
        </CardBody>
      </Card>

      <Card padding="none">
        <CardHeader class="px-5 py-4 border-b border-border-subtle/70">
          <CardTitle class="flex items-center gap-2 text-sm font-semibold">
            <span class="inline-flex w-6 h-6 items-center justify-center rounded-md bg-viking-50 dark:bg-viking-900/30 text-viking-600 dark:text-viking-400" aria-hidden="true">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 15 0A17.933 17.933 0 0 1 12 21.75a17.933 17.933 0 0 1-7.5-1.632Z" />
              </svg>
            </span>
            II. Datos Personales y Demograficos
          </CardTitle>
          <CardDescription>Informacion demografica para historia clinica y contacto.</CardDescription>
        </CardHeader>
        <CardBody class="px-5 py-5">
          <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Select name="sexo" label="Sexo" value={values.sexo} onchange={(v) => values.sexo = v} options={sexoOptions} required error={form?.fieldErrors?.sexo} />
            <Input name="edad" label="Edad" bind:value={values.edad} placeholder="00" />
            <DateInput name="fecha_nacimiento" label="Fecha de nacimiento" value={values.fecha_nacimiento} oninput={(e) => values.fecha_nacimiento = e.target.value} />
            <Input name="pais" label="Pais" bind:value={values.pais} placeholder="Pais" />
            <Input name="estado" label="Estado" bind:value={values.estado} placeholder="Estado" />
            <Input name="ciudad" label="Ciudad" bind:value={values.ciudad} placeholder="Ciudad" />
            <PhoneInput name="telefono" label="Telefono" bind:value={values.telefono} class="xl:col-span-2" />
          </section>
        </CardBody>
      </Card>

      <Card padding="none">
        <CardHeader class="px-5 py-4 border-b border-border-subtle/70">
          <CardTitle class="flex items-center gap-2 text-sm font-semibold">
            <span class="inline-flex w-6 h-6 items-center justify-center rounded-md bg-sage-50 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400" aria-hidden="true">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 7.5h-9m9 4.5h-9m9 4.5h-9M4.5 5.25A2.25 2.25 0 0 1 6.75 3h10.5A2.25 2.25 0 0 1 19.5 5.25v13.5A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75V5.25Z" />
              </svg>
            </span>
            III. Informacion Socio-economica
          </CardTitle>
          <CardDescription>Contexto social y ocupacional para evaluacion integral.</CardDescription>
        </CardHeader>
        <CardBody class="px-5 py-5">
          <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Select name="estado_civil" label="Estado civil" value={values.estado_civil} onchange={(v) => values.estado_civil = v} options={estadoCivilOptions} />
            <Select name="grupo_sanguineo" label="Grupo sanguineo" value={values.grupo_sanguineo} onchange={(v) => values.grupo_sanguineo = v} options={sangreOptions} />
            <Input name="religion" label="Religion" bind:value={values.religion} placeholder="Religion" />
            <Input name="clasificacion_economica" label="Clasificacion economica" bind:value={values.clasificacion_economica} placeholder="Clasificacion" />
            <Input name="profesion" label="Profesion" bind:value={values.profesion} placeholder="Profesion" />
            <Input name="ocupacion_actual" label="Ocupacion actual" bind:value={values.ocupacion_actual} placeholder="Ocupacion" />
          </section>
        </CardBody>
      </Card>

      <Card padding="none">
        <CardHeader class="px-5 py-4 border-b border-border-subtle/70">
          <CardTitle class="flex items-center gap-2 text-sm font-semibold">
            <span class="inline-flex w-6 h-6 items-center justify-center rounded-md bg-honey-50 dark:bg-honey-900/30 text-honey-600 dark:text-honey-400" aria-hidden="true">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0v6A2.25 2.25 0 0 0 4.5 21h15a2.25 2.25 0 0 0 2.25-2.25v-6m-19.5 0h19.5" />
              </svg>
            </span>
            IV. Direcciones
          </CardTitle>
          <CardDescription>Domicilio y direccion laboral del paciente.</CardDescription>
        </CardHeader>
        <CardBody class="px-5 py-5 space-y-4">
          <Textarea name="direccion_habitacion" label="Direccion de habitacion completa" value={values.direccion_habitacion} oninput={(e) => values.direccion_habitacion = e.currentTarget.value} rows={2} placeholder="Direccion de domicilio" />
          <Textarea name="direccion_trabajo" label="Direccion de trabajo" value={values.direccion_trabajo} oninput={(e) => values.direccion_trabajo = e.currentTarget.value} rows={2} placeholder="Direccion laboral" />
        </CardBody>
      </Card>

      <Card padding="none">
        <CardHeader class="px-5 py-4 border-b border-border-subtle/70">
          <CardTitle class="flex items-center gap-2 text-sm font-semibold">
            <span class="inline-flex w-6 h-6 items-center justify-center rounded-md bg-viking-50 dark:bg-viking-900/30 text-viking-700 dark:text-viking-400" aria-hidden="true">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.742-.479 3 3 0 0 0-4.682-2.72m.94 3.198v.75c0 .414-.336.75-.75.75H6a.75.75 0 0 1-.75-.75v-.75m12.75 0a11.959 11.959 0 0 1-3.107 1.194m-8.643 0A11.959 11.959 0 0 1 3 18.72m3.107 1.194A11.995 11.995 0 0 0 12 21.75c2.072 0 4.018-.525 5.643-1.44M6.75 9a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0Zm10.5 1.5a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Zm-13.5 0a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z" />
              </svg>
            </span>
            V. Contacto de Emergencia / Familiar
          </CardTitle>
          <CardDescription>Persona de referencia para notificaciones y seguimiento.</CardDescription>
        </CardHeader>
        <CardBody class="px-5 py-5">
          <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="nombre_familiar" label="Nombre del familiar mas cercano" bind:value={values.nombre_familiar} placeholder="Nombre completo" />
            <Input name="parentesco" label="Parentesco" bind:value={values.parentesco} placeholder="Ej: Madre, Padre, Conyuge" />
            <PhoneInput name="telefono_familiar" label="Telefono del familiar" bind:value={values.telefono_familiar} />
            <Input name="direccion_familiar" label="Direccion del familiar" bind:value={values.direccion_familiar} class="md:col-span-2" placeholder="Direccion del contacto" />
          </section>
        </CardBody>
      </Card>

      <Card padding="none">
        <CardHeader class="px-5 py-4 border-b border-border-subtle/70">
          <CardTitle class="flex items-center gap-2 text-sm font-semibold">
            <span class="inline-flex w-6 h-6 items-center justify-center rounded-md bg-iris-50 dark:bg-iris-900/30 text-iris-600 dark:text-iris-400" aria-hidden="true">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.377c.866-1.5 3.03-1.5 3.896 0l7.355 12.75Z" />
              </svg>
            </span>
            VI. Alergias y Alertas Medicas
          </CardTitle>
          <CardDescription>Riesgos clinicos y observaciones importantes para la atencion.</CardDescription>
        </CardHeader>
        <CardBody class="px-5 py-5 space-y-4">
          <Switch
            name="presenta_alergias"
            bind:checked={values.presenta_alergias}
            label="Presenta alergias"
            description="Activa para indicar antecedentes alergicos conocidos"
          />
          <Textarea
            name="descripcion_alergias"
            label="Descripcion de alergias (medicamentos, alimentos, otros)"
            value={values.descripcion_alergias}
            oninput={(e) => values.descripcion_alergias = e.currentTarget.value}
            rows={2}
            placeholder="Detalle las alergias conocidas"
          />
          <Textarea
            name="otras_alertas"
            label="Otras alertas medicas (condiciones cronicas, observaciones criticas)"
            value={values.otras_alertas}
            oninput={(e) => values.otras_alertas = e.currentTarget.value}
            rows={2}
            placeholder="Ej: diabetes, hipertension, marcapasos, etc."
          />
        </CardBody>
      </Card>

      <Card padding="none">
        <CardFooter class="px-5 py-4 justify-end">
          <div class="flex items-center gap-2">
            <Button type="button" variant="secondary" onclick={() => goto('/patients')}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">Guardar registro</Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  </section>
</main>

{#snippet headerAction()}
  <Button
    type="button"
    variant="secondary"
    size="sm"
    class="whitespace-nowrap shrink-0"
    onclick={() => goto('/patients')}
  >
    Volver al listado
  </Button>
{/snippet}

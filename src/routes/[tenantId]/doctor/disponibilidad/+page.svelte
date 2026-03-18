<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { DisponibilidadDoctor } from '$shared/types/appointments.js';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const diasSemana: Record<number, string> = {
		1: 'Lunes',
		2: 'Martes',
		3: 'Miércoles',
		4: 'Jueves',
		5: 'Viernes'
	};

	// Agrupar bloques por día
	const bloquesPorDia = $derived.by(() => {
		const grouped: Record<number, DisponibilidadDoctor[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
		for (const b of data.bloques) {
			if (grouped[b.day_of_week]) {
				grouped[b.day_of_week].push(b);
			}
		}
		// Ordenar cada día por hora_inicio
		for (const day of Object.keys(grouped)) {
			grouped[Number(day)].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
		}
		return grouped;
	});

	// Estado del formulario de agregar bloque
	let newDia = $state('1');
	let newInicio = $state('08:00');
	let newFin = $state('12:00');
	let newDuracion = $state('30');
	let showForm = $state(false);

	const diaOpciones = [
		{ value: '1', label: 'Lunes' },
		{ value: '2', label: 'Martes' },
		{ value: '3', label: 'Miércoles' },
		{ value: '4', label: 'Jueves' },
		{ value: '5', label: 'Viernes' }
	];

	const duracionOpciones = [
		{ value: '15', label: '15 minutos' },
		{ value: '20', label: '20 minutos' },
		{ value: '30', label: '30 minutos' },
		{ value: '45', label: '45 minutos' },
		{ value: '60', label: '60 minutos' }
	];
</script>

<svelte:head>
	<title>Mi Disponibilidad — Doctor</title>
</svelte:head>

<div class="space-y-6 animate-fade-in-up">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-display text-xl font-bold text-ink">Mi Disponibilidad</h1>
			<p class="text-sm text-ink-muted mt-0.5">
				Dr. {data.doctorNombre} — Gestione sus bloques de atención semanal
			</p>
		</div>
		<Button variant="primary" onclick={() => showForm = !showForm}>
			{showForm ? 'Cancelar' : 'Agregar bloque'}
		</Button>
	</div>

	<!-- Mensajes de éxito/error -->
	{#if form?.success}
		<div class="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
			{form.message}
		</div>
	{/if}
	{#if form?.error}
		<div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
			{form.error}
		</div>
	{/if}

	<!-- Formulario de agregar bloque -->
	{#if showForm}
		<div class="bg-surface rounded-xl border border-border p-6 animate-fade-in-up">
			<h2 class="text-lg font-semibold text-ink mb-4">Nuevo bloque de disponibilidad</h2>
			<form method="POST" action="?/agregar" use:enhance={() => {
				return async ({ update }) => {
					await update();
					showForm = false;
				};
			}}>
				<div class="flex flex-wrap gap-4">
					<div class="flex-1 min-w-36">
						<Select
							label="Día de la semana"
							options={diaOpciones}
							value={newDia}
							onchange={(v) => { if (typeof v === 'string') newDia = v; }}
						/>
						<input type="hidden" name="day_of_week" value={newDia} />
					</div>
					<div class="flex-1 min-w-28">
						<Input label="Hora inicio" type="time" bind:value={newInicio} name="hora_inicio" />
					</div>
					<div class="flex-1 min-w-28">
						<Input label="Hora fin" type="time" bind:value={newFin} name="hora_fin" />
					</div>
					<div class="flex-1 min-w-36">
						<Select
							label="Duración del slot"
							options={duracionOpciones}
							value={newDuracion}
							onchange={(v) => { if (typeof v === 'string') newDuracion = v; }}
						/>
						<input type="hidden" name="duracion_slot" value={newDuracion} />
					</div>
				</div>
				<div class="mt-4">
					<Button type="submit" variant="primary">
						Guardar bloque
					</Button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Tabla de disponibilidad por día -->
	<div class="grid gap-4 md:grid-cols-5">
		{#each [1, 2, 3, 4, 5] as dia}
			<div class="bg-surface rounded-xl border border-border overflow-hidden">
				<div class="px-4 py-3 bg-viking-50 dark:bg-viking-900/20 border-b border-border">
					<h3 class="text-sm font-semibold text-ink">{diasSemana[dia]}</h3>
				</div>
				<div class="p-3 space-y-2 min-h-[120px]">
					{#if bloquesPorDia[dia].length === 0}
						<p class="text-xs text-ink-subtle text-center py-4">Sin bloques</p>
					{:else}
						{#each bloquesPorDia[dia] as bloque}
							<div class="flex items-center justify-between p-2 bg-surface-elevated rounded-lg border border-border group">
								<div>
									<p class="text-sm font-medium text-ink">
										{bloque.hora_inicio} — {bloque.hora_fin}
									</p>
									<p class="text-xs text-ink-muted">
										Slots de {bloque.duracion_slot} min
									</p>
								</div>
								<form method="POST" action="?/eliminar" use:enhance>
									<input type="hidden" name="bloqueId" value={bloque.id} />
									<button
										type="submit"
										class="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded"
										title="Eliminar bloque"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
										</svg>
									</button>
								</form>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Resumen -->
	<div class="bg-surface rounded-xl border border-border p-4">
		<h3 class="text-sm font-semibold text-ink mb-2">Resumen semanal</h3>
		<div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
			{#each [1, 2, 3, 4, 5] as dia}
				{@const totalMinutos = bloquesPorDia[dia].reduce((sum, b) => {
					const [hi, mi] = b.hora_inicio.split(':').map(Number);
					const [hf, mf] = b.hora_fin.split(':').map(Number);
					return sum + (hf * 60 + mf) - (hi * 60 + mi);
				}, 0)}
				{@const totalSlots = bloquesPorDia[dia].reduce((sum, b) => {
					const [hi, mi] = b.hora_inicio.split(':').map(Number);
					const [hf, mf] = b.hora_fin.split(':').map(Number);
					const mins = (hf * 60 + mf) - (hi * 60 + mi);
					return sum + Math.floor(mins / b.duracion_slot);
				}, 0)}
				<div class="text-center p-2 rounded-lg bg-surface-elevated">
					<p class="text-xs text-ink-muted">{diasSemana[dia]}</p>
					<p class="text-lg font-bold text-ink">{totalSlots}</p>
					<p class="text-xs text-ink-subtle">slots ({Math.floor(totalMinutos / 60)}h {totalMinutos % 60 > 0 ? `${totalMinutos % 60}m` : ''})</p>
				</div>
			{/each}
		</div>
	</div>
</div>

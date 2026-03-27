<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { Especialidad } from '$shared/types/appointments.js';
	import type { MedicalFormSchema } from '$shared/types/form-schema.js';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import Button from '$shared/components/button/Button.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tenantId = $derived($page.params.tenantId);

	// ─── Tab state ───────────────────────────────────────────
	let activeTab = $state<'especialidades' | 'formularios'>('especialidades');

	// ─── Dialog state ────────────────────────────────────────
	let showDialog = $state(false);
	let editingEsp = $state<Especialidad | null>(null);
	let nombreInput = $state('');

	function openNewDialog() {
		editingEsp = null;
		nombreInput = '';
		showDialog = true;
	}

	function openEditDialog(esp: Especialidad) {
		editingEsp = esp;
		nombreInput = esp.nombre;
		showDialog = true;
	}

	function closeDialog() {
		showDialog = false;
		editingEsp = null;
		nombreInput = '';
	}

	// ─── Schema helpers ──────────────────────────────────────
	function getSchemaForEsp(esp: Especialidad): MedicalFormSchema | undefined {
		const key = esp.nombre
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
		return data.schemas.find(
			(s) => s.specialtyId === key || s.specialtyId === esp.id
		);
	}

	function countFields(schema: MedicalFormSchema): number {
		return schema.sections.reduce(
			(total, s) => total + s.groups.reduce((gt, g) => gt + g.fields.length, 0),
			0
		);
	}
</script>

<svelte:head>
	<title>Configuración</title>
</svelte:head>

<div class="animate-fade-in-up">
	<div class="mb-6">
		<h1 class="text-display text-xl font-bold text-ink">Configuración</h1>
		<p class="text-sm text-ink-muted mt-1">Gestión de especialidades y formularios médicos</p>
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 border-b border-border mb-6">
		<button
			class="px-4 py-2.5 text-sm font-medium transition-colors relative
				{activeTab === 'especialidades' ? 'text-viking-600' : 'text-ink-muted hover:text-ink'}"
			onclick={() => (activeTab = 'especialidades')}
		>
			Especialidades
			{#if activeTab === 'especialidades'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-viking-600"></div>
			{/if}
		</button>
		<button
			class="px-4 py-2.5 text-sm font-medium transition-colors relative
				{activeTab === 'formularios' ? 'text-viking-600' : 'text-ink-muted hover:text-ink'}"
			onclick={() => (activeTab = 'formularios')}
		>
			Formularios HMD
			{#if activeTab === 'formularios'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-viking-600"></div>
			{/if}
		</button>
	</div>

	<!-- Success message -->
	{#if form?.success}
		<div class="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
			Cambios guardados correctamente.
		</div>
	{/if}

	<!-- Tab: Especialidades -->
	{#if activeTab === 'especialidades'}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<p class="text-sm text-ink-muted">{data.especialidades.length} especialidades registradas</p>
				<Button variant="primary" size="sm" onclick={openNewDialog}>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Nueva Especialidad
				</Button>
			</div>

			<!-- Table -->
			<div class="bg-surface rounded-xl border border-border/60 overflow-hidden">
				<table class="w-full">
					<thead class="bg-canvas-subtle border-b border-border">
						<tr>
							<th class="px-5 py-3 text-left text-[11px] font-medium text-ink-muted uppercase tracking-wider">Nombre</th>
							<th class="px-5 py-3 text-center text-[11px] font-medium text-ink-muted uppercase tracking-wider w-32">Estado</th>
							<th class="px-5 py-3 text-center text-[11px] font-medium text-ink-muted uppercase tracking-wider w-32">Formulario</th>
							<th class="px-5 py-3 text-right text-[11px] font-medium text-ink-muted uppercase tracking-wider w-40">Acciones</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border-subtle">
						{#each data.especialidades as esp (esp.id)}
							{@const schema = getSchemaForEsp(esp)}
							<tr class="hover:bg-canvas-subtle/50 transition-colors">
								<td class="px-5 py-3.5 text-sm text-ink font-medium">{esp.nombre}</td>
								<td class="px-5 py-3.5 text-center">
									<Badge variant={esp.activo ? 'success' : 'danger'} style="soft" size="xs">
										{esp.activo ? 'Activo' : 'Inactivo'}
									</Badge>
								</td>
								<td class="px-5 py-3.5 text-center">
									{#if schema}
										<span class="text-xs text-ink-muted">{countFields(schema)} campos</span>
									{:else}
										<span class="text-xs text-ink-subtle">Sin formulario</span>
									{/if}
								</td>
								<td class="px-5 py-3.5 text-right">
									<div class="flex items-center justify-end gap-1">
										<button
											onclick={() => openEditDialog(esp)}
											class="p-1.5 text-ink-subtle hover:text-ink hover:bg-canvas-subtle rounded-lg transition-colors
												focus-visible:ring-2 focus-visible:ring-viking-500/40 focus-visible:ring-offset-1"
											title="Editar nombre"
										>
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
											</svg>
										</button>
										<form method="POST" action="?/toggleEspecialidad" use:enhance>
											<input type="hidden" name="id" value={esp.id} />
											<button
												type="submit"
												class="p-1.5 text-ink-subtle hover:text-ink hover:bg-canvas-subtle rounded-lg transition-colors
													focus-visible:ring-2 focus-visible:ring-viking-500/40 focus-visible:ring-offset-1"
												title={esp.activo ? 'Desactivar' : 'Activar'}
											>
												{#if esp.activo}
													<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
														<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
													</svg>
												{:else}
													<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
														<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
														<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
													</svg>
												{/if}
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- Tab: Formularios HMD -->
	{#if activeTab === 'formularios'}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.especialidades.filter((e) => e.activo) as esp (esp.id)}
				{@const schema = getSchemaForEsp(esp)}
				<a
					href="/{tenantId}/admin/configuracion/form-builder?specialty={encodeURIComponent(esp.nombre)}"
					class="block bg-surface rounded-xl border border-border/60 p-5 shadow-[var(--shadow-1)]
						hover:border-viking-300 dark:hover:border-viking-700 hover:shadow-[var(--shadow-2)] transition-all group"
				>
					<div class="flex items-start justify-between mb-3">
						<h3 class="text-sm font-semibold text-ink group-hover:text-viking-600 transition-colors">{esp.nombre}</h3>
						<svg class="w-4 h-4 text-ink-subtle group-hover:text-viking-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
						</svg>
					</div>
					{#if schema}
						<div class="space-y-1.5">
							<div class="flex items-center gap-2 text-xs text-ink-muted">
								<span>{schema.sections.length} secciones</span>
								<span class="text-border">|</span>
								<span>{countFields(schema)} campos</span>
							</div>
							<div class="flex items-center gap-1.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
								<span class="text-xs text-emerald-600 dark:text-emerald-400">Formulario configurado</span>
							</div>
						</div>
					{:else}
						<div class="flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
							<span class="text-xs text-amber-600 dark:text-amber-400">Sin formulario — usa Medicina General</span>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- Dialog: Nueva / Editar Especialidad -->
<Dialog open={showDialog} onClose={closeDialog} size="sm">
	<DialogHeader>
		<h2 class="text-base font-semibold text-ink">
			{editingEsp ? 'Editar Especialidad' : 'Nueva Especialidad'}
		</h2>
	</DialogHeader>

	<form
		method="POST"
		action="?/guardarEspecialidad"
		use:enhance={() => {
			return ({ result }) => {
				if (result.type === 'success') closeDialog();
			};
		}}
	>
		<DialogBody>
			{#if editingEsp}
				<input type="hidden" name="id" value={editingEsp.id} />
			{/if}

			<div>
				<label for="esp-nombre" class="block text-sm font-medium text-ink mb-1.5">
					Nombre de la especialidad
				</label>
				<input
					id="esp-nombre"
					name="nombre"
					type="text"
					bind:value={nombreInput}
					placeholder="Ej: Cardiología"
					required
					class="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						placeholder:text-ink-subtle hover:border-border-strong focus:border-border-strong
						focus:ring-2 focus:ring-border-subtle outline-none transition-all"
				/>
			</div>
		</DialogBody>

		<DialogFooter>
			<Button variant="ghost" onclick={closeDialog}>Cancelar</Button>
			<Button variant="primary" type="submit">
				{editingEsp ? 'Guardar cambios' : 'Crear especialidad'}
			</Button>
		</DialogFooter>
	</form>
</Dialog>

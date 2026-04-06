<script lang="ts">
	import type { PageData } from './$types';
	import SchemaBuilder from '$shared/components/form-builder/SchemaBuilder.svelte';
	import { FormBuilderStore } from '$shared/components/form-builder/FormBuilderStore.svelte.js';
	import FormEngine from '$shared/components/form-engine/FormEngine.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';

	let { data }: { data: PageData } = $props();

	// Initialize store — si el schema cargado es un fallback (otra especialidad),
	// sobreescribir el nombre para que coincida con la especialidad que se edita
	const loadedSchema = data.schema ?? {
		id: '',
		version: '1.0',
		specialtyId: '',
		specialtyName: data.specialtyName,
		sections: []
	};

	// Si el schema es fallback de otra especialidad, mantener secciones pero corregir nombre
	if (data.specialtyName && loadedSchema.specialtyName !== data.specialtyName) {
		loadedSchema.specialtyName = data.specialtyName;
		loadedSchema.specialtyId = data.specialtyName
			.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
		loadedSchema.id = '';
	}

	const store = new FormBuilderStore(loadedSchema);

	let saving = $state(false);

	async function handleSave() {
		const errors = store.getErrors();
		if (errors.length > 0) {
			toastError('Errores en el formulario', errors.join(', '));
			return;
		}
		saving = true;
		try {
			const fd = new FormData();
			fd.set('schema', JSON.stringify(store.toJSON()));
			const res = await fetch('?/guardarSchema', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const text = await res.text();
			const { deserialize } = await import('$app/forms');
			const result = deserialize(text);
			if (result.type === 'success') {
				toastSuccess('Formulario guardado', `${data.specialtyName} actualizado correctamente.`);
			} else if (result.type === 'failure') {
				toastError('Error al guardar', (result.data as Record<string, string>)?.error ?? 'No se pudo guardar.');
			}
		} catch {
			toastError('Error', 'Error de conexión al guardar.');
		} finally {
			saving = false;
		}
	}

	// Noop save for preview FormEngine (read-only, never actually saves)
	async function noopSave() {}
</script>

<svelte:head>
	<title>Form Builder — {data.specialtyName || 'Nueva'}</title>
</svelte:head>

<div class="animate-fade-in-up">
	<!-- Breadcrumb + Header -->
	<div class="mb-5 space-y-3">
		<div class="flex items-center gap-2 text-sm text-ink-muted">
			<a href="/admin/configuracion" class="hover:text-ink transition-colors">Configuración</a>
			<span>›</span>
			<span class="text-ink">Form Builder</span>
		</div>

		<div class="flex items-start justify-between flex-wrap gap-3">
			<div>
				<h1 class="text-display text-xl font-bold text-ink">
					{data.specialtyName || 'Nuevo Formulario'}
				</h1>
				<p class="text-sm text-ink-muted mt-0.5">
					Diseña el formulario de evaluación médica para esta especialidad
				</p>
			</div>

			<Button variant="primary" onclick={handleSave} disabled={saving} isLoading={saving}>
				{#if !saving}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
				{/if}
				{saving ? 'Guardando...' : 'Guardar formulario'}
			</Button>
		</div>
	</div>

	<!-- Split layout: Builder | Preview -->
	<div class="builder-layout">
		<!-- LEFT: Schema Builder -->
		<div class="min-w-0 overflow-y-auto max-h-[calc(100vh-10rem)] scrollbar-thin">
			<div class="pr-2">
				<SchemaBuilder {store} />
			</div>
		</div>

		<!-- RIGHT: Live Preview -->
		<div class="min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:scrollbar-thin">
			<div class="bg-canvas-subtle rounded-xl border border-border p-4">
				<div class="flex items-center gap-2 mb-3">
					<svg class="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
					</svg>
					<span class="text-xs font-medium text-ink-muted">Vista previa</span>
				</div>

				{#if store.schema.sections.length > 0}
					{#key store.revision}
						<FormEngine
							schema={store.schema}
							readonly={true}
							onSave={noopSave}
						/>
					{/key}
				{:else}
					<div class="py-12 text-center text-sm text-ink-subtle">
						Agrega secciones y campos para ver la vista previa
					</div>
				{/if}
			</div>
		</div>
	</div>

</div>

<style>
	.builder-layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 1024px) {
		.builder-layout {
			grid-template-columns: 55fr 45fr;
			gap: 1.5rem;
			align-items: start;
		}
	}
</style>

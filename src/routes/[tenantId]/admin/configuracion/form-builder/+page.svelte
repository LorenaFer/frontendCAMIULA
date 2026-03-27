<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import SchemaBuilder from '$shared/components/form-builder/SchemaBuilder.svelte';
	import { FormBuilderStore } from '$shared/components/form-builder/FormBuilderStore.svelte.js';
	import FormEngine from '$shared/components/form-engine/FormEngine.svelte';
	import Button from '$shared/components/button/Button.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tenantId = $derived($page.params.tenantId);

	// Initialize store with existing schema or blank for new specialty
	const store = new FormBuilderStore(
		data.schema ?? {
			id: '',
			version: '1.0',
			specialtyId: '',
			specialtyName: data.specialtyName,
			sections: []
		}
	);

	// Hidden form data
	let schemaJson = $state('');
	let saving = $state(false);

	function handleSave() {
		const errors = store.getErrors();
		if (errors.length > 0) {
			alert('Errores:\n' + errors.join('\n'));
			return;
		}
		schemaJson = JSON.stringify(store.toJSON());
		// Tick for Svelte binding update
		requestAnimationFrame(() => {
			const hiddenForm = document.getElementById('schema-form') as HTMLFormElement;
			hiddenForm?.requestSubmit();
		});
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
			<a href="/{tenantId}/admin/configuracion" class="hover:text-ink transition-colors">Configuración</a>
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

	<!-- Success message -->
	{#if form?.success}
		<div class="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
			Formulario guardado correctamente.
		</div>
	{/if}

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

	<!-- Hidden form for SvelteKit action -->
	<form
		id="schema-form"
		method="POST"
		action="?/guardarSchema"
		class="hidden"
		use:enhance={() => {
			saving = true;
			return ({ result }) => {
				saving = false;
				if (result.type === 'success') {
					// Stay on page
				}
			};
		}}
	>
		<input type="hidden" name="schema" value={schemaJson} />
	</form>
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

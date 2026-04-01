<script lang="ts">
	import type { MedicalFormSchema } from '$shared/types/form-schema.js';
	import { FormStore } from './FormStore.svelte.js';
	import FormSection from './FormSection.svelte';
	import AutosaveIndicator from './AutosaveIndicator.svelte';
	import { toastError } from '$shared/components/toast/toast.svelte.js';

	interface Props {
		schema: MedicalFormSchema;
		initialData?: Record<string, unknown>;
		readonly?: boolean;
		onSave: (data: Record<string, unknown>) => Promise<void>;
		onAutosave?: (data: Record<string, unknown>) => Promise<void>;
		class?: string;
	}

	let {
		schema,
		initialData = {},
		readonly: isReadonly = false,
		onSave,
		onAutosave,
		class: className = ''
	}: Props = $props();

	const store = new FormStore(schema, initialData, {
		autosaveCallback: onAutosave,
		autosaveDelay: 3000
	});

	// Exponer el store para que el padre pueda acceder a isDirty, isSaving, etc.
	export { store };

	$effect(() => {
		return () => store.destroy();
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (isReadonly) return;

		// Validar — si hay errores, mostrar toast con nombres de campos
		store.validateAll();
		if (store.errorCount > 0) {
			const fieldNames = store.getErrorFieldNames();
			toastError(
				`${store.errorCount} campo${store.errorCount > 1 ? 's' : ''} con errores`,
				fieldNames.length > 0 ? `Revise: ${fieldNames.join(', ')}` : 'Revise los campos marcados.'
			);
			return;
		}

		// Guardar directamente (validación ya pasó)
		store.isSaving = true;
		try {
			await onSave(store.getSubmitData());
			// Limpiar dirty state
			store.markClean();
		} catch {
			toastError('Error al guardar', 'Ocurrió un error inesperado.');
		} finally {
			store.isSaving = false;
		}
	}
</script>

<form class="space-y-4 {className}" onsubmit={handleSubmit}>
	{#each schema.sections as section (section.id)}
		<FormSection {section} {store} formData={store.data} disabled={isReadonly} />
	{/each}

	<!-- Footer: Save button + Autosave indicator -->
	{#if !isReadonly}
		<div class="flex items-center justify-between gap-3 pt-3 border-t border-border">
			<AutosaveIndicator
				isSaving={store.isSaving}
				lastSavedAt={store.lastSavedAt}
				isDirty={store.isDirty}
			/>

			<button
				type="submit"
				disabled={store.isSaving}
				class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
					bg-viking-600 text-white hover:bg-viking-700 active:bg-viking-800
					disabled:opacity-60 disabled:cursor-not-allowed
					transition-colors duration-150"
			>
				{#if store.isSaving}
					<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						></path>
					</svg>
					Guardando...
				{:else}
					Guardar evaluación
				{/if}
			</button>
		</div>
	{/if}

	<!-- Errores se muestran via Toast -->
</form>

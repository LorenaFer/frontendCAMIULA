<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import FormEngine from '$shared/components/form-engine/FormEngine.svelte';

	let { data }: { data: PageData } = $props();

	const tenantId = $derived($page.params.tenantId);

	let formEngineRef: { store: import('$shared/components/form-engine/FormStore.svelte.js').FormStore } | undefined;
	let lastSubmitData = $state<string>('');
	let showSchema = $state(false);

	function handleSpecialtyChange(value: string) {
		goto(`/${tenantId}/doctor/form-preview?specialty=${value}`, { replaceState: true });
	}

	async function handleSave(formData: Record<string, unknown>) {
		lastSubmitData = JSON.stringify(formData, null, 2);
	}
</script>

<svelte:head>
	<title>Form Preview — {data.formSchema.specialtyName}</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
	<!-- Header -->
	<div class="flex items-center gap-2 text-sm text-ink-muted">
		<a href="/{tenantId}/doctor/citas" class="hover:text-ink transition-colors">Mis citas</a>
		<span>›</span>
		<span class="text-ink">Preview de Formularios</span>
	</div>

	<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
		<div>
			<h1 class="text-display text-xl font-bold text-ink">Form Engine Preview</h1>
			<p class="text-sm text-ink-muted mt-1">
				Prueba los formularios dinámicos por especialidad. Los datos no se persisten.
			</p>
		</div>

		<div class="w-64">
			<label for="specialty-select" class="block text-sm font-medium text-ink mb-1.5">Especialidad</label>
			<select
				id="specialty-select"
				class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink cursor-pointer hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
				value={data.selectedKey}
				onchange={(e) => handleSpecialtyChange((e.target as HTMLSelectElement).value)}
			>
				{#each data.availableSpecialties as spec (spec.key)}
					<option value={spec.key}>{spec.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Schema info bar -->
	<div class="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-canvas-subtle rounded-lg border border-border text-xs text-ink-muted">
		<span>
			<b class="text-ink">Schema:</b> {data.formSchema.id}
		</span>
		<span>
			<b class="text-ink">Versión:</b> {data.formSchema.version}
		</span>
		<span>
			<b class="text-ink">Secciones:</b> {data.formSchema.sections.length}
		</span>
		<span>
			<b class="text-ink">Campos:</b> {data.formSchema.sections.reduce((acc, s) => acc + s.groups.reduce((a, g) => a + g.fields.length, 0), 0)}
		</span>

		<button
			type="button"
			class="ml-auto text-viking-600 dark:text-viking-400 hover:underline text-xs font-medium"
			onclick={() => (showSchema = !showSchema)}
		>
			{showSchema ? 'Ocultar' : 'Ver'} JSON Schema
		</button>
	</div>

	<!-- Schema JSON (toggle) -->
	{#if showSchema}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<pre
				class="p-4 text-xs text-ink-muted overflow-x-auto max-h-96 font-mono leading-relaxed"
			>{JSON.stringify(data.formSchema, null, 2)}</pre>
		</div>
	{/if}

	<!-- Form Engine -->
	<div class="bg-surface-elevated rounded-xl border border-border p-6">
		{#key data.selectedKey}
			<FormEngine
				bind:this={formEngineRef}
				schema={data.formSchema}
				initialData={{}}
				onSave={handleSave}
			/>
		{/key}
	</div>

	<!-- Store debug info -->
	{#if formEngineRef?.store}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
			<div class="px-3 py-2 rounded-lg bg-canvas-subtle border border-border text-center">
				<p class="text-[10px] text-ink-muted uppercase tracking-wider">Dirty</p>
				<p class="text-sm font-semibold text-ink">
					{formEngineRef.store.isDirty ? 'Sí' : 'No'}
				</p>
			</div>
			<div class="px-3 py-2 rounded-lg bg-canvas-subtle border border-border text-center">
				<p class="text-[10px] text-ink-muted uppercase tracking-wider">Válido</p>
				<p class="text-sm font-semibold text-ink">
					{formEngineRef.store.isValid ? 'Sí' : 'No'}
				</p>
			</div>
			<div class="px-3 py-2 rounded-lg bg-canvas-subtle border border-border text-center">
				<p class="text-[10px] text-ink-muted uppercase tracking-wider">Errores</p>
				<p class="text-sm font-semibold text-ink">{formEngineRef.store.errorCount}</p>
			</div>
			<div class="px-3 py-2 rounded-lg bg-canvas-subtle border border-border text-center">
				<p class="text-[10px] text-ink-muted uppercase tracking-wider">Último guardado</p>
				<p class="text-sm font-semibold text-ink">
					{formEngineRef.store.lastSavedAt ?? '—'}
				</p>
			</div>
		</div>
	{/if}

	<!-- Submit data output -->
	{#if lastSubmitData}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
				<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
					Datos enviados (último submit)
				</h3>
				<button
					type="button"
					class="text-xs text-viking-600 dark:text-viking-400 hover:underline"
					onclick={() => (lastSubmitData = '')}
				>
					Limpiar
				</button>
			</div>
			<pre
				class="p-4 text-xs text-ink-muted overflow-x-auto max-h-72 font-mono leading-relaxed"
			>{lastSubmitData}</pre>
		</div>
	{/if}
</div>

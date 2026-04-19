<script lang="ts">
	import type { Especialidad } from '$domain/staff/types.js';
	import type { MedicalFormSchema } from '$domain/medical-records/form-schema.js';

	interface Props {
		especialidades: Especialidad[];
		getSchemaForEsp: (esp: Especialidad) => MedicalFormSchema | undefined;
		countFields: (schema: MedicalFormSchema) => number;
	}

	let { especialidades, getSchemaForEsp, countFields }: Props = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
	{#each especialidades.filter((e: Especialidad) => e.activo) as esp (esp.id)}
		{@const schema = getSchemaForEsp(esp)}
		<a
			href="/admin/configuracion/form-builder?specialty={encodeURIComponent(esp.nombre)}"
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

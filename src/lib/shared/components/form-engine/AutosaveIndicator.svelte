<script lang="ts">
	interface Props {
		isSaving: boolean;
		lastSavedAt: string | null;
		isDirty: boolean;
	}

	let { isSaving, lastSavedAt, isDirty }: Props = $props();
</script>

<div class="flex items-center gap-2 text-xs text-ink-muted">
	{#if isSaving}
		<div class="flex items-center gap-1.5">
			<svg class="w-3.5 h-3.5 animate-spin text-viking-500" viewBox="0 0 24 24" fill="none">
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
			<span>Guardando...</span>
		</div>
	{:else if lastSavedAt}
		<div class="flex items-center gap-1.5">
			<svg
				class="w-3.5 h-3.5 text-emerald-500"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
			</svg>
			<span>Guardado a las {lastSavedAt}</span>
		</div>
	{:else if isDirty}
		<div class="flex items-center gap-1.5">
			<div class="w-2 h-2 rounded-full bg-honey-400"></div>
			<span>Cambios sin guardar</span>
		</div>
	{:else}
		<span class="opacity-0">—</span>
	{/if}
</div>

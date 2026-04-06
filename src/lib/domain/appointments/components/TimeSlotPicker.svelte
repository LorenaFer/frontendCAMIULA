<script lang="ts">
	import type { TimeSlot } from '$domain/appointments/types.js';

	interface Props {
		slots: TimeSlot[];
		selected?: string;
		onSelect: (slot: TimeSlot) => void;
		class?: string;
	}

	let { slots, selected, onSelect, class: className = '' }: Props = $props();
	const availableCount = $derived(slots.filter((s) => s.disponible).length);
</script>

<div class={className}>
	{#if slots.length === 0}
		<p class="text-xs text-ink-muted text-center py-3">No hay horarios disponibles.</p>
	{:else}
		<p class="text-[10px] sm:text-xs text-ink-muted mb-2">
			{availableCount} de {slots.length} disponibles
		</p>

		<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
			{#each slots as slot (slot.hora_inicio)}
				<button
					type="button"
					disabled={!slot.disponible}
					onclick={() => slot.disponible && onSelect(slot)}
					class="py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors text-center
						{slot.disponible
							? selected === slot.hora_inicio
								? 'bg-viking-600 text-white border-viking-600'
								: 'bg-surface border-border/60 text-ink hover:bg-viking-50 dark:hover:bg-viking-900/20 hover:border-viking-400'
							: 'bg-canvas-subtle border-border/40 text-ink-subtle cursor-not-allowed line-through opacity-40'}"
					aria-pressed={selected === slot.hora_inicio}
					aria-label="{slot.hora_inicio}–{slot.hora_fin}{!slot.disponible ? ' (ocupado)' : ''}"
				>
					{slot.hora_inicio}
				</button>
			{/each}
		</div>
	{/if}
</div>

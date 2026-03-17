<script lang="ts">
	import type { TimeSlot } from '$shared/types/appointments.js';

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
		<p class="text-sm text-ink-muted text-center py-4">
			No hay horarios disponibles para este día.
		</p>
	{:else}
		<p class="text-xs text-ink-muted mb-3">
			{availableCount} de {slots.length} horarios disponibles
		</p>

		<!-- Usar flex-wrap para compat Chrome 49 (sin CSS grid) -->
		<div class="flex flex-wrap gap-2">
			{#each slots as slot (slot.hora_inicio)}
				<button
					type="button"
					disabled={!slot.disponible}
					onclick={() => slot.disponible && onSelect(slot)}
					class="
						px-3 py-2 rounded text-sm font-medium border transition-colors
						{slot.disponible
							? selected === slot.hora_inicio
								? 'bg-viking-600 text-white border-viking-600'
								: 'bg-surface border-border text-ink hover:bg-viking-50 dark:hover:bg-viking-900/20 hover:border-viking-400'
							: 'bg-surface-muted border-border text-ink-subtle cursor-not-allowed line-through opacity-50'}
					"
					aria-pressed={selected === slot.hora_inicio}
					aria-label="{slot.hora_inicio} — {slot.hora_fin}{!slot.disponible ? ' (ocupado)' : ''}"
				>
					{slot.hora_inicio}
				</button>
			{/each}
		</div>
	{/if}
</div>

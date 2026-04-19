<script lang="ts">
	/*
	 * DoctorAvailabilityCalendar — lista de fechas disponibles.
	 * Muestra SOLO los días con disponibilidad como chips seleccionables.
	 */

	interface Props {
		year: number;
		month: number;
		availableDates: string[];
		minDate: string;
		selected?: string;
		onSelect: (date: string) => void;
		onMonthChange: (year: number, month: number) => void;
		class?: string;
	}

	let { year, month, availableDates, minDate, selected, onSelect, onMonthChange, class: className = '' }: Props = $props();

	const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
	const DAY_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

	const monthDates = $derived(
		availableDates.filter((d) => { const [y, m] = d.split('-').map(Number); return y === year && m === month && d >= minDate; }).sort()
	);

	function formatChip(iso: string) {
		const [y, m, d] = iso.split('-').map(Number);
		return { dayName: DAY_SHORT[new Date(y, m - 1, d).getDay()], day: d };
	}

	function prevMonth() { if (month === 1) onMonthChange(year - 1, 12); else onMonthChange(year, month - 1); }
	function nextMonth() { if (month === 12) onMonthChange(year + 1, 1); else onMonthChange(year, month + 1); }
</script>

<div class="select-none {className}">
	<!-- Month nav -->
	<div class="flex items-center justify-center gap-4 mb-3">
		<button type="button" onclick={prevMonth} class="p-1 rounded hover:bg-surface-elevated text-ink-muted hover:text-ink transition-colors" aria-label="Mes anterior">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
		</button>
		<span class="text-sm font-semibold text-ink min-w-[120px] text-center">{MONTH_NAMES[month - 1]} {year}</span>
		<button type="button" onclick={nextMonth} class="p-1 rounded hover:bg-surface-elevated text-ink-muted hover:text-ink transition-colors" aria-label="Mes siguiente">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
		</button>
	</div>

	<!-- Date chips -->
	{#if monthDates.length === 0}
		<div class="py-6 text-center">
			<p class="text-xs text-ink-muted">Sin fechas disponibles este mes.</p>
			<p class="text-[10px] text-ink-subtle mt-1">Prueba con el mes siguiente.</p>
		</div>
	{:else}
		<div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-1.5 sm:gap-2">
			{#each monthDates as date (date)}
				{@const chip = formatChip(date)}
				{@const isSelected = date === selected}
				<button
					type="button"
					onclick={() => onSelect(date)}
					class="flex flex-col items-center py-1.5 sm:py-2 rounded-lg border text-center transition-colors
						{isSelected
							? 'bg-viking-600 border-viking-600 text-white'
							: 'bg-surface border-border/60 text-ink hover:border-viking-400 hover:bg-viking-50 dark:hover:bg-viking-900/20'}"
					aria-pressed={isSelected}
				>
					<span class="text-[10px] sm:text-xs {isSelected ? 'text-viking-100' : 'text-ink-muted'}">{chip.dayName}</span>
					<span class="text-sm sm:text-base font-semibold leading-tight">{chip.day}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

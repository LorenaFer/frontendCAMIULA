<script lang="ts">
	/*
	 * DoctorAvailabilityCalendar — lista de fechas disponibles.
	 *
	 * Muestra SOLO los días con disponibilidad como chips seleccionables.
	 * Sin grid de calendario — no hay razón para mostrar días sin slots.
	 */

	interface Props {
		year: number;
		month: number; // 1–12
		availableDates: string[]; // ISO dates que tienen slots libres
		minDate: string; // ISO date mínima (hoy + 2 días)
		selected?: string;
		onSelect: (date: string) => void;
		onMonthChange: (year: number, month: number) => void;
		class?: string;
	}

	let {
		year,
		month,
		availableDates,
		minDate,
		selected,
		onSelect,
		onMonthChange,
		class: className = ''
	}: Props = $props();

	const MONTH_NAMES = [
		'Enero','Febrero','Marzo','Abril','Mayo','Junio',
		'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
	];

	const DAY_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

	// Solo fechas del mes actual que superan el buffer
	const monthDates = $derived(
		availableDates
			.filter((d) => {
				const [y, m] = d.split('-').map(Number);
				return y === year && m === month && d >= minDate;
			})
			.sort()
	);

	function formatChip(iso: string): { dayName: string; day: number } {
		const [y, m, d] = iso.split('-').map(Number);
		const date = new Date(y, m - 1, d);
		return { dayName: DAY_SHORT[date.getDay()], day: d };
	}

	function prevMonth() {
		if (month === 1) onMonthChange(year - 1, 12);
		else onMonthChange(year, month - 1);
	}

	function nextMonth() {
		if (month === 12) onMonthChange(year + 1, 1);
		else onMonthChange(year, month + 1);
	}
</script>

<div class="select-none {className}">
	<!-- Navegación de mes -->
	<div class="flex items-center justify-between mb-4">
		<button
			type="button"
			onclick={prevMonth}
			class="p-1.5 rounded hover:bg-surface-elevated text-ink-muted hover:text-ink transition-colors"
			aria-label="Mes anterior"
		>
			&#8249;
		</button>
		<span class="text-sm font-semibold text-ink">
			{MONTH_NAMES[month - 1]} {year}
		</span>
		<button
			type="button"
			onclick={nextMonth}
			class="p-1.5 rounded hover:bg-surface-elevated text-ink-muted hover:text-ink transition-colors"
			aria-label="Mes siguiente"
		>
			&#8250;
		</button>
	</div>

	<!-- Chips de fechas disponibles -->
	{#if monthDates.length === 0}
		<div class="py-8 text-center">
			<p class="text-sm text-ink-muted">Sin fechas disponibles este mes.</p>
			<p class="text-xs text-ink-subtle mt-1">Prueba con el mes siguiente.</p>
		</div>
	{:else}
		<div class="flex flex-wrap gap-2">
			{#each monthDates as date (date)}
				{@const chip = formatChip(date)}
				{@const isSelected = date === selected}
				<button
					type="button"
					onclick={() => onSelect(date)}
					class="
						flex flex-col items-center px-3 py-2 rounded-lg border text-sm font-medium
						transition-colors min-w-[56px]
						{isSelected
							? 'bg-viking-600 border-viking-600 text-white'
							: 'bg-surface border-border text-ink hover:border-viking-400 hover:bg-viking-50 dark:hover:bg-viking-900/20'}
					"
					aria-pressed={isSelected}
					aria-label="{chip.dayName} {chip.day} de {MONTH_NAMES[month - 1]}"
				>
					<span class="text-xs {isSelected ? 'text-viking-100' : 'text-ink-muted'}">{chip.dayName}</span>
					<span class="text-base leading-tight">{chip.day}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

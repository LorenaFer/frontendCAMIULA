<script lang="ts">
	import { browser } from '$app/environment';

	type InputSize = 'sm' | 'md' | 'lg';

	interface Props {
		name?: string;
		label?: string;
		error?: string;
		hint?: string;
		inputSize?: InputSize;
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		oninput?: (e: { target: { value: string } }) => void;
	}

	let {
		name,
		inputSize = 'md',
		label,
		error,
		hint,
		value = $bindable(''),
		placeholder = 'Seleccionar fecha',
		disabled = false,
		class: className = '',
		oninput
	}: Props = $props();

	// ─── State ───────────────────────────────────────────────
	let open = $state(false);
	let mode = $state<'days' | 'months' | 'years'>('days');
	let viewYear = $state(new Date().getFullYear());
	let viewMonth = $state(new Date().getMonth());
	let yearPageStart = $state(Math.floor(new Date().getFullYear() / 12) * 12);
	let pickerRef: HTMLDivElement;
	let triggerRef: HTMLDivElement;

	// Sync view when value changes externally
	$effect(() => {
		if (value) {
			const d = parseISO(value);
			if (d) {
				viewYear = d.getFullYear();
				viewMonth = d.getMonth();
			}
		}
	});

	// Click outside
	$effect(() => {
		if (!open || !browser) return;
		function handleClick(e: MouseEvent) {
			const t = e.target as Node;
			if (pickerRef && !pickerRef.contains(t) && triggerRef && !triggerRef.contains(t)) {
				open = false;
				mode = 'days';
			}
		}
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	});

	// ─── Helpers ─────────────────────────────────────────────
	function parseISO(s: string): Date | null {
		const [y, m, d] = s.split('-').map(Number);
		if (!y || !m || !d) return null;
		return new Date(y, m - 1, d);
	}

	function toISO(y: number, m: number, d: number): string {
		return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
	}

	function formatDisplay(iso: string): string {
		const d = parseISO(iso);
		if (!d) return '';
		return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function emit(newValue: string) {
		value = newValue;
		oninput?.({ target: { value: newValue } });
	}

	// ─── Calendar data ──────────────────────────────────────
	const DAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
	const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
	const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

	const today = new Date();
	const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

	let calendarDays = $derived.by(() => {
		const first = new Date(viewYear, viewMonth, 1);
		let startDow = first.getDay() - 1;
		if (startDow < 0) startDow = 6;
		const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
		const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

		const cells: { day: number; month: number; year: number; current: boolean }[] = [];

		for (let i = startDow - 1; i >= 0; i--) {
			const pm = viewMonth === 0 ? 11 : viewMonth - 1;
			const py = viewMonth === 0 ? viewYear - 1 : viewYear;
			cells.push({ day: daysInPrev - i, month: pm, year: py, current: false });
		}
		for (let d = 1; d <= daysInMonth; d++) {
			cells.push({ day: d, month: viewMonth, year: viewYear, current: true });
		}
		const remaining = 42 - cells.length;
		for (let d = 1; d <= remaining; d++) {
			const nm = viewMonth === 11 ? 0 : viewMonth + 1;
			const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
			cells.push({ day: d, month: nm, year: ny, current: false });
		}
		return cells;
	});

	let yearGrid = $derived(
		Array.from({ length: 12 }, (_, i) => yearPageStart + i)
	);

	function isSelected(day: number, month: number, year: number) {
		return value === toISO(year, month, day);
	}
	function isTodayCell(day: number, month: number, year: number) {
		return todayISO === toISO(year, month, day);
	}

	// ─── Actions ─────────────────────────────────────────────
	function selectDay(day: number, month: number, year: number) {
		emit(toISO(year, month, day));
		open = false;
		mode = 'days';
	}

	function selectMonth(m: number) {
		viewMonth = m;
		mode = 'days';
	}

	function selectYear(y: number) {
		viewYear = y;
		mode = 'months';
	}

	function goToday() {
		const now = new Date();
		emit(toISO(now.getFullYear(), now.getMonth(), now.getDate()));
		open = false;
		mode = 'days';
	}

	function clearValue() {
		emit('');
		open = false;
		mode = 'days';
	}

	function prevView() {
		if (mode === 'days') {
			if (viewMonth === 0) { viewMonth = 11; viewYear--; }
			else viewMonth--;
		} else if (mode === 'months') {
			viewYear--;
		} else {
			yearPageStart -= 12;
		}
	}

	function nextView() {
		if (mode === 'days') {
			if (viewMonth === 11) { viewMonth = 0; viewYear++; }
			else viewMonth++;
		} else if (mode === 'months') {
			viewYear++;
		} else {
			yearPageStart += 12;
		}
	}

	function toggleMode() {
		if (mode === 'days') mode = 'months';
		else if (mode === 'months') mode = 'years';
		else mode = 'days';
	}

	// ─── Position for popover (fixed to work inside dialogs) ─
	let popoverStyle = $state('');

	function updatePopoverPosition() {
		if (!triggerRef) return;
		const rect = triggerRef.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const openAbove = spaceBelow < 340 && rect.top > 340;
		if (openAbove) {
			popoverStyle = `position:fixed; left:${rect.left}px; bottom:${window.innerHeight - rect.top + 4}px;`;
		} else {
			popoverStyle = `position:fixed; left:${rect.left}px; top:${rect.bottom + 4}px;`;
		}
	}

	// ─── Styles ──────────────────────────────────────────────
	const sizeStyles: Record<InputSize, string> = {
		sm: 'h-8 px-2.5 text-sm gap-1.5',
		md: 'h-9 px-3 text-sm gap-2',
		lg: 'h-10 px-3.5 text-sm gap-2'
	};
</script>

<div class="w-full relative" bind:this={triggerRef}>
	{#if label}
		<label class="block text-sm font-medium text-ink mb-1.5">{label}</label>
	{/if}

	<!-- Trigger button -->
	<button
		type="button"
		{disabled}
		class="w-full flex items-center rounded-lg border bg-surface-elevated text-ink
			transition-all duration-150 focus:outline-none text-left
			{sizeStyles[inputSize]}
			{open
				? 'border-viking-400 ring-2 ring-viking-100/60 dark:ring-viking-900/40'
				: error
					? 'border-red-300 dark:border-red-700'
					: 'border-border hover:border-border-strong'}
			{disabled ? 'opacity-60 cursor-not-allowed bg-canvas-subtle' : 'cursor-pointer'}
			{className}"
		onclick={() => { if (!disabled) { open = !open; mode = 'days'; if (!open) return; updatePopoverPosition(); } }}
	>
		<svg class="w-4 h-4 text-ink-subtle shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
		</svg>
		<span class="flex-1 truncate {value ? 'text-ink' : 'text-ink-subtle'}">
			{value ? formatDisplay(value) : placeholder}
		</span>
		{#if value && !disabled}
			<button
				type="button"
				class="p-0.5 rounded hover:bg-canvas-subtle text-ink-subtle hover:text-ink transition-colors -mr-1"
				onclick={(e) => { e.stopPropagation(); clearValue(); }}
				tabindex="-1"
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</button>

	{#if name}
		<input type="hidden" {name} {value} />
	{/if}

	{#if error || hint}
		<p class="mt-1.5 text-xs {error ? 'text-red-600 animate-slide-down' : 'text-ink-muted'}">
			{error || hint}
		</p>
	{/if}

	<!-- Popover Calendar -->
	{#if open}
		<div
			bind:this={pickerRef}
			style={popoverStyle}
			class="z-[9999] w-[280px]
				bg-surface-elevated rounded-xl border border-border
				shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
				animate-fade-in overflow-hidden"
		>
			<!-- Navigation header -->
			<div class="flex items-center justify-between px-3 pt-3 pb-2">
				<button
					type="button"
					class="w-7 h-7 inline-flex items-center justify-center rounded-md
						hover:bg-canvas-subtle text-ink-muted hover:text-ink transition-colors"
					onclick={prevView}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
					</svg>
				</button>

				<!-- Center label — clickable to zoom out -->
				<button
					type="button"
					class="px-2 py-1 rounded-md text-sm font-semibold text-ink
						hover:bg-canvas-subtle transition-colors"
					onclick={toggleMode}
				>
					{#if mode === 'days'}
						{MONTHS_FULL[viewMonth]} {viewYear}
					{:else if mode === 'months'}
						{viewYear}
					{:else}
						{yearPageStart} — {yearPageStart + 11}
					{/if}
				</button>

				<button
					type="button"
					class="w-7 h-7 inline-flex items-center justify-center rounded-md
						hover:bg-canvas-subtle text-ink-muted hover:text-ink transition-colors"
					onclick={nextView}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
					</svg>
				</button>
			</div>

			<!-- DAY VIEW -->
			{#if mode === 'days'}
				<!-- Day-of-week headers -->
				<div class="grid grid-cols-7 px-3">
					{#each DAYS_SHORT as day}
						<div class="text-center text-[11px] font-medium text-ink-subtle py-1.5">
							{day}
						</div>
					{/each}
				</div>

				<!-- Day cells -->
				<div class="grid grid-cols-7 px-3 pb-2">
					{#each calendarDays as cell}
						{@const selected = isSelected(cell.day, cell.month, cell.year)}
						{@const isToday = isTodayCell(cell.day, cell.month, cell.year)}
						<button
							type="button"
							class="h-8 w-full rounded-md text-[13px] transition-colors relative
								focus:outline-none focus-visible:ring-2 focus-visible:ring-viking-400
								{selected
									? 'bg-viking-600 text-white font-semibold hover:bg-viking-700'
									: isToday
										? 'text-viking-600 dark:text-viking-400 font-bold hover:bg-viking-50 dark:hover:bg-viking-900/30'
										: cell.current
											? 'text-ink hover:bg-canvas-subtle'
											: 'text-ink-subtle/30 hover:bg-canvas-subtle/50 hover:text-ink-subtle/60'}"
							onclick={() => selectDay(cell.day, cell.month, cell.year)}
						>
							{cell.day}
							{#if isToday && !selected}
								<span class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-viking-500"></span>
							{/if}
						</button>
					{/each}
				</div>

			<!-- MONTH VIEW -->
			{:else if mode === 'months'}
				<div class="grid grid-cols-3 gap-1 px-3 pb-3">
					{#each MONTHS_SHORT as month, i}
						{@const isCurrent = viewMonth === i && viewYear === new Date().getFullYear()}
						{@const isViewMonth = viewMonth === i}
						<button
							type="button"
							class="h-10 rounded-lg text-sm font-medium transition-colors
								focus:outline-none focus-visible:ring-2 focus-visible:ring-viking-400
								{isViewMonth
									? 'bg-viking-600 text-white hover:bg-viking-700'
									: isCurrent
										? 'text-viking-600 dark:text-viking-400 font-bold hover:bg-canvas-subtle'
										: 'text-ink hover:bg-canvas-subtle'}"
							onclick={() => selectMonth(i)}
						>
							{month}
						</button>
					{/each}
				</div>

			<!-- YEAR VIEW -->
			{:else}
				<div class="grid grid-cols-3 gap-1 px-3 pb-3">
					{#each yearGrid as year}
						{@const isCurrentYear = year === new Date().getFullYear()}
						{@const isViewYear = year === viewYear}
						<button
							type="button"
							class="h-10 rounded-lg text-sm font-medium font-mono transition-colors
								focus:outline-none focus-visible:ring-2 focus-visible:ring-viking-400
								{isViewYear
									? 'bg-viking-600 text-white hover:bg-viking-700'
									: isCurrentYear
										? 'text-viking-600 dark:text-viking-400 font-bold hover:bg-canvas-subtle'
										: 'text-ink hover:bg-canvas-subtle'}"
							onclick={() => selectYear(year)}
						>
							{year}
						</button>
					{/each}
				</div>
			{/if}

			<!-- Footer -->
			<div class="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-canvas-subtle/30">
				<button
					type="button"
					class="text-xs font-medium text-viking-600 dark:text-viking-400
						hover:text-viking-700 dark:hover:text-viking-300 transition-colors"
					onclick={goToday}
				>
					Hoy
				</button>
				{#if value}
					<button
						type="button"
						class="text-xs text-ink-muted hover:text-ink transition-colors"
						onclick={clearValue}
					>
						Limpiar
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { DisponibilidadDoctor } from '$domain/staff/types.js';
	import Button from '$shared/components/button/Button.svelte';
	import { TabGroup } from '$shared/components/tabs';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toastSuccess, toastError, toastWarning } from '$shared/components/toast/toast.svelte.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const diasSemana: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie' };
	const diasSemanaFull: Record<number, string> = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes' };

	const bloquesPorDia = $derived.by(() => {
		const g: Record<number, DisponibilidadDoctor[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
		for (const b of data.bloques) { if (g[b.day_of_week]) g[b.day_of_week].push(b); }
		for (const d of Object.keys(g)) g[Number(d)].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
		return g;
	});

	// ─── Mobile: día seleccionado ─────────────────────────────
	const todayDow = (() => { const d = new Date().getDay(); return d === 0 ? 1 : d > 5 ? 1 : d; })();
	let mobileDay = $state(todayDow);
	let mobileDayStr = $state(String(todayDow));
	// Sync string ↔ number for TabGroup compatibility
	$effect(() => { mobileDay = Number(mobileDayStr); });

	// ─── Time helpers ────────────────────────────────────────
	const horasEje = Array.from({ length: 12 }, (_, i) => i + 7);
	const HORA_MIN = 7, HORA_MAX = 19, TOTAL_MIN = 720, SNAP = 15;

	function t2p(t: string) { const [h, m] = t.split(':').map(Number); return Math.max(0, Math.min(100, ((h * 60 + m - HORA_MIN * 60) / TOTAL_MIN) * 100)); }
	function p2m(p: number) { return HORA_MIN * 60 + Math.round((p / 100) * TOTAL_MIN); }
	function snap(m: number) { return Math.round(m / SNAP) * SNAP; }
	function m2t(m: number) { return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
	function yToMins(el: HTMLElement, clientY: number) { const r = el.getBoundingClientRect(); return snap(p2m(Math.max(0, Math.min(100, (clientY - r.top) / r.height * 100)))); }
	function isInsideBlock(dia: number, mins: number) { const t = m2t(mins); return bloquesPorDia[dia].some((b) => t >= b.hora_inicio && t < b.hora_fin); }

	const resumenSemanal = $derived.by(() => {
		let s = 0, h = 0;
		for (const d of [1,2,3,4,5]) for (const b of bloquesPorDia[d]) {
			const [hi,mi] = b.hora_inicio.split(':').map(Number), [hf,mf] = b.hora_fin.split(':').map(Number);
			const m = (hf*60+mf)-(hi*60+mi); s += Math.floor(m/b.duracion_slot); h += m;
		}
		return { totalSlots: s, totalHoras: Math.floor(h/60), totalMin: h%60 };
	});

	// ─── Hidden forms ────────────────────────────────────────
	let createFormEl: HTMLFormElement | undefined = $state();
	let createDia = $state(''), createInicio = $state(''), createFin = $state('');
	let selectedSlotDuration = $state('30');
	const createSlot = $derived(selectedSlotDuration);
	let updateFormEl: HTMLFormElement | undefined = $state();
	let updateId = $state(''), updateInicio = $state(''), updateFin = $state('');

	// ─── Drag state ──────────────────────────────────────────
	type DragMode = 'create' | 'resize-top' | 'resize-bottom';
	let drag = $state<{ mode: DragMode; dia: number; colEl: HTMLElement; startMins: number; endMins: number; bloqueId?: string; originalStart?: string; originalEnd?: string; } | null>(null);

	const previewTop = $derived(drag ? t2p(m2t(Math.min(drag.startMins, drag.endMins))) : 0);
	const previewHeight = $derived(drag ? t2p(m2t(Math.max(drag.startMins, drag.endMins))) - previewTop : 0);
	const previewLabel = $derived(drag ? `${m2t(Math.min(drag.startMins, drag.endMins))}–${m2t(Math.max(drag.startMins, drag.endMins))}` : '');

	function onGridMouseDown(dia: number, e: MouseEvent) {
		if (e.button !== 0) return;
		const colEl = e.currentTarget as HTMLElement;
		const mins = yToMins(colEl, e.clientY);
		if (isInsideBlock(dia, mins)) return;
		e.preventDefault();
		drag = { mode: 'create', dia, colEl, startMins: mins, endMins: mins + SNAP };
		attachDragListeners();
	}

	function onResizeMouseDown(e: MouseEvent, bloqueId: string, edge: 'top' | 'bottom', bloque: DisponibilidadDoctor) {
		e.preventDefault(); e.stopPropagation();
		const colEl = (e.target as HTMLElement).closest('[data-day-col]') as HTMLElement;
		if (!colEl) return;
		const [sh, sm] = bloque.hora_inicio.split(':').map(Number);
		const [eh, em] = bloque.hora_fin.split(':').map(Number);
		drag = { mode: edge === 'top' ? 'resize-top' : 'resize-bottom', dia: bloque.day_of_week, colEl, startMins: sh * 60 + sm, endMins: eh * 60 + em, bloqueId, originalStart: bloque.hora_inicio, originalEnd: bloque.hora_fin };
		attachDragListeners();
	}

	function getClientY(e: MouseEvent | TouchEvent): number {
		return 'touches' in e ? e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0 : e.clientY;
	}

	function attachDragListeners() {
		const onMove = (e: MouseEvent | TouchEvent) => {
			if (!drag) return;
			if ('touches' in e) e.preventDefault(); // prevent scroll while dragging
			const mins = yToMins(drag.colEl, getClientY(e));
			const clamped = Math.max(HORA_MIN * 60, Math.min(HORA_MAX * 60, mins));
			if (drag.mode === 'create') drag = { ...drag, endMins: clamped };
			else if (drag.mode === 'resize-top') { if (clamped < drag.endMins) drag = { ...drag, startMins: clamped }; }
			else { if (clamped > drag.startMins) drag = { ...drag, endMins: clamped }; }
		};
		const onUp = () => {
			window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
			window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp);
			if (!drag) return;
			const lo = Math.min(drag.startMins, drag.endMins), hi = Math.max(drag.startMins, drag.endMins);
			if (hi - lo < SNAP) { drag = null; return; }
			if (drag.mode === 'create') {
				createDia = String(drag.dia); createInicio = m2t(lo); createFin = m2t(hi);
				drag = null; requestAnimationFrame(() => createFormEl?.requestSubmit());
			} else {
				const ns = m2t(lo), ne = m2t(hi);
				if (ns !== drag.originalStart || ne !== drag.originalEnd) {
					updateId = String(drag.bloqueId); updateInicio = ns; updateFin = ne;
					drag = null; requestAnimationFrame(() => updateFormEl?.requestSubmit());
				} else drag = null;
			}
		};
		window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
		window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp);
	}

	function onGridTouchStart(dia: number, e: TouchEvent) {
		const colEl = e.currentTarget as HTMLElement;
		const mins = yToMins(colEl, getClientY(e));
		if (isInsideBlock(dia, mins)) return;
		e.preventDefault();
		drag = { mode: 'create', dia, colEl, startMins: mins, endMins: mins + SNAP };
		attachDragListeners();
	}

	function onResizeTouchStart(e: TouchEvent, bloqueId: string, edge: 'top' | 'bottom', bloque: DisponibilidadDoctor) {
		e.preventDefault(); e.stopPropagation();
		const colEl = (e.target as HTMLElement).closest('[data-day-col]') as HTMLElement;
		if (!colEl) return;
		const [sh, sm] = bloque.hora_inicio.split(':').map(Number);
		const [eh, em] = bloque.hora_fin.split(':').map(Number);
		drag = { mode: edge === 'top' ? 'resize-top' : 'resize-bottom', dia: bloque.day_of_week, colEl, startMins: sh * 60 + sm, endMins: eh * 60 + em, bloqueId, originalStart: bloque.hora_inicio, originalEnd: bloque.hora_fin };
		attachDragListeners();
	}

	function bTop(b: DisponibilidadDoctor) { return drag?.bloqueId === b.id ? t2p(m2t(Math.min(drag.startMins, drag.endMins))) : t2p(b.hora_inicio); }
	function bHeight(b: DisponibilidadDoctor) { if (drag?.bloqueId === b.id) { const lo = t2p(m2t(Math.min(drag.startMins, drag.endMins))); return t2p(m2t(Math.max(drag.startMins, drag.endMins))) - lo; } return t2p(b.hora_fin) - t2p(b.hora_inicio); }
	function bLabel(b: DisponibilidadDoctor) { const s = drag?.bloqueId === b.id ? m2t(Math.min(drag.startMins, drag.endMins)) : b.hora_inicio; const e = drag?.bloqueId === b.id ? m2t(Math.max(drag.startMins, drag.endMins)) : b.hora_fin; const [hi,mi] = s.split(':').map(Number), [hf,mf] = e.split(':').map(Number); return { s, e, n: Math.floor(((hf*60+mf)-(hi*60+mi)) / b.duracion_slot) }; }
</script>

<svelte:head><title>Mi Disponibilidad — Doctor</title></svelte:head>

<!-- Hidden forms -->
<form bind:this={createFormEl} method="POST" action="?/agregar" use:enhance={() => { return async ({ result, update }) => { await update(); if (result.type === 'success') { toastSuccess('Bloque creado', `Bloque de ${createInicio}–${createFin} agregado (${createSlot} min por cita).`); } else { toastError('Error', 'No se pudo crear el bloque.'); } }; }} class="hidden">
	<input type="hidden" name="day_of_week" value={createDia} />
	<input type="hidden" name="hora_inicio" value={createInicio} />
	<input type="hidden" name="hora_fin" value={createFin} />
	<input type="hidden" name="duracion_slot" value={createSlot} />
</form>
<form bind:this={updateFormEl} method="POST" action="?/actualizar" use:enhance={() => { return async ({ result, update }) => { await update(); if (result.type === 'success') { toastSuccess('Bloque actualizado', 'El horario fue ajustado correctamente.'); } else { toastError('Error', 'No se pudo actualizar el bloque.'); } }; }} class="hidden">
	<input type="hidden" name="bloqueId" value={updateId} />
	<input type="hidden" name="hora_inicio" value={updateInicio} />
	<input type="hidden" name="hora_fin" value={updateFin} />
</form>

<div class="space-y-3 sm:space-y-4 animate-fade-in-up">
	<!-- Header -->
	<div class="flex items-start justify-between gap-3">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Mi Disponibilidad</h1>
			<p class="text-xs text-ink-muted mt-0.5">Dr. {data.doctorNombre}</p>
		</div>
		<div class="flex items-center gap-2 sm:gap-4 text-xs text-ink-muted">
			<span><b class="text-ink">{resumenSemanal.totalSlots}</b> slots</span>
			<span class="hidden sm:inline"><b class="text-ink">{resumenSemanal.totalHoras}h{resumenSemanal.totalMin > 0 ? `${resumenSemanal.totalMin}m` : ''}</b></span>
		</div>
	</div>

	<!-- Selector de duración de slot para nuevos bloques -->
	<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
		<p class="text-sm text-ink-muted mb-2">Duración de cada cita:</p>
		<div class="grid grid-cols-4 gap-2">
			{#each ['15', '30', '45', '60'] as d}
				<button
					type="button"
					class="py-2.5 text-sm font-medium rounded-lg transition-colors
						{selectedSlotDuration === d ? 'bg-viking-600 text-white shadow-sm' : 'text-ink-muted hover:bg-canvas-subtle border border-border/60'}"
					onclick={() => { selectedSlotDuration = d; }}
				>{d} min</button>
			{/each}
		</div>
	</div>

	<!-- Feedback via Toast (eliminados alerts inline) -->

	<!-- ═══ MOBILE: Single-day view (< sm) ═══ -->
	<div class="sm:hidden">
		<!-- Day tabs — touch-friendly -->
		<TabGroup
			tabs={[1, 2, 3, 4, 5].map(dia => ({
				id: String(dia),
				label: diasSemana[dia],
				detail: bloquesPorDia[dia].length > 0 ? String(bloquesPorDia[dia].length) : undefined
			}))}
			bind:active={mobileDayStr}
			variant="pill"
			class="mb-3"
		/>

		<!-- Single day grid -->
		<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-1)] overflow-hidden select-none">
			<div class="px-3 py-2 border-b border-border/40 flex items-center justify-between">
				<p class="text-sm font-semibold text-ink">{diasSemanaFull[mobileDay]}</p>
				<p class="text-xs text-ink-muted">{bloquesPorDia[mobileDay].length} bloque{bloquesPorDia[mobileDay].length !== 1 ? 's' : ''}</p>
			</div>

			<div class="grid grid-cols-[2rem_1fr] relative h-[400px]">
				<!-- Hour axis -->
				<div class="relative border-r border-border/20">
					{#each horasEje as hora}
						<div class="absolute right-1 text-xs text-ink-subtle tabular-nums -translate-y-1/2" style="top: {((hora - HORA_MIN) / (HORA_MAX - HORA_MIN)) * 100}%">{String(hora).padStart(2, '0')}</div>
					{/each}
				</div>

				<!-- Day column -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="relative cursor-crosshair" data-day-col={mobileDay} onmousedown={(e) => onGridMouseDown(mobileDay, e)} ontouchstart={(e) => onGridTouchStart(mobileDay, e)}>
					{#each horasEje as hora}
						<div class="absolute inset-x-0 border-t border-border/15" style="top: {((hora - HORA_MIN) / (HORA_MAX - HORA_MIN)) * 100}%"></div>
						<div class="absolute inset-x-0 border-t border-border/8 border-dashed" style="top: {((hora - HORA_MIN + 0.5) / (HORA_MAX - HORA_MIN)) * 100}%"></div>
					{/each}

					{#each bloquesPorDia[mobileDay] as bloque (bloque.id)}
						{@const lb = bLabel(bloque)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="absolute inset-x-1 rounded-md bg-viking-100 dark:bg-viking-900/30 border border-viking-300/60 dark:border-viking-700/50 group {drag?.bloqueId === bloque.id ? 'ring-2 ring-viking-400/50 z-10' : ''}"
							style="top: {bTop(bloque)}%; height: {bHeight(bloque)}%;"
							onmousedown={(e) => e.stopPropagation()}
						>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="absolute inset-x-0 top-0 h-3 cursor-n-resize z-10 hover:bg-viking-400/20 rounded-t" onmousedown={(e) => onResizeMouseDown(e, bloque.id, 'top', bloque)} ontouchstart={(e) => onResizeTouchStart(e, bloque.id, 'top', bloque)}></div>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="absolute inset-x-0 bottom-0 h-3 cursor-s-resize z-10 hover:bg-viking-400/20 rounded-b" onmousedown={(e) => onResizeMouseDown(e, bloque.id, 'bottom', bloque)} ontouchstart={(e) => onResizeTouchStart(e, bloque.id, 'bottom', bloque)}></div>

							<div class="px-2 py-1.5 h-full flex items-center justify-between overflow-hidden pointer-events-none">
								<div>
									<p class="text-xs font-semibold text-viking-800 dark:text-viking-200">{lb.s}–{lb.e}</p>
									<p class="text-xs text-viking-600 dark:text-viking-400">{lb.n} slots · {bloque.duracion_slot}min</p>
								</div>
								<form method="POST" action="?/eliminar" use:enhance={() => { return async ({ result, update }) => { await update(); if (result.type === 'success') { toastWarning('Bloque eliminado', 'El bloque de disponibilidad fue eliminado.'); } else { toastError('Error', 'No se pudo eliminar el bloque.'); } }; }} class="pointer-events-auto">
									<input type="hidden" name="bloqueId" value={bloque.id} />
									<button type="submit" class="p-1 rounded text-viking-400 hover:text-red-500 transition-colors" title="Eliminar">
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
									</button>
								</form>
							</div>
						</div>
					{/each}

					{#if drag && drag.mode === 'create' && drag.dia === mobileDay && previewHeight > 0}
						<div class="absolute inset-x-1 rounded-md bg-viking-200/60 dark:bg-viking-700/40 border-2 border-dashed border-viking-400 z-20 pointer-events-none" style="top: {previewTop}%; height: {previewHeight}%;">
							<div class="px-2 py-1"><p class="text-xs font-semibold text-viking-700 dark:text-viking-200">{previewLabel}</p></div>
						</div>
					{/if}

					{#if bloquesPorDia[mobileDay].length === 0 && !(drag && drag.mode === 'create' && drag.dia === mobileDay)}
						<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
							<p class="text-xs text-ink-subtle">Arrastra para crear un bloque</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- ═══ DESKTOP: Weekly view (≥ sm) ═══ -->
	<div class="hidden sm:block">
		<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-1)] overflow-hidden select-none">
			<!-- Day headers -->
			<div class="grid grid-cols-[2.5rem_repeat(5,1fr)] border-b border-border/40">
				<div></div>
				{#each [1, 2, 3, 4, 5] as dia}
					<div class="py-2 text-center border-l border-border/20">
						<p class="text-xs text-ink-muted uppercase">{diasSemana[dia]}</p>
						<p class="text-xs font-semibold text-ink">{diasSemanaFull[dia]}</p>
					</div>
				{/each}
			</div>

			<!-- Time grid -->
			<div class="grid grid-cols-[2.5rem_repeat(5,1fr)] h-[420px] lg:h-[520px]">
				<div class="relative">
					{#each horasEje as hora}
						<div class="absolute right-1.5 text-xs text-ink-subtle tabular-nums -translate-y-1/2" style="top: {((hora - HORA_MIN) / (HORA_MAX - HORA_MIN)) * 100}%">{String(hora).padStart(2, '0')}</div>
					{/each}
				</div>

				{#each [1, 2, 3, 4, 5] as dia}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="relative border-l border-border/20 cursor-crosshair" data-day-col={dia} onmousedown={(e) => onGridMouseDown(dia, e)} ontouchstart={(e) => onGridTouchStart(dia, e)}>
						{#each horasEje as hora}
							<div class="absolute inset-x-0 border-t border-border/15" style="top: {((hora - HORA_MIN) / (HORA_MAX - HORA_MIN)) * 100}%"></div>
							<div class="absolute inset-x-0 border-t border-border/8 border-dashed" style="top: {((hora - HORA_MIN + 0.5) / (HORA_MAX - HORA_MIN)) * 100}%"></div>
						{/each}

						{#each bloquesPorDia[dia] as bloque (bloque.id)}
							{@const lb = bLabel(bloque)}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="absolute inset-x-0.5 rounded bg-viking-100 dark:bg-viking-900/30 border border-viking-300/60 dark:border-viking-700/50 group cursor-default {drag?.bloqueId === bloque.id ? 'ring-2 ring-viking-400/50 z-10' : ''}"
								style="top: {bTop(bloque)}%; height: {bHeight(bloque)}%;"
								onmousedown={(e) => e.stopPropagation()}
							>
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div class="absolute inset-x-0 top-0 h-2 cursor-n-resize z-10 hover:bg-viking-400/20 rounded-t" onmousedown={(e) => onResizeMouseDown(e, bloque.id, 'top', bloque)} ontouchstart={(e) => onResizeTouchStart(e, bloque.id, 'top', bloque)}></div>
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div class="absolute inset-x-0 bottom-0 h-2 cursor-s-resize z-10 hover:bg-viking-400/20 rounded-b" onmousedown={(e) => onResizeMouseDown(e, bloque.id, 'bottom', bloque)} ontouchstart={(e) => onResizeTouchStart(e, bloque.id, 'bottom', bloque)}></div>

								<div class="px-1.5 py-1 h-full flex flex-col justify-between overflow-hidden pointer-events-none">
									<div>
										<p class="text-xs font-semibold text-viking-800 dark:text-viking-200 leading-tight">{lb.s}–{lb.e}</p>
										<p class="text-xs text-viking-600 dark:text-viking-400">{lb.n} slots · {bloque.duracion_slot}min</p>
									</div>
									<form method="POST" action="?/eliminar" use:enhance={() => { return async ({ result, update }) => { await update(); if (result.type === 'success') { toastWarning('Bloque eliminado', 'El bloque de disponibilidad fue eliminado.'); } else { toastError('Error', 'No se pudo eliminar el bloque.'); } }; }} class="self-end pointer-events-auto">
										<input type="hidden" name="bloqueId" value={bloque.id} />
										<button type="submit" class="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-viking-500 hover:text-red-500" title="Eliminar">
											<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
										</button>
									</form>
								</div>
							</div>
						{/each}

						{#if drag && drag.mode === 'create' && drag.dia === dia && previewHeight > 0}
							<div class="absolute inset-x-0.5 rounded bg-viking-200/60 dark:bg-viking-700/40 border-2 border-dashed border-viking-400 z-20 pointer-events-none" style="top: {previewTop}%; height: {previewHeight}%;">
								<div class="px-1.5 py-0.5"><p class="text-xs font-semibold text-viking-700 dark:text-viking-200">{previewLabel}</p></div>
							</div>
						{/if}

						{#if bloquesPorDia[dia].length === 0 && !(drag && drag.mode === 'create' && drag.dia === dia)}
							<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
								<p class="text-xs text-ink-subtle">Arrastra</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Legend -->
	<div class="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-ink-subtle px-1">
		<div class="flex items-center gap-1.5">
			<span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-viking-100 dark:bg-viking-900/30 border border-viking-300/50"></span>
			Disponible
		</div>
		<span>Arrastra para crear · Bordes para ajustar</span>
	</div>
</div>

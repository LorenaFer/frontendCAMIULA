<script lang="ts">
	/**
	 * Odontograma interactivo con notación ISO/FDI.
	 * 32 piezas dentales (adulto), 4 cuadrantes.
	 * Click en una pieza para ciclar entre estados.
	 */

	interface ToothState {
		estado: string;
		descripcion?: string;
		soporte?: string;
	}

	interface Props {
		value: Record<string, ToothState>;
		disabled?: boolean;
		onchange: (value: Record<string, ToothState>) => void;
	}

	let { value = {}, disabled = false, onchange }: Props = $props();

	// ─── Estados y colores ──────────────────────────────────
	const ESTADOS = [
		{ id: 'normal', label: 'Normal', color: 'var(--color-ink-subtle)', fill: 'none' },
		{ id: 'cariado', label: 'Cariado', color: '#ef4444', fill: '#fecaca' },
		{ id: 'obturado', label: 'Obturado', color: '#3b82f6', fill: '#bfdbfe' },
		{ id: 'ext_indicada', label: 'Ext. Indicada', color: '#f97316', fill: '#fed7aa' },
		{ id: 'extraido', label: 'Extraído / Ausente', color: '#6b7280', fill: '#e5e7eb' },
		{ id: 'protesis', label: 'Prótesis', color: '#8b5cf6', fill: '#ddd6fe' }
	] as const;

	// ─── Dientes FDI ────────────────────────────────────────
	// Q1: superior derecho (18-11), Q2: superior izquierdo (21-28)
	// Q4: inferior derecho (48-41), Q3: inferior izquierdo (31-38)
	const Q1 = [18, 17, 16, 15, 14, 13, 12, 11];
	const Q2 = [21, 22, 23, 24, 25, 26, 27, 28];
	const Q3 = [31, 32, 33, 34, 35, 36, 37, 38];
	const Q4 = [48, 47, 46, 45, 44, 43, 42, 41];

	// ─── Handlers ───────────────────────────────────────────
	function cycleState(toothId: number) {
		if (disabled) return;
		const key = String(toothId);
		const current = value[key]?.estado ?? 'normal';
		const currentIdx = ESTADOS.findIndex((e) => e.id === current);
		const nextIdx = (currentIdx + 1) % ESTADOS.length;
		const nextEstado = ESTADOS[nextIdx].id;

		const updated = { ...value };
		if (nextEstado === 'normal') {
			const { [key]: _, ...rest } = updated;
			onchange(rest);
		} else {
			updated[key] = { ...updated[key], estado: nextEstado };
			onchange(updated);
		}
	}

	function getToothColor(toothId: number): { stroke: string; fill: string } {
		const estado = value[String(toothId)]?.estado ?? 'normal';
		const e = ESTADOS.find((s) => s.id === estado) ?? ESTADOS[0];
		return { stroke: e.color, fill: e.fill };
	}

	function clearAll() {
		if (disabled) return;
		onchange({});
	}

	// ─── Observation table helpers ──────────────────────────
	let markedTeeth = $derived(
		Object.entries(value)
			.filter(([, v]) => v.estado && v.estado !== 'normal')
			.sort(([a], [b]) => Number(a) - Number(b))
	);

	function updateDescription(toothId: string, descripcion: string) {
		onchange({ ...value, [toothId]: { ...value[toothId], descripcion } });
	}

	function updateSoporte(toothId: string, soporte: string) {
		onchange({ ...value, [toothId]: { ...value[toothId], soporte } });
	}

	function getEstadoLabel(estado: string): string {
		return ESTADOS.find((e) => e.id === estado)?.label ?? estado;
	}

	function getEstadoColor(estado: string): string {
		return ESTADOS.find((e) => e.id === estado)?.color ?? '#6b7280';
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<svg class="w-5 h-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
			</svg>
			<span class="text-sm font-semibold text-ink uppercase tracking-wider">Odontograma Completo (ISO/FDI)</span>
		</div>
		{#if !disabled}
			<button
				type="button"
				onclick={clearAll}
				class="text-xs text-ink-muted hover:text-ink transition-colors"
			>
				Limpiar
			</button>
		{/if}
	</div>

	<!-- Dental Chart -->
	<div class="bg-surface-elevated rounded-xl border border-border/60 p-4 overflow-x-auto">
		<!-- Upper Jaw -->
		<div class="flex justify-center gap-0.5 mb-1">
			<!-- Q1: upper right -->
			<div class="flex gap-0.5">
				{#each Q1 as tooth (tooth)}
					{@const colors = getToothColor(tooth)}
					<button
						type="button"
						{disabled}
						onclick={() => cycleState(tooth)}
						class="flex flex-col items-center gap-0.5 p-0.5 rounded hover:bg-canvas-subtle/80 transition-colors
							disabled:cursor-default focus-visible:ring-2 focus-visible:ring-viking-500/40"
					>
						<span class="text-[9px] text-ink-subtle tabular-nums">{tooth}</span>
						<svg width="24" height="28" viewBox="0 0 24 28" fill={colors.fill} stroke={colors.stroke} stroke-width="1.5">
							<path d="M6 2C4 2 2 4 2 8C2 12 3 16 4 20C5 24 7 26 9 26C10 26 11 25 12 25C13 25 14 26 15 26C17 26 19 24 20 20C21 16 22 12 22 8C22 4 20 2 18 2C16 2 14 3 12 3C10 3 8 2 6 2Z" />
							{#if value[String(tooth)]?.estado === 'extraido'}
								<line x1="6" y1="6" x2="18" y2="22" stroke={colors.stroke} stroke-width="2" />
								<line x1="18" y1="6" x2="6" y2="22" stroke={colors.stroke} stroke-width="2" />
							{:else if value[String(tooth)]?.estado === 'ext_indicada'}
								<line x1="6" y1="6" x2="18" y2="22" stroke={colors.stroke} stroke-width="1.5" />
							{:else if value[String(tooth)]?.estado === 'protesis'}
								<circle cx="12" cy="14" r="4" fill="none" stroke={colors.stroke} stroke-width="1.5" />
							{:else if value[String(tooth)]?.estado === 'cariado'}
								<circle cx="12" cy="14" r="4" fill={colors.stroke} />
							{:else if value[String(tooth)]?.estado === 'obturado'}
								<circle cx="12" cy="14" r="4" fill={colors.stroke} />
							{/if}
						</svg>
					</button>
				{/each}
			</div>

			<div class="w-px bg-border mx-1 self-stretch"></div>

			<!-- Q2: upper left -->
			<div class="flex gap-0.5">
				{#each Q2 as tooth (tooth)}
					{@const colors = getToothColor(tooth)}
					<button
						type="button"
						{disabled}
						onclick={() => cycleState(tooth)}
						class="flex flex-col items-center gap-0.5 p-0.5 rounded hover:bg-canvas-subtle/80 transition-colors
							disabled:cursor-default focus-visible:ring-2 focus-visible:ring-viking-500/40"
					>
						<span class="text-[9px] text-ink-subtle tabular-nums">{tooth}</span>
						<svg width="24" height="28" viewBox="0 0 24 28" fill={colors.fill} stroke={colors.stroke} stroke-width="1.5">
							<path d="M6 2C4 2 2 4 2 8C2 12 3 16 4 20C5 24 7 26 9 26C10 26 11 25 12 25C13 25 14 26 15 26C17 26 19 24 20 20C21 16 22 12 22 8C22 4 20 2 18 2C16 2 14 3 12 3C10 3 8 2 6 2Z" />
							{#if value[String(tooth)]?.estado === 'extraido'}
								<line x1="6" y1="6" x2="18" y2="22" stroke={colors.stroke} stroke-width="2" />
								<line x1="18" y1="6" x2="6" y2="22" stroke={colors.stroke} stroke-width="2" />
							{:else if value[String(tooth)]?.estado === 'ext_indicada'}
								<line x1="6" y1="6" x2="18" y2="22" stroke={colors.stroke} stroke-width="1.5" />
							{:else if value[String(tooth)]?.estado === 'protesis'}
								<circle cx="12" cy="14" r="4" fill="none" stroke={colors.stroke} stroke-width="1.5" />
							{:else if value[String(tooth)]?.estado === 'cariado'}
								<circle cx="12" cy="14" r="4" fill={colors.stroke} />
							{:else if value[String(tooth)]?.estado === 'obturado'}
								<circle cx="12" cy="14" r="4" fill={colors.stroke} />
							{/if}
						</svg>
					</button>
				{/each}
			</div>
		</div>

		<!-- Línea oclusal -->
		<div class="flex items-center gap-2 my-2">
			<div class="flex-1 border-t border-border/40"></div>
			<span class="text-[9px] text-ink-subtle uppercase tracking-widest">Línea Oclusal</span>
			<div class="flex-1 border-t border-border/40"></div>
		</div>

		<!-- Lower Jaw -->
		<div class="flex justify-center gap-0.5 mt-1">
			<!-- Q4: lower right -->
			<div class="flex gap-0.5">
				{#each Q4 as tooth (tooth)}
					{@const colors = getToothColor(tooth)}
					<button
						type="button"
						{disabled}
						onclick={() => cycleState(tooth)}
						class="flex flex-col items-center gap-0.5 p-0.5 rounded hover:bg-canvas-subtle/80 transition-colors
							disabled:cursor-default focus-visible:ring-2 focus-visible:ring-viking-500/40"
					>
						<svg width="24" height="28" viewBox="0 0 24 28" fill={colors.fill} stroke={colors.stroke} stroke-width="1.5">
							<path d="M6 26C4 26 2 24 2 20C2 16 3 12 4 8C5 4 7 2 9 2C10 2 11 3 12 3C13 3 14 2 15 2C17 2 19 4 20 8C21 12 22 16 22 20C22 24 20 26 18 26C16 26 14 25 12 25C10 25 8 26 6 26Z" />
							{#if value[String(tooth)]?.estado === 'extraido'}
								<line x1="6" y1="6" x2="18" y2="22" stroke={colors.stroke} stroke-width="2" />
								<line x1="18" y1="6" x2="6" y2="22" stroke={colors.stroke} stroke-width="2" />
							{:else if value[String(tooth)]?.estado === 'ext_indicada'}
								<line x1="6" y1="6" x2="18" y2="22" stroke={colors.stroke} stroke-width="1.5" />
							{:else if value[String(tooth)]?.estado === 'protesis'}
								<circle cx="12" cy="14" r="4" fill="none" stroke={colors.stroke} stroke-width="1.5" />
							{:else if value[String(tooth)]?.estado === 'cariado'}
								<circle cx="12" cy="14" r="4" fill={colors.stroke} />
							{:else if value[String(tooth)]?.estado === 'obturado'}
								<circle cx="12" cy="14" r="4" fill={colors.stroke} />
							{/if}
						</svg>
						<span class="text-[9px] text-ink-subtle tabular-nums">{tooth}</span>
					</button>
				{/each}
			</div>

			<div class="w-px bg-border mx-1 self-stretch"></div>

			<!-- Q3: lower left -->
			<div class="flex gap-0.5">
				{#each Q3 as tooth (tooth)}
					{@const colors = getToothColor(tooth)}
					<button
						type="button"
						{disabled}
						onclick={() => cycleState(tooth)}
						class="flex flex-col items-center gap-0.5 p-0.5 rounded hover:bg-canvas-subtle/80 transition-colors
							disabled:cursor-default focus-visible:ring-2 focus-visible:ring-viking-500/40"
					>
						<svg width="24" height="28" viewBox="0 0 24 28" fill={colors.fill} stroke={colors.stroke} stroke-width="1.5">
							<path d="M6 26C4 26 2 24 2 20C2 16 3 12 4 8C5 4 7 2 9 2C10 2 11 3 12 3C13 3 14 2 15 2C17 2 19 4 20 8C21 12 22 16 22 20C22 24 20 26 18 26C16 26 14 25 12 25C10 25 8 26 6 26Z" />
							{#if value[String(tooth)]?.estado === 'extraido'}
								<line x1="6" y1="6" x2="18" y2="22" stroke={colors.stroke} stroke-width="2" />
								<line x1="18" y1="6" x2="6" y2="22" stroke={colors.stroke} stroke-width="2" />
							{:else if value[String(tooth)]?.estado === 'ext_indicada'}
								<line x1="6" y1="6" x2="18" y2="22" stroke={colors.stroke} stroke-width="1.5" />
							{:else if value[String(tooth)]?.estado === 'protesis'}
								<circle cx="12" cy="14" r="4" fill="none" stroke={colors.stroke} stroke-width="1.5" />
							{:else if value[String(tooth)]?.estado === 'cariado'}
								<circle cx="12" cy="14" r="4" fill={colors.stroke} />
							{:else if value[String(tooth)]?.estado === 'obturado'}
								<circle cx="12" cy="14" r="4" fill={colors.stroke} />
							{/if}
						</svg>
						<span class="text-[9px] text-ink-subtle tabular-nums">{tooth}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Leyenda -->
		<div class="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-border/40">
			{#each ESTADOS.filter((e) => e.id !== 'normal') as estado}
				<div class="flex items-center gap-1.5">
					<span class="w-2.5 h-2.5 rounded-full" style="background:{estado.color}"></span>
					<span class="text-[10px] text-ink-muted uppercase tracking-wide">{estado.label}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Observation Table -->
	{#if markedTeeth.length > 0}
		<div class="bg-surface-elevated rounded-xl border border-border/60 overflow-hidden">
			<div class="px-4 py-2.5 bg-canvas-subtle border-b border-border/40">
				<span class="text-xs font-semibold text-ink-muted uppercase tracking-wider">Hallazgos y Observaciones Detalladas</span>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="border-b border-border/40">
						<tr>
							<th class="px-4 py-2 text-left text-[10px] font-medium text-ink-muted uppercase w-16">Pieza</th>
							<th class="px-4 py-2 text-left text-[10px] font-medium text-ink-muted uppercase w-28">Estado</th>
							<th class="px-4 py-2 text-left text-[10px] font-medium text-ink-muted uppercase">Descripción Clínica</th>
							<th class="px-4 py-2 text-left text-[10px] font-medium text-ink-muted uppercase w-32">RX / Soporte</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border-subtle">
						{#each markedTeeth as [toothId, state] (toothId)}
							<tr class="hover:bg-canvas-subtle/50 transition-colors">
								<td class="px-4 py-2 font-mono font-semibold text-ink tabular-nums">{toothId}</td>
								<td class="px-4 py-2">
									<span class="inline-flex items-center gap-1.5 text-xs font-medium" style="color:{getEstadoColor(state.estado)}">
										<span class="w-2 h-2 rounded-full" style="background:{getEstadoColor(state.estado)}"></span>
										{getEstadoLabel(state.estado)}
									</span>
								</td>
								<td class="px-4 py-1.5">
									<input
										type="text"
										value={state.descripcion ?? ''}
										placeholder="Descripción clínica..."
										{disabled}
										oninput={(e) => updateDescription(toothId, e.currentTarget.value)}
										class="w-full px-2 py-1 text-sm bg-transparent border border-transparent hover:border-border
											focus:border-border-strong focus:ring-1 focus:ring-border-subtle rounded text-ink
											placeholder:text-ink-subtle outline-none transition-colors"
									/>
								</td>
								<td class="px-4 py-1.5">
									<input
										type="text"
										value={state.soporte ?? ''}
										placeholder="Periapical, RX..."
										{disabled}
										oninput={(e) => updateSoporte(toothId, e.currentTarget.value)}
										class="w-full px-2 py-1 text-sm bg-transparent border border-transparent hover:border-border
											focus:border-border-strong focus:ring-1 focus:ring-border-subtle rounded text-ink
											placeholder:text-ink-subtle outline-none transition-colors"
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

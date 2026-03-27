<script lang="ts">
	/**
	 * Mapa Corporal Digital — vista frontal y posterior.
	 * Click sobre el SVG para agregar marcadores de lesiones.
	 * Cada marcador tiene descripción editable.
	 */

	interface BodyMark {
		id: string;
		x: number;
		y: number;
		view: 'front' | 'back';
		descripcion: string;
	}

	interface Props {
		value: BodyMark[];
		disabled?: boolean;
		onchange: (value: BodyMark[]) => void;
	}

	let { value = [], disabled = false, onchange }: Props = $props();

	let _markCounter = 0;

	function handleSvgClick(e: MouseEvent, view: 'front' | 'back') {
		if (disabled) return;
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
		const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

		const mark: BodyMark = {
			id: 'bm-' + (++_markCounter).toString(36) + '-' + Math.random().toString(36).slice(2, 6),
			x,
			y,
			view,
			descripcion: ''
		};
		onchange([...value, mark]);
	}

	function removeMark(id: string) {
		if (disabled) return;
		onchange(value.filter((m) => m.id !== id));
	}

	function updateDescription(id: string, descripcion: string) {
		onchange(value.map((m) => (m.id === id ? { ...m, descripcion } : m)));
	}

	function clearAll() {
		if (disabled) return;
		onchange([]);
	}

	let marks = $derived(Array.isArray(value) ? value : []);
	let frontMarks = $derived(marks.filter((m) => m.view === 'front'));
	let backMarks = $derived(marks.filter((m) => m.view === 'back'));
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<svg class="w-5 h-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
			</svg>
			<span class="text-sm font-semibold text-ink uppercase tracking-wider">Examen Físico: Mapa Corporal Digital</span>
		</div>
		{#if !disabled && value.length > 0}
			<button
				type="button"
				onclick={clearAll}
				class="text-xs text-red-500 hover:text-red-600 transition-colors"
			>
				Limpiar marcas
			</button>
		{/if}
	</div>

	<!-- Body Views -->
	<div class="grid grid-cols-2 gap-4">
		<!-- Front View -->
		<div class="bg-surface-elevated rounded-xl border border-border/60 overflow-hidden">
			<div class="px-3 py-2 bg-canvas-subtle border-b border-border/40 text-center">
				<span class="text-xs font-medium text-ink-muted uppercase tracking-wider">Vista Frontal</span>
			</div>
			<div class="relative p-2">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<svg
					viewBox="0 0 200 400"
					class="w-full h-auto {disabled ? 'cursor-default' : 'cursor-crosshair'}"
					onclick={(e) => handleSvgClick(e, 'front')}
					role="img"
					aria-label="Vista frontal del cuerpo"
				>
					<!-- Body outline - front -->
					<g fill="none" stroke="var(--color-ink-subtle)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
						<!-- Head -->
						<ellipse cx="100" cy="40" rx="22" ry="28" />
						<!-- Neck -->
						<line x1="92" y1="68" x2="88" y2="85" />
						<line x1="108" y1="68" x2="112" y2="85" />
						<!-- Shoulders -->
						<path d="M88 85 Q70 82 55 95" />
						<path d="M112 85 Q130 82 145 95" />
						<!-- Arms L -->
						<path d="M55 95 Q48 130 42 165 Q38 180 35 195" />
						<!-- Arms R -->
						<path d="M145 95 Q152 130 158 165 Q162 180 165 195" />
						<!-- Hands -->
						<ellipse cx="33" cy="200" rx="6" ry="10" />
						<ellipse cx="167" cy="200" rx="6" ry="10" />
						<!-- Torso -->
						<path d="M88 85 Q85 100 82 140 Q80 160 78 180" />
						<path d="M112 85 Q115 100 118 140 Q120 160 122 180" />
						<!-- Chest line -->
						<path d="M82 110 Q100 120 118 110" stroke-dasharray="3 3" opacity="0.4" />
						<!-- Waist -->
						<path d="M78 180 Q100 185 122 180" />
						<!-- Hips -->
						<path d="M78 180 Q75 200 78 220" />
						<path d="M122 180 Q125 200 122 220" />
						<!-- Center line -->
						<line x1="100" y1="180" x2="100" y2="220" stroke-dasharray="3 3" opacity="0.3" />
						<!-- Legs -->
						<path d="M78 220 Q76 260 74 300 Q72 330 73 360" />
						<path d="M122 220 Q124 260 126 300 Q128 330 127 360" />
						<!-- Inner legs -->
						<path d="M95 220 Q93 260 91 300 Q90 330 90 360" />
						<path d="M105 220 Q107 260 109 300 Q110 330 110 360" />
						<!-- Feet -->
						<path d="M73 360 Q68 370 65 375 Q72 380 90 375 Q90 365 90 360" />
						<path d="M127 360 Q132 370 135 375 Q128 380 110 375 Q110 365 110 360" />
						<!-- Navel -->
						<circle cx="100" cy="165" r="2" fill="var(--color-ink-subtle)" opacity="0.4" />
					</g>

					<!-- Markers -->
					{#each frontMarks as mark, i (mark.id)}
						<g>
							<circle
								cx={mark.x * 2}
								cy={mark.y * 4}
								r="8"
								fill="#ef4444"
								fill-opacity="0.3"
								stroke="#ef4444"
								stroke-width="1.5"
							/>
							<text
								x={mark.x * 2}
								y={mark.y * 4 + 4}
								text-anchor="middle"
								font-size="9"
								font-weight="bold"
								fill="#ef4444"
							>
								{i + 1}
							</text>
						</g>
					{/each}
				</svg>
			</div>
		</div>

		<!-- Back View -->
		<div class="bg-surface-elevated rounded-xl border border-border/60 overflow-hidden">
			<div class="px-3 py-2 bg-canvas-subtle border-b border-border/40 text-center">
				<span class="text-xs font-medium text-ink-muted uppercase tracking-wider">Vista Posterior</span>
			</div>
			<div class="relative p-2">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<svg
					viewBox="0 0 200 400"
					class="w-full h-auto {disabled ? 'cursor-default' : 'cursor-crosshair'}"
					onclick={(e) => handleSvgClick(e, 'back')}
					role="img"
					aria-label="Vista posterior del cuerpo"
				>
					<!-- Body outline - back -->
					<g fill="none" stroke="var(--color-ink-subtle)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
						<!-- Head -->
						<ellipse cx="100" cy="40" rx="22" ry="28" />
						<!-- Neck -->
						<line x1="92" y1="68" x2="88" y2="85" />
						<line x1="108" y1="68" x2="112" y2="85" />
						<!-- Shoulders -->
						<path d="M88 85 Q70 82 55 95" />
						<path d="M112 85 Q130 82 145 95" />
						<!-- Arms L -->
						<path d="M55 95 Q48 130 42 165 Q38 180 35 195" />
						<!-- Arms R -->
						<path d="M145 95 Q152 130 158 165 Q162 180 165 195" />
						<!-- Hands -->
						<ellipse cx="33" cy="200" rx="6" ry="10" />
						<ellipse cx="167" cy="200" rx="6" ry="10" />
						<!-- Back torso -->
						<path d="M88 85 Q85 100 82 140 Q80 160 78 180" />
						<path d="M112 85 Q115 100 118 140 Q120 160 122 180" />
						<!-- Spine -->
						<line x1="100" y1="85" x2="100" y2="220" stroke-dasharray="4 4" opacity="0.3" />
						<!-- Shoulder blades -->
						<ellipse cx="88" cy="115" rx="8" ry="12" stroke-dasharray="3 3" opacity="0.3" />
						<ellipse cx="112" cy="115" rx="8" ry="12" stroke-dasharray="3 3" opacity="0.3" />
						<!-- Waist -->
						<path d="M78 180 Q100 185 122 180" />
						<!-- Hips -->
						<path d="M78 180 Q75 200 78 220" />
						<path d="M122 180 Q125 200 122 220" />
						<!-- Gluteal line -->
						<path d="M85 210 Q100 225 115 210" stroke-dasharray="3 3" opacity="0.3" />
						<!-- Legs -->
						<path d="M78 220 Q76 260 74 300 Q72 330 73 360" />
						<path d="M122 220 Q124 260 126 300 Q128 330 127 360" />
						<!-- Inner legs -->
						<path d="M95 220 Q93 260 91 300 Q90 330 90 360" />
						<path d="M105 220 Q107 260 109 300 Q110 330 110 360" />
						<!-- Feet -->
						<path d="M73 360 Q68 370 65 375 Q72 380 90 375 Q90 365 90 360" />
						<path d="M127 360 Q132 370 135 375 Q128 380 110 375 Q110 365 110 360" />
					</g>

					<!-- Markers -->
					{#each backMarks as mark, i (mark.id)}
						<g>
							<circle
								cx={mark.x * 2}
								cy={mark.y * 4}
								r="8"
								fill="#3b82f6"
								fill-opacity="0.3"
								stroke="#3b82f6"
								stroke-width="1.5"
							/>
							<text
								x={mark.x * 2}
								y={mark.y * 4 + 4}
								text-anchor="middle"
								font-size="9"
								font-weight="bold"
								fill="#3b82f6"
							>
								{i + 1 + frontMarks.length}
							</text>
						</g>
					{/each}
				</svg>
			</div>
		</div>
	</div>

	<!-- Instructions -->
	{#if !disabled}
		<div class="flex items-center gap-2 px-3 py-2 bg-viking-50 dark:bg-viking-900/20 border border-viking-200 dark:border-viking-800 rounded-lg">
			<svg class="w-4 h-4 text-viking-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
			</svg>
			<span class="text-xs text-viking-700 dark:text-viking-300">Haga clic sobre el mapa para marcar la ubicación de la lesión</span>
		</div>
	{/if}

	<!-- Marks Table -->
	{#if value.length > 0}
		<div class="bg-surface-elevated rounded-xl border border-border/60 overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-canvas-subtle border-b border-border/40">
						<tr>
							<th class="px-4 py-2 text-left text-[10px] font-medium text-ink-muted uppercase w-12">#</th>
							<th class="px-4 py-2 text-left text-[10px] font-medium text-ink-muted uppercase w-20">Vista</th>
							<th class="px-4 py-2 text-left text-[10px] font-medium text-ink-muted uppercase">Descripción de la Lesión</th>
							{#if !disabled}
								<th class="px-4 py-2 w-12"></th>
							{/if}
						</tr>
					</thead>
					<tbody class="divide-y divide-border-subtle">
						{#each value as mark, i (mark.id)}
							<tr class="hover:bg-canvas-subtle/50 transition-colors">
								<td class="px-4 py-2 font-mono font-semibold tabular-nums text-ink">{i + 1}</td>
								<td class="px-4 py-2">
									<span class="inline-flex items-center gap-1 text-xs font-medium {mark.view === 'front' ? 'text-red-500' : 'text-blue-500'}">
										<span class="w-2 h-2 rounded-full {mark.view === 'front' ? 'bg-red-500' : 'bg-blue-500'}"></span>
										{mark.view === 'front' ? 'Frontal' : 'Posterior'}
									</span>
								</td>
								<td class="px-4 py-1.5">
									<input
										type="text"
										value={mark.descripcion}
										placeholder="Tipo de lesión, tamaño, color, bordes..."
										{disabled}
										oninput={(e) => updateDescription(mark.id, e.currentTarget.value)}
										class="w-full px-2 py-1 text-sm bg-transparent border border-transparent hover:border-border
											focus:border-border-strong focus:ring-1 focus:ring-border-subtle rounded text-ink
											placeholder:text-ink-subtle outline-none transition-colors"
									/>
								</td>
								{#if !disabled}
									<td class="px-2 py-1.5">
										<button
											type="button"
											onclick={() => removeMark(mark.id)}
											aria-label="Eliminar marca"
											class="p-1 text-ink-subtle hover:text-red-500 rounded transition-colors"
										>
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
											</svg>
										</button>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

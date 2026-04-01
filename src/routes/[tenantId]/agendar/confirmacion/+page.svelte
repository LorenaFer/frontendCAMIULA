<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$shared/components/button/Button.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';

	const citaId = $derived($page.url.searchParams.get('citaId') ?? '');
	const rawCode = $derived($page.url.searchParams.get('code') ?? '');
	const tenantId = $derived($page.params.tenantId);

	// Código corto legible: primeros 8 chars del UUID, formato XXXX-XXXX
	const shortCode = $derived(rawCode.replace(/-/g, '').slice(0, 8).toUpperCase());
	const displayCode = $derived(
		shortCode.length >= 8
			? `${shortCode.slice(0, 4)}-${shortCode.slice(4)}`
			: shortCode || '----'
	);
</script>

<svelte:head>
	<title>Cita Confirmada — {displayCode}</title>
</svelte:head>

<div class="flex items-center justify-center px-4 py-10">
	<div class="max-w-md w-full text-center space-y-6">
		<!-- Ícono de éxito -->
		<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage-100 dark:bg-sage-900/20 mb-2">
			<svg class="w-8 h-8 text-sage-600 dark:text-sage-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		</div>

		<div>
			<h1 class="text-xl font-bold text-ink mb-1">¡Cita Agendada!</h1>
			<p class="text-sm text-ink-muted">Su cita fue registrada exitosamente.</p>
		</div>

		<!-- Código de confirmación -->
		<div class="bg-surface-elevated border border-border/60 rounded-xl p-6 shadow-[var(--shadow-1)]">
			<p class="text-xs text-ink-muted uppercase tracking-wider mb-3">Código de confirmación</p>
			<p class="data-hero text-viking-600 dark:text-viking-400 tracking-[0.2em]">{displayCode}</p>
			<p class="text-sm text-ink-muted mt-3">Presente este código al llegar a su cita.</p>
		</div>

		<!-- Estado -->
		<div class="flex justify-center">
			<Badge variant="success" style="soft" size="md" dot>Confirmada</Badge>
		</div>

		<!-- Recordatorio -->
		<div class="bg-canvas-subtle border border-border/40 rounded-xl p-5 text-left space-y-2">
			<p class="text-sm font-semibold text-ink">Recuerde</p>
			<ul class="space-y-1.5 text-sm text-ink-muted list-disc list-inside">
				<li>Preséntese 10 minutos antes de su cita.</li>
				<li>Traiga su cédula de identidad.</li>
				<li>Si no puede asistir, cancele con anticipación.</li>
			</ul>
		</div>

		<Button
			variant="primary"
			fullWidth
			onclick={() => window.location.href = `/${tenantId}/agendar`}
		>
			Agendar otra cita
		</Button>
	</div>
</div>

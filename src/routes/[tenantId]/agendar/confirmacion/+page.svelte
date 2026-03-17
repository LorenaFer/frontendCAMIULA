<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$shared/components/button/Button.svelte';

	const citaId = $derived($page.url.searchParams.get('citaId') ?? '');
	const code = $derived($page.url.searchParams.get('code') ?? '');
	const tenantId = $derived($page.params.tenantId);
</script>

<svelte:head>
	<title>Cita Confirmada — {code}</title>
</svelte:head>

<div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
	<div class="max-w-md w-full text-center">
		<!-- Ícono de éxito -->
		<div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
			<svg class="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		</div>

		<h1 class="text-2xl font-bold text-ink mb-2">¡Cita Agendada!</h1>
		<p class="text-ink-muted mb-6">Su cita fue registrada exitosamente. Guarde su código de confirmación.</p>

		<!-- Código de confirmación -->
		<div class="bg-surface border border-border rounded-xl p-6 mb-6 shadow-[var(--shadow-1)]">
			<p class="text-xs text-ink-muted uppercase tracking-wider mb-1">Código de confirmación</p>
			<p class="text-3xl font-mono font-bold text-viking-600 tracking-widest">{code}</p>
			{#if citaId}
				<p class="text-xs text-ink-subtle mt-2">Cita #{citaId}</p>
			{/if}
		</div>

		<div class="space-y-3 text-sm text-ink-muted bg-surface-elevated rounded-lg border border-border p-4 mb-8 text-left">
			<p class="font-medium text-ink">Recuerde</p>
			<ul class="space-y-1 list-disc list-inside">
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

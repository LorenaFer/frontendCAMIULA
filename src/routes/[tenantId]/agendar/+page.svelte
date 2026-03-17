<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import AppointmentBookingWizard from '$shared/components/appointments/AppointmentBookingWizard.svelte';

	let { data }: { data: PageData } = $props();
	const tenantId = $derived($page.params.tenantId ?? '');
</script>

<svelte:head>
	<title>Agendar Cita Médica</title>
</svelte:head>

<div class="min-h-screen bg-canvas py-10 px-4">
	<div class="max-w-2xl mx-auto">
		<!-- Cabecera del portal -->
		<div class="text-center mb-10">
			<div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-viking-100 dark:bg-viking-900/30 mb-4">
				<svg class="w-7 h-7 text-viking-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-ink">Portal de Citas Médicas</h1>
			<p class="mt-1 text-sm text-ink-muted">Servicio Médico Universitario — Sin necesidad de crear cuenta</p>
		</div>

		<!-- Wizard de agendamiento -->
		<div class="bg-surface rounded-2xl border border-border shadow-[var(--shadow-2)] p-6 sm:p-8">
			<AppointmentBookingWizard
				doctores={data.doctores}
				especialidades={data.especialidades}
				tenantId={tenantId}
				minDate={data.minDate}
			/>
		</div>

		<p class="text-center text-xs text-ink-subtle mt-6">
			¿Necesita ayuda? Llame a la línea de atención médica interna.
		</p>
	</div>
</div>

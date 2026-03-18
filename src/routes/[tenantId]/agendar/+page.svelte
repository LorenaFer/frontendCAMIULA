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

<AppointmentBookingWizard
	doctores={data.doctores}
	especialidades={data.especialidades}
	tenantId={tenantId}
	minDate={data.minDate}
/>

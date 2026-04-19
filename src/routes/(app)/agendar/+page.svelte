<script lang="ts">
	import type { PageData } from './$types';
	import AppointmentBookingWizard from '$domain/appointments/components/wizards/AppointmentBookingWizard.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Agendar Cita Médica</title>
</svelte:head>

<AppointmentBookingWizard
	doctores={data.doctores}
	especialidades={data.especialidades}
	minDate={data.minDate}
	loggedPatient={data.loggedPatient}
/>

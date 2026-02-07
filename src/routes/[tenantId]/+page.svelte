<script lang="ts">
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';

	const statsData = {
		patients: { value: 156, change: '+12%' },
		appointments: { value: 8, remaining: 4 },
		alerts: { value: 3 }
	};

	const todaySchedule = [
		{ id: 1, patient: 'John Doe', type: 'Routine Checkup', room: 'Room 302', time: '09:00', status: 'completed' as const },
		{ id: 2, patient: 'Jane Smith', type: 'General Consultation', room: 'Room 105', time: '10:30', status: 'confirmed' as const },
		{ id: 3, patient: 'Robert Brown', type: 'Post-Op Follow-up', room: 'Room 204', time: '13:00', status: 'pending' as const },
		{ id: 4, patient: 'Emily Davis', type: 'Blood Work & Lab', room: 'Lab A', time: '14:30', status: 'confirmed' as const }
	];

	const statusColors: Record<string, string> = {
		completed: 'bg-emerald-400',
		confirmed: 'bg-blue-400',
		pending: 'bg-amber-400',
		cancelled: 'bg-gray-300'
	};
</script>

<svelte:head>
	<title>Dashboard - Hospital Management</title>
	<meta name="description" content="Hospital management dashboard" />
</svelte:head>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-base font-semibold text-slate-900">Dashboard</h1>
			<p class="text-xs text-slate-500 font-mono">
				{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
			</p>
		</div>
		<div class="flex gap-2 w-full sm:w-auto">
			<Button variant="ghost" size="sm" class="flex-1 sm:flex-initial">Add Patient</Button>
			<Button variant="primary" size="sm" class="flex-1 sm:flex-initial">New Appointment</Button>
		</div>
	</div>

	<!-- Stats Row -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<Card variant="default" padding="lg">
			<p class="text-[13px] text-slate-500 mb-1">Active Patients</p>
			<div class="flex items-baseline gap-3">
				<span class="text-[32px] font-semibold text-slate-900 tabular-nums tracking-tight">{statsData.patients.value}</span>
				<span class="text-[13px] text-emerald-600 font-medium">{statsData.patients.change}</span>
			</div>
		</Card>

		<Card variant="default" padding="lg">
			<p class="text-[13px] text-slate-500 mb-1">Today's Schedule</p>
			<div class="flex items-baseline gap-2">
				<span class="text-[32px] font-semibold text-slate-900 tabular-nums tracking-tight">{statsData.appointments.value}</span>
				<span class="text-[15px] text-slate-400">of {statsData.appointments.value + statsData.appointments.remaining}</span>
			</div>
			<p class="text-[12px] text-slate-400 mt-1">{statsData.appointments.remaining} remaining today</p>
		</Card>

		<Card variant="default" padding="lg">
			<div class="flex items-center justify-between mb-1">
				<p class="text-[13px] text-slate-500">Low Stock Items</p>
				<span class="w-2 h-2 rounded-full bg-amber-400"></span>
			</div>
			<span class="text-[32px] font-semibold text-slate-900 tabular-nums tracking-tight">{statsData.alerts.value}</span>
			<a href="inventory" class="block text-[12px] text-viking-600 hover:text-viking-700 mt-2">
				Review inventory →
			</a>
		</Card>
	</div>

	<!-- Today's Schedule -->
	<Card padding="none">
		<div class="px-5 py-4 flex items-center justify-between border-b border-gray-100/60">
			<h3 class="text-sm font-semibold text-gray-900">Today's Schedule</h3>
			<a href="appointments" class="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
				View all →
			</a>
		</div>
		<div class="divide-y divide-gray-100/60">
			{#each todaySchedule as appointment (appointment.id)}
				<div class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors group cursor-pointer">
					<div class="flex items-center gap-2 w-20 flex-shrink-0">
						<span class="w-2 h-2 rounded-full flex-shrink-0 {statusColors[appointment.status]}"></span>
						<span class="text-sm font-medium text-gray-900 tabular-nums">{appointment.time}</span>
					</div>
					<div class="flex-1 min-w-0 flex items-center gap-2">
						<span class="text-sm font-medium text-gray-900 truncate">{appointment.patient}</span>
						<span class="text-gray-300">·</span>
						<span class="text-sm text-gray-500 truncate">{appointment.type}</span>
						<span class="text-xs text-gray-400 bg-gray-100/60 px-1.5 py-0.5 rounded flex-shrink-0">{appointment.room}</span>
					</div>
					<svg
						class="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
					</svg>
				</div>
			{/each}
		</div>
	</Card>
</div>

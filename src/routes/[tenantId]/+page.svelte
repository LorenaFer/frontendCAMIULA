<script lang="ts">
	import Card from '$shared/components/card/Card.svelte';
	import StatCard from '$shared/components/card/StatCard.svelte';
	import MetricCard from '$shared/components/card/MetricCard.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import type { DataTableColumn, RowAction } from '$shared/components/table/types';
	import StatusBadge from '$shared/components/badge/StatusBadge.svelte';
	import PriorityBadge from '$shared/components/badge/PriorityBadge.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Avatar from '$shared/components/avatar/Avatar.svelte';
	import AvatarGroup from '$shared/components/avatar/AvatarGroup.svelte';
	import UserAvatar from '$shared/components/avatar/UserAvatar.svelte';
	import Sparkline from '$shared/components/sparkline/Sparkline.svelte';
	import MiniBarChart from '$shared/components/sparkline/MiniBarChart.svelte';
	import ProgressRing from '$shared/components/sparkline/ProgressRing.svelte';
	import TrendIndicator from '$shared/components/sparkline/TrendIndicator.svelte';
	import Progress from '$shared/components/progress/Progress.svelte';
	import CircularProgress from '$shared/components/progress/CircularProgress.svelte';
	import FilterPill from '$shared/components/tag/FilterPill.svelte';
	import CategoryTag from '$shared/components/tag/CategoryTag.svelte';
	import EmptyState from '$shared/components/empty-state/EmptyState.svelte';
	import Stepper from '$shared/components/stepper/Stepper.svelte';

	// --- State ---
	let activeFilter = $state('month');
	let selectedKeys = $state<(string | number)[]>([]);

	// --- Mock Data ---
	const weeklyPatients = [1180, 1205, 1230, 1198, 1245, 1260, 1284];
	const weeklyOccupancy = [82, 79, 81, 75, 80, 77, 78];

	type Appointment = {
		id: number;
		patient: string;
		initials: string;
		avatarColor: 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet';
		doctor: string;
		type: string;
		date: string;
		time: string;
		status: 'completed' | 'confirmed' | 'pending' | 'cancelled';
		priority: 'urgent' | 'high' | 'normal' | 'low';
	};

	const recentAppointments: Appointment[] = [
		{ id: 1, patient: 'María García', initials: 'MG', avatarColor: 'violet', doctor: 'Dr. Rodríguez', type: 'Consulta General', date: '7 Feb', time: '09:00', status: 'completed', priority: 'normal' },
		{ id: 2, patient: 'Carlos López', initials: 'CL', avatarColor: 'blue', doctor: 'Dra. Martínez', type: 'Cardiología', date: '7 Feb', time: '10:30', status: 'confirmed', priority: 'high' },
		{ id: 3, patient: 'Ana Morales', initials: 'AM', avatarColor: 'green', doctor: 'Dr. Sánchez', type: 'Pediatría', date: '7 Feb', time: '11:00', status: 'pending', priority: 'urgent' },
		{ id: 4, patient: 'Roberto Díaz', initials: 'RD', avatarColor: 'amber', doctor: 'Dra. Torres', type: 'Traumatología', date: '7 Feb', time: '13:00', status: 'confirmed', priority: 'normal' },
		{ id: 5, patient: 'Elena Ruiz', initials: 'ER', avatarColor: 'red', doctor: 'Dr. Vargas', type: 'Dermatología', date: '7 Feb', time: '14:30', status: 'cancelled', priority: 'low' },
		{ id: 6, patient: 'Pedro Navarro', initials: 'PN', avatarColor: 'blue', doctor: 'Dr. Rodríguez', type: 'Neurología', date: '7 Feb', time: '16:00', status: 'pending', priority: 'high' },
	];

	const teamAvatars: Array<{ initials: string; status: 'online' | 'offline' | 'busy' | 'away'; color: 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet' }> = [
		{ initials: 'JR', status: 'online', color: 'blue' },
		{ initials: 'LM', status: 'online', color: 'green' },
		{ initials: 'AS', status: 'busy', color: 'amber' },
		{ initials: 'MT', status: 'online', color: 'violet' },
		{ initials: 'RV', status: 'away', color: 'red' },
	];

	const teamMembers = [
		{ name: 'Dr. Juan Rodríguez', subtitle: 'Medicina General', initials: 'JR', color: 'blue' as const, status: 'online' as const },
		{ name: 'Dra. Laura Martínez', subtitle: 'Cardiología', initials: 'LM', color: 'green' as const, status: 'online' as const },
		{ name: 'Dr. Andrés Sánchez', subtitle: 'Pediatría', initials: 'AS', color: 'amber' as const, status: 'busy' as const },
	];

	const criticalStock = [
		{ name: 'Ibuprofeno 400mg', current: 15, max: 200, variant: 'danger' as const },
		{ name: 'Guantes Nitrilo M', current: 45, max: 500, variant: 'danger' as const },
		{ name: 'Suero Fisiológico', current: 120, max: 300, variant: 'warning' as const },
	];

	const recentActivity = [
		{ text: 'Paciente María García dada de alta', time: 'Hace 12 min', color: 'green' as const },
		{ text: 'Nueva cita agendada — Carlos López', time: 'Hace 25 min', color: 'blue' as const },
		{ text: 'Alerta stock bajo: Ibuprofeno 400mg', time: 'Hace 1h', color: 'red' as const },
		{ text: 'Dr. Sánchez inició turno', time: 'Hace 2h', color: 'gray' as const },
	];

	const admissionSteps = [
		{ id: 'register', title: 'Registro' },
		{ id: 'triage', title: 'Triaje' },
		{ id: 'assign', title: 'Asignación' },
	];

	// --- Table Config ---
</script>

{#snippet patientCell(_value: unknown, row: Appointment)}
	<div class="flex items-center gap-2.5">
		<Avatar initials={row.initials} size="sm" color={row.avatarColor} />
		<span class="font-medium">{row.patient}</span>
	</div>
{/snippet}

{#snippet statusCell(_value: unknown, row: Appointment)}
	<StatusBadge status={row.status} />
{/snippet}

{#snippet priorityCell(_value: unknown, row: Appointment)}
	<PriorityBadge priority={row.priority} />
{/snippet}

{#snippet viewIcon()}
	<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
		<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
	</svg>
{/snippet}

{#snippet editIcon()}
	<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
	</svg>
{/snippet}

{#snippet sparklineViz()}
	<Sparkline data={weeklyPatients} color="success" height={40} width={96} />
{/snippet}

{#snippet progressRingViz()}
	<ProgressRing value={32} max={48} color="blue" size={44} showValue />
{/snippet}

{#snippet barChartViz()}
	<MiniBarChart data={weeklyOccupancy} color="warning" height={28} width={64} />
{/snippet}

{#snippet emptyIcon()}
	<svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
	</svg>
{/snippet}

{#snippet emptyAction()}
	<Button variant="ghost" size="sm" disabled>Próximamente</Button>
{/snippet}

{#snippet exportIcon()}
	<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
	</svg>
{/snippet}

<svelte:head>
	<title>Dashboard - Hospital Management</title>
	<meta name="description" content="Hospital management dashboard" />
</svelte:head>

<div class="space-y-6">
	<!-- Section 1: Header + Filter Pills -->
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-xl font-semibold text-ink tracking-tight">Dashboard</h1>
				<p class="text-xs text-ink-muted font-mono mt-0.5">
					{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
				</p>
			</div>
			<div class="flex gap-2 w-full sm:w-auto">
				<Button variant="ghost" size="sm" icon={exportIcon} class="flex-1 sm:flex-initial">Exportar</Button>
				<Button variant="primary" size="sm" class="flex-1 sm:flex-initial">Nueva Cita</Button>
			</div>
		</div>
		<div class="flex flex-wrap gap-2">
			<FilterPill active={activeFilter === 'today'} onclick={() => activeFilter = 'today'}>Hoy</FilterPill>
			<FilterPill active={activeFilter === 'week'} onclick={() => activeFilter = 'week'}>Esta Semana</FilterPill>
			<FilterPill active={activeFilter === 'month'} onclick={() => activeFilter = 'month'} count={31}>Este Mes</FilterPill>
			<FilterPill active={activeFilter === 'quarter'} onclick={() => activeFilter = 'quarter'}>Trimestre</FilterPill>
		</div>
	</div>

	<!-- Section 2: KPI Stats Row -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard
			title="Pacientes Activos"
			value="1,284"
			trend={{ value: '+12.5%', direction: 'up' }}
			accent="viking"
			visualization={sparklineViz}
			class="animate-fade-in-up stagger-1"
		/>
		<StatCard
			title="Citas Hoy"
			value={48}
			subtitle="32 completadas, 16 pendientes"
			trend={{ value: '+3', direction: 'up' }}
			accent="iris"
			visualization={progressRingViz}
			class="animate-fade-in-up stagger-2"
		/>
		<StatCard
			title="Ocupación Camas"
			value="78%"
			trend={{ value: '-2.1%', direction: 'down' }}
			accent="sage"
			visualization={barChartViz}
			class="animate-fade-in-up stagger-3"
		/>
		<MetricCard
			label="Ingresos del Mes"
			value="$142,580"
			change="+8.3%"
			changeType="positive"
			class="animate-fade-in-up stagger-4"
		/>
	</div>

	<!-- Section 3: Table + Sidebar -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
		<!-- Appointments Table (2/3) -->
		<Card padding="none" class="lg:col-span-2 animate-fade-in-up stagger-5">
			<div class="px-5 py-4 flex items-center justify-between border-b border-border-subtle/60">
				<h3 class="text-sm font-semibold text-ink">Citas Recientes</h3>
				<a href="appointments" class="text-xs font-medium text-viking-600 hover:text-viking-700 transition-colors">
					Ver todas &rarr;
				</a>
			</div>
			<DataTable
				columns={[
					{ key: 'patient', header: 'Paciente', sortable: true, render: patientCell },
					{ key: 'time', header: 'Hora', width: '80px' },
					{ key: 'doctor', header: 'Doctor' },
					{ key: 'type', header: 'Tipo' },
					{ key: 'status', header: 'Estado', width: '120px', render: statusCell },
					{ key: 'priority', header: 'Prioridad', width: '100px', render: priorityCell },
				] satisfies DataTableColumn<Appointment>[]}
				data={recentAppointments}
				rowKey="id"
				selectable
				{selectedKeys}
				onSelectionChange={(keys) => selectedKeys = keys}
				sortConfig={{ key: 'time', direction: 'asc' }}
				actions={[
					{ icon: viewIcon, label: 'Ver detalle', onclick: () => {}, hoverOnly: true },
					{ icon: editIcon, label: 'Editar', onclick: () => {}, hoverOnly: true },
				] satisfies RowAction<Appointment>[]}
			/>
		</Card>

		<!-- Sidebar (1/3) -->
		<div class="space-y-4 animate-fade-in-up stagger-6">
			<!-- Team on Shift -->
			<Card padding="none">
				<div class="px-4 py-3 border-b border-border-subtle/60 flex items-center justify-between">
					<h3 class="text-sm font-semibold text-ink">Equipo en Turno</h3>
					<AvatarGroup avatars={teamAvatars} max={4} size="xs" />
				</div>
				<div class="divide-y divide-border-subtle/40">
					{#each teamMembers as member}
						<div class="px-4 py-2.5">
							<UserAvatar
								name={member.name}
								subtitle={member.subtitle}
								initials={member.initials}
								size="sm"
								color={member.color}
								status={member.status}
							/>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Critical Inventory -->
			<Card padding="none">
				<div class="px-4 py-3 border-b border-border-subtle/60 flex items-center justify-between">
					<h3 class="text-sm font-semibold text-ink">Inventario Crítico</h3>
					<Badge variant="danger" style="soft" size="xs">
						{criticalStock.length} alertas
					</Badge>
				</div>
				<div class="p-4 space-y-3">
					{#each criticalStock as item}
						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-xs font-medium text-ink">{item.name}</span>
								<span class="text-xs text-ink-muted tabular-nums">{item.current}/{item.max}</span>
							</div>
							<Progress value={item.current} max={item.max} variant={item.variant} size="sm" />
						</div>
					{/each}
				</div>
			</Card>

			<!-- Activity Timeline -->
			<Card padding="none">
				<div class="px-4 py-3 border-b border-border-subtle/60">
					<h3 class="text-sm font-semibold text-ink">Actividad Reciente</h3>
				</div>
				<div class="divide-y divide-border-subtle/40">
					{#each recentActivity as activity}
						<div class="px-4 py-2.5 flex items-start gap-2.5">
							<CategoryTag color={activity.color}>&bull;</CategoryTag>
							<div class="flex-1 min-w-0">
								<p class="text-xs text-ink leading-relaxed">{activity.text}</p>
								<p class="text-[11px] text-ink-subtle mt-0.5">{activity.time}</p>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>
	</div>

	<!-- Section 4: Secondary Metrics -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<Card class="flex flex-col items-center justify-center py-5">
			<CircularProgress value={92} variant="success" size={56} />
			<p class="text-xs font-medium text-ink-muted mt-3">Satisfacción Pacientes</p>
		</Card>

		<Card class="flex flex-col justify-center">
			<Progress
				value={340}
				max={400}
				showPercentage
				label="Meta Mensual Citas"
				variant="default"
				size="lg"
			/>
		</Card>

		<Card class="flex flex-col items-center justify-center py-5">
			<span class="text-2xl font-semibold text-ink tabular-nums mb-1">14 min</span>
			<div class="flex items-center gap-1.5">
				<TrendIndicator value="-2.3 min" direction="down" />
			</div>
			<p class="text-xs font-medium text-ink-muted mt-2">Tiempo Prom. Espera</p>
		</Card>

		<Card padding="sm">
			<p class="text-xs font-medium text-ink-muted mb-3">Proceso Admisión</p>
			<Stepper steps={admissionSteps} currentStep={1} variant="compact" />
		</Card>
	</div>

	<!-- Section 5: Coming Soon -->
	<Card variant="ghost">
		<EmptyState
			title="Reportes Avanzados"
			description="Analítica detallada, reportes personalizados y exportación de datos estarán disponibles próximamente."
			icon={emptyIcon}
			action={emptyAction}
		/>
	</Card>
</div>

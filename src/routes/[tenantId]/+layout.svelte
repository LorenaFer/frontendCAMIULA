<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import TenantLayout from '$shared/components/layout/TenantLayout.svelte';
	import type { NavItem, UserProfile, Hospital } from '$shared/types/navigation';
	import type { SearchResult } from '$shared/components/layout/navUtils';
	import type { AuthUser } from '$shared/types/auth.js';
	import { getPermissionsForRole, P } from '$shared/rbac-config.js';

	let { children, data } = $props();

	// ─── Auth user from server layout ─────────────────────────
	const authUser: AuthUser | null = data.user ?? null;

	const userProfile: UserProfile = authUser
		? { id: authUser.id, name: authUser.name, role: authUser.role, initials: authUser.initials }
		: { id: '0', name: 'Guest', role: 'guest', initials: '?' };

	const permissions = authUser ? getPermissionsForRole(authUser.role) : [];

	// ─── Tenant/Hospital data ─────────────────────────────────
	const mockHospitals: Hospital[] = [
		{ id: 'general-hospital', name: 'General Hospital' },
		{ id: 'central-medical', name: 'Central Medical Center' },
		{ id: 'st-mary', name: "St. Mary's Hospital" }
	];

	const mockRecentSearches: SearchResult[] = [
		{ id: '1', title: 'John Smith', subtitle: 'Patient • MRN: 849201' },
		{ id: '2', title: 'Appointment Schedule', subtitle: "Today's appointments" },
		{ id: '3', title: 'Inventory Report', subtitle: 'Medical supplies' }
	];

	const mockSearchData = [
		{ id: 'p1', title: 'John Smith', subtitle: 'Patient • MRN: 849201', category: 'Patients', href: 'patients' },
		{ id: 'p2', title: 'Sarah Jenkins', subtitle: 'Patient • MRN: 849312', category: 'Patients', href: 'patients' },
		{ id: 'a1', title: 'Dr. Emily Ray', subtitle: 'Cardiology • 3 appointments today', category: 'Staff', href: 'appointments' },
		{ id: 'i1', title: 'Surgical Gloves', subtitle: 'Inventory • 500 units', category: 'Inventory', href: 'inventory' }
	];

	let searchQuery = $state('');
	let tenantId = $derived($page.params.tenantId);
	let currentHospital = $derived(mockHospitals.find((h) => h.id === tenantId));
	let tenantName = $derived(currentHospital?.name ?? tenantId);

	let searchCategories = $derived.by(() => {
		if (!searchQuery.trim()) return [];
		const filtered = mockSearchData.filter(
			(item) =>
				item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
		);
		const grouped = filtered.reduce(
			(acc, item) => {
				if (!acc[item.category]) acc[item.category] = [];
				acc[item.category].push(item);
				return acc;
			},
			{} as Record<string, typeof filtered>
		);
		return Object.entries(grouped).map(([label, results]) => ({ label, results }));
	});

	function handleSearch(query: string) { searchQuery = query; }
	function handleSearchSelect(result: { id: string; href?: string }) {
		if (result.href && tenantId) goto(`/${tenantId}/${result.href}`);
	}
	function handleLogout() {
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '/logout';
		document.body.appendChild(form);
		form.submit();
	}
</script>

{#snippet dashboardIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
	</svg>
{/snippet}

{#snippet appointmentsIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
	</svg>
{/snippet}

{#snippet patientsIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
	</svg>
{/snippet}

{#snippet inventoryIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
	</svg>
{/snippet}

{#if tenantId}
	{@const navItems: NavItem[] = [
		{ id: 'dashboard', label: 'Dashboard', href: '', icon: dashboardIcon, permission: P.DASHBOARD_READ },
		{ id: 'patients', label: 'Pacientes', href: 'patients', icon: patientsIcon, permission: P.PACIENTES_READ, group: 'Clínica' },
		{ id: 'agendar', label: 'Agendar Cita', href: 'agendar', icon: appointmentsIcon, permission: P.CITAS_CREATE, group: 'Citas' },
		{ id: 'analista-citas', label: 'Gestión Citas', href: 'analista/citas', icon: appointmentsIcon, permission: P.CITAS_CANCEL, group: 'Citas' },
		{ id: 'doctor-citas', label: 'Mis Citas', href: 'doctor/citas', icon: appointmentsIcon, permission: P.CITAS_MARK_ATTENDED, group: 'Doctor' },
		{ id: 'doctor-disponibilidad', label: 'Mi Disponibilidad', href: 'doctor/disponibilidad', icon: appointmentsIcon, permission: P.DISPONIBILIDAD_READ, group: 'Doctor' },
		{ id: 'inventory',         label: 'Dashboard',      href: 'inventory',                  icon: inventoryIcon, permission: P.INVENTORY_READ,     group: 'Farmacia' },
		{ id: 'inv-medications',   label: 'Medicamentos',   href: 'inventory/medications',       icon: inventoryIcon, permission: P.INVENTORY_READ,     group: 'Farmacia' },
		{ id: 'inv-batches',       label: 'Stock y Lotes',  href: 'inventory/batches',           icon: inventoryIcon, permission: P.INVENTORY_READ,     group: 'Farmacia' },
		{ id: 'inv-dispatches',    label: 'Despachos',      href: 'inventory/dispatches',        icon: inventoryIcon, permission: P.INVENTORY_DISPATCH, group: 'Farmacia' },
		{ id: 'inv-suppliers',     label: 'Proveedores',    href: 'inventory/suppliers',         icon: inventoryIcon, permission: P.INVENTORY_WRITE,    group: 'Farmacia' },
		{ id: 'inv-orders',        label: 'Órdenes Compra', href: 'inventory/purchase-orders',   icon: inventoryIcon, permission: P.INVENTORY_WRITE,    group: 'Farmacia' }
	]}

	{#if authUser?.role === 'paciente'}
		{@const currentPath = $page.url.pathname}
		<!-- Layout mínimo para pacientes -->
		<div class="min-h-screen bg-canvas">
			<header class="border-b border-border/60 bg-surface">
				<div class="px-4 py-2.5 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="w-7 h-7 rounded-lg bg-viking-600 flex items-center justify-center">
							<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
						<span class="text-sm font-semibold text-ink">{tenantName}</span>
					</div>
					<div class="flex items-center gap-3">
						<span class="text-xs text-ink-muted">{authUser.name}</span>
						<button onclick={handleLogout} class="text-xs text-ink-subtle hover:text-ink-muted transition-colors">
							Cerrar sesión
						</button>
					</div>
				</div>
				<!-- Nav tabs para paciente -->
				<nav class="px-4 flex gap-1">
					<a
						href="/{tenantId}/agendar"
						class="px-3 py-2 text-xs font-medium rounded-t-lg transition-colors {currentPath.includes('/agendar') ? 'bg-canvas text-viking-600 border-b-2 border-viking-600' : 'text-ink-muted hover:text-ink'}"
					>
						Agendar Cita
					</a>
					<a
						href="/{tenantId}/mis-citas"
						class="px-3 py-2 text-xs font-medium rounded-t-lg transition-colors {currentPath.includes('/mis-citas') ? 'bg-canvas text-viking-600 border-b-2 border-viking-600' : 'text-ink-muted hover:text-ink'}"
					>
						Mis Citas
					</a>
				</nav>
			</header>
			<main class="p-4 lg:p-8">
				{@render children()}
			</main>
		</div>
	{:else}
		<!-- Layout completo con sidebar para analista/doctor/admin -->
		<TenantLayout
			{tenantId}
			{tenantName}
			user={userProfile}
			hospitals={mockHospitals}
			{navItems}
			{permissions}
			notificationCount={3}
			{searchCategories}
			recentSearches={mockRecentSearches}
			onSearch={handleSearch}
			onSearchSelect={handleSearchSelect}
			onLogout={handleLogout}
		>
			{@render children()}
		</TenantLayout>
	{/if}
{/if}

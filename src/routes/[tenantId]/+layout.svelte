<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import TenantLayout from '$shared/components/layout/TenantLayout.svelte';
	import type { NavItem, UserProfile, Hospital } from '$shared/types/navigation';
	import type { SearchResult } from '$shared/components/layout/navUtils';

	let { children } = $props();

	// Mock data
	const mockUser: UserProfile = {
		id: '1',
		name: 'Dr. Smith',
		role: 'Cardiology',
		initials: 'DS'
	};

	const mockHospitals: Hospital[] = [
		{ id: 'general-hospital', name: 'General Hospital' },
		{ id: 'central-medical', name: 'Central Medical Center' },
		{ id: 'st-mary', name: "St. Mary's Hospital" }
	];

	const mockPermissions = ['appointments:read', 'patients:read', 'inventory:read'];

	const mockRecentSearches: SearchResult[] = [
		{ id: '1', title: 'John Smith', subtitle: 'Patient • MRN: 849201' },
		{ id: '2', title: 'Appointment Schedule', subtitle: "Today's appointments" },
		{ id: '3', title: 'Inventory Report', subtitle: 'Medical supplies' }
	];

	const mockSearchData = [
		{ id: 'p1', title: 'John Smith', subtitle: 'Patient • MRN: 849201', category: 'Patients', href: 'patients' },
		{ id: 'p2', title: 'Sarah Jenkins', subtitle: 'Patient • MRN: 849312', category: 'Patients', href: 'patients' },
		{ id: 'p3', title: 'Michael Chen', subtitle: 'Patient • MRN: 849205', category: 'Patients', href: 'patients' },
		{ id: 'a1', title: 'Dr. Emily Ray', subtitle: 'Cardiology • 3 appointments today', category: 'Staff', href: 'appointments' },
		{ id: 'a2', title: 'Morning Rounds', subtitle: 'Appointment • 9:00 AM', category: 'Appointments', href: 'appointments' },
		{ id: 'i1', title: 'Surgical Gloves', subtitle: 'Inventory • 500 units', category: 'Inventory', href: 'inventory' },
		{ id: 'i2', title: 'Syringes 10ml', subtitle: 'Inventory • 200 units', category: 'Inventory', href: 'inventory' }
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

	function handleSearch(query: string) {
		searchQuery = query;
	}

	function handleSearchSelect(result: { id: string; href?: string }) {
		if (result.href && tenantId) {
			goto(`/${tenantId}/${result.href}`);
		}
	}
</script>

{#snippet dashboardIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
	</svg>
{/snippet}

{#snippet appointmentsIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
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
		{ id: 'dashboard', label: 'Dashboard', href: '', icon: dashboardIcon },
		{ id: 'appointments', label: 'Appointments', href: 'appointments', icon: appointmentsIcon, permission: 'appointments:read', group: 'Clinical' },
		{ id: 'patients', label: 'Patient Data', href: 'patients', icon: patientsIcon, permission: 'patients:read', group: 'Clinical' },
		{ id: 'inventory', label: 'Inventory', href: 'inventory', icon: inventoryIcon, permission: 'inventory:read', group: 'Operations' },
		{ id: 'agendar', label: 'Agendar Cita', href: 'agendar', icon: appointmentsIcon, group: 'Citas' },
		{ id: 'analista-citas', label: 'Gestión Citas', href: 'analista/citas', icon: appointmentsIcon, group: 'Citas' },
		{ id: 'doctor-citas', label: 'Mis Citas', href: 'doctor/citas', icon: appointmentsIcon, group: 'Citas' }
	]}

	<TenantLayout
		{tenantId}
		{tenantName}
		user={mockUser}
		hospitals={mockHospitals}
		{navItems}
		permissions={mockPermissions}
		notificationCount={3}
		{searchCategories}
		recentSearches={mockRecentSearches}
		onSearch={handleSearch}
		onSearchSelect={handleSearchSelect}
	>
		{@render children()}
	</TenantLayout>
{/if}

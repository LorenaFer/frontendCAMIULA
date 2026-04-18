<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import TenantLayout from '$shared/components/layout/TenantLayout.svelte';
	import type { NavItem, UserProfile } from '$shared/types/navigation';
	import type { SearchResult } from '$shared/components/layout/navUtils';
	import type { AuthUser } from '$shared/types/auth.js';
	import { getPermissionsForRole, P } from '$shared/rbac-config.js';

	let { children, data } = $props();

	// ─── Auth user from server layout ─────────────────────────
	// svelte-ignore state_referenced_locally
		const authUser: AuthUser | null = data.user ?? null;

	const userProfile: UserProfile = authUser
		? { id: authUser.id, name: authUser.name, role: authUser.role, initials: authUser.initials }
		: { id: '0', name: 'Guest', role: 'guest', initials: '?' };

	const permissions = authUser ? getPermissionsForRole(authUser.role) : [];

	const appName = 'Centro Ambulatorio ULA';

	// ─── Búsqueda global (conectada al backend) ──────────────
	let searchCategories = $state<Array<{ label: string; results: SearchResult[] }>>([]);
	let searchLoading = $state(false);
	let searchDebounce: ReturnType<typeof setTimeout>;

	async function handleSearch(query: string) {
		clearTimeout(searchDebounce);
		if (!query || query.length < 2) {
			searchCategories = [];
			searchLoading = false;
			return;
		}
		searchLoading = true;
		searchDebounce = setTimeout(async () => {
			try {
				const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
				const data = await res.json();
				searchCategories = data.categories ?? [];
			} catch {
				searchCategories = [];
			} finally {
				searchLoading = false;
			}
		}, 300);
	}

	function handleSearchSelect(result: { id: string; href?: string }) {
		if (result.href) goto(result.href);
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

{#snippet formPreviewIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
	</svg>
{/snippet}

{#snippet medicationsIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
	</svg>
{/snippet}

{#snippet stockIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
	</svg>
{/snippet}

{#snippet dispatchIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
	</svg>
{/snippet}

{#snippet suppliersIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
	</svg>
{/snippet}

{#snippet ordersIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
	</svg>
{/snippet}

{#snippet movementsIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
	</svg>
{/snippet}

{#snippet alertsIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
	</svg>
{/snippet}

{#snippet settingsIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
		<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
	</svg>
{/snippet}

{#if authUser}
{@const navItems: NavItem[] = [
		{ id: 'dashboard', label: 'Dashboard', href: '', icon: dashboardIcon, permission: P.DASHBOARD_READ },
		{ id: 'patients', label: 'Pacientes', href: 'patients', icon: patientsIcon, permission: P.PACIENTES_READ, group: 'Clínica' },
		{ id: 'agendar', label: 'Agendar Cita', href: 'agendar', icon: appointmentsIcon, permission: P.CITAS_CREATE, group: 'Citas' },
		{ id: 'analista-citas', label: 'Gestión Citas', href: 'analista/citas', icon: appointmentsIcon, permission: P.CITAS_CANCEL, group: 'Citas' },
		{ id: 'analista-horarios', label: 'Horarios Doctores', href: 'analista/horarios', icon: appointmentsIcon, permission: P.CITAS_CANCEL, group: 'Citas' },
		...(authUser.role === 'doctor' ? [
			{ id: 'doctor-citas', label: 'Mis Citas', href: 'doctor/citas', icon: appointmentsIcon, permission: P.CITAS_MARK_ATTENDED, group: 'Doctor' },
			{ id: 'doctor-disponibilidad', label: 'Mi Disponibilidad', href: 'doctor/disponibilidad', icon: appointmentsIcon, permission: P.DISPONIBILIDAD_READ, group: 'Doctor' },
			{ id: 'form-preview', label: 'Form Preview', href: 'doctor/form-preview', icon: formPreviewIcon, permission: P.EVALUACIONES_WRITE, group: 'Doctor' },
		] satisfies NavItem[] : []),
		{ id: 'inventory',         label: 'Resumen',         href: 'inventory',                  icon: inventoryIcon,   permission: P.INVENTORY_READ,     group: 'Farmacia' },
		{ id: 'inv-medications',   label: 'Medicamentos',   href: 'inventory/medications',       icon: medicationsIcon, permission: P.INVENTORY_READ,     group: 'Farmacia' },
		{ id: 'inv-batches',       label: 'Stock y Lotes',  href: 'inventory/batches',           icon: stockIcon,       permission: P.INVENTORY_READ,     group: 'Farmacia' },
		{ id: 'inv-dispatches',    label: 'Despachos',      href: 'inventory/dispatches',        icon: dispatchIcon,    permission: P.INVENTORY_DISPATCH, group: 'Farmacia' },
		{ id: 'inv-suppliers',     label: 'Proveedores',    href: 'inventory/suppliers',         icon: suppliersIcon,   permission: P.INVENTORY_WRITE,    group: 'Farmacia' },
		{ id: 'inv-orders',        label: 'Órdenes Compra', href: 'inventory/purchase-orders',   icon: ordersIcon,      permission: P.INVENTORY_WRITE,    group: 'Farmacia' },
		{ id: 'inv-categories',    label: 'Categorías',     href: 'inventory/categories',        icon: ordersIcon,      permission: P.INVENTORY_WRITE,    group: 'Farmacia' },
		{ id: 'inv-movements',     label: 'Kardex',         href: 'inventory/movements',         icon: movementsIcon,   permission: P.INVENTORY_READ,     group: 'Farmacia' },
		{ id: 'inv-alerts',        label: 'Alertas Stock',  href: 'inventory/alerts',            icon: alertsIcon,      permission: P.INVENTORY_READ,     group: 'Farmacia' },
		{ id: 'reportes', label: 'Reportes EPI', href: 'reportes', icon: settingsIcon, permission: P.DASHBOARD_READ, group: 'Administración' },
		{ id: 'configuracion', label: 'Configuración', href: 'admin/configuracion', icon: settingsIcon, permission: P.SETTINGS_READ, group: 'Administración' }
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
						<span class="text-sm font-semibold text-ink">{appName}</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-canvas-subtle">
							<svg class="w-3.5 h-3.5 text-ink-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
							</svg>
							<span class="text-xs font-medium text-ink hidden sm:inline">{authUser.name}</span>
						</div>
						<button
							onclick={handleLogout}
							class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
							title="Cerrar sesión"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
							</svg>
							<span class="hidden sm:inline">Salir</span>
						</button>
					</div>
				</div>
			</header>
			<main class="p-4 max-w-5xl mx-auto">
				{@render children()}
			</main>
		</div>
	{:else}
		<!-- Layout completo con sidebar para analista/doctor/admin -->
		<TenantLayout
			tenantName={appName}
			user={userProfile}
			{navItems}
			{permissions}
			{searchCategories}
			{searchLoading}
			onSearch={handleSearch}
			onSearchSelect={handleSearchSelect}
			onLogout={handleLogout}
		>
			{@render children()}
		</TenantLayout>
	{/if}
{/if}

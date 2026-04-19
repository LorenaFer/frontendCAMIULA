<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import Sidebar from './Sidebar.svelte';
	import Header from './Header.svelte';
	import SearchDialog from '$shared/components/search-dialog/SearchDialog.svelte';
	import type { NavItem, UserProfile } from '$shared/types/navigation';
	import type { SearchResult, SearchCategory } from './nav-utils';
	import { filterNavItemsByPermissions } from './nav-utils';

	let {
		children,
		tenantName,
		user,
		navItems,
		permissions,
		searchCategories = [],
		recentSearches = [],
		searchLoading = false,
		onSearch,
		onSearchSelect,
		onSettingsClick,
		onProfileClick,
		onLogout
	}: {
		children: Snippet;
		tenantName?: string;
		user: UserProfile;
		navItems: NavItem[];
		permissions?: string[];
		searchCategories?: SearchCategory[];
		recentSearches?: SearchResult[];
		searchLoading?: boolean;
		onSearch?: (query: string) => void;
		onSearchSelect?: (result: SearchResult) => void;
		onSettingsClick?: () => void;
		onProfileClick?: () => void;
		onLogout?: () => void;
	} = $props();

	let sidebarOpen = $state(false);
	let searchOpen = $state(false);

	let filteredNavItems = $derived(filterNavItemsByPermissions(navItems, permissions));

	// Cmd+K / Ctrl+K keyboard shortcut for search
	$effect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				searchOpen = true;
			}
		}
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div class="min-h-screen bg-surface">
	<Sidebar
		{user}
		navItems={filteredNavItems}
		{tenantName}
		isOpen={sidebarOpen}
		onClose={() => (sidebarOpen = false)}
		{onSettingsClick}
		{onProfileClick}
		{onLogout}
	/>

	<div class="lg:ml-60 flex flex-col min-h-screen">
		<Header
			onSearchClick={() => (searchOpen = true)}
			onMenuClick={() => (sidebarOpen = true)}
		/>

		<main class="flex-1 p-4 lg:p-8">
			{#key $page.url.pathname}
				<div class="animate-page-enter">
					{@render children()}
				</div>
			{/key}
		</main>
	</div>

	<SearchDialog
		open={searchOpen}
		onClose={() => (searchOpen = false)}
		{onSearch}
		onSelect={onSearchSelect}
		categories={searchCategories}
		{recentSearches}
		isLoading={searchLoading}
	/>
</div>

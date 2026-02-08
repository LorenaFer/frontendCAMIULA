<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Portal from '$shared/components/util/Portal.svelte';
	import type { NavItem, UserProfile, Hospital } from '$shared/types/navigation';

	let {
		user,
		navItems,
		tenantId,
		tenantName,
		hospitals = [],
		isOpen = false,
		onClose,
		onSettingsClick,
		onProfileClick
	}: {
		user: UserProfile;
		navItems: NavItem[];
		tenantId: string;
		tenantName?: string;
		hospitals?: Hospital[];
		isOpen?: boolean;
		onClose?: () => void;
		onSettingsClick?: () => void;
		onProfileClick?: () => void;
	} = $props();

	// --- TenantSwitcher state ---
	let switcherOpen = $state(false);
	let buttonRef: HTMLButtonElement;
	let popoverRef: HTMLDivElement;
	let popoverStyle = $state({ top: 0, left: 0, width: 0 });

	// Update popover position when switcher opens
	$effect(() => {
		if (switcherOpen && buttonRef) {
			const rect = buttonRef.getBoundingClientRect();
			popoverStyle = {
				top: rect.bottom + 4,
				left: rect.left,
				width: rect.width
			};
		}
	});

	// Click-outside detection for tenant switcher
	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Node;
			if (
				popoverRef &&
				!popoverRef.contains(target) &&
				buttonRef &&
				!buttonRef.contains(target)
			) {
				switcherOpen = false;
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});

	function handleSwitcherToggle(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		switcherOpen = !switcherOpen;
	}

	function handleHospitalSwitch(hospitalId: string) {
		switcherOpen = false;
		goto(`/${hospitalId}`);
		handleNavClick();
	}

	function handleViewAllHospitals() {
		switcherOpen = false;
		goto('/hospitals');
		handleNavClick();
	}

	// --- Navigation helpers ---
	function handleNavClick() {
		if (typeof window !== 'undefined' && window.innerWidth < 1024) {
			onClose?.();
		}
	}

	function isNavItemActive(itemHref: string, pathname: string): boolean {
		if (itemHref === '') {
			return pathname === `/${tenantId}`;
		}
		return pathname.startsWith(`/${tenantId}/${itemHref}`);
	}

	function getNavItemHref(itemHref: string): string {
		return itemHref === '' ? `/${tenantId}` : `/${tenantId}/${itemHref}`;
	}

	// --- Nav grouping ---
	let groupedItems = $derived.by(() => {
		const groups: { label: string | null; items: typeof navItems }[] = [];
		let currentGroup: string | null = null;
		let currentItems: typeof navItems = [];

		for (const item of navItems) {
			const group = item.group ?? null;
			if (group !== currentGroup) {
				if (currentItems.length > 0) {
					groups.push({ label: currentGroup, items: currentItems });
				}
				currentGroup = group;
				currentItems = [item];
			} else {
				currentItems.push(item);
			}
		}
		if (currentItems.length > 0) {
			groups.push({ label: currentGroup, items: currentItems });
		}
		return groups;
	});
</script>

<!-- Mobile overlay -->
{#if isOpen}
	<div
		class="bg-gray-900/60 lg:hidden animate-in fade-in duration-200"
		style:position="fixed"
		style:top="0"
		style:left="0"
		style:right="0"
		style:bottom="0"
		style:z-index="40"
		style:-webkit-backdrop-filter="blur(4px)"
		style:backdrop-filter="blur(4px)"
		onclick={onClose}
		aria-hidden="true"
		role="presentation"
	></div>
{/if}

<!-- Sidebar -->
<aside
	class="fixed left-0 top-0 z-50 h-screen w-60 bg-canvas border-r border-border flex flex-col transition-transform duration-200 ease-out lg:z-30 {isOpen
		? 'sidebar-transform-visible'
		: 'sidebar-transform-hidden'}"
>
	<!-- TenantSwitcher header -->
	<div class="flex items-center gap-1 px-3 py-3 border-b border-border/60">
		<div class="flex-1 min-w-0">
			<div class="relative">
				<button
					type="button"
					bind:this={buttonRef}
					onclick={handleSwitcherToggle}
					style:cursor="pointer"
					style:-webkit-tap-highlight-color="transparent"
					style:pointer-events="auto"
					class="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-canvas-subtle rounded-md transition-colors"
				>
					<div
						class="w-7 h-7 rounded-md bg-viking-600 flex items-center justify-center flex-shrink-0"
						style:pointer-events="none"
					>
						<svg
							class="w-3.5 h-3.5 text-white"
							style:pointer-events="none"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
							/>
						</svg>
					</div>
					<div class="flex-1 min-w-0 text-left" style:pointer-events="none">
						<p class="text-[13px] font-semibold text-ink truncate">
							{tenantName ?? tenantId}
						</p>
					</div>
					<svg
						class="w-3.5 h-3.5 text-ink-subtle transition-transform {switcherOpen
							? 'rotate-180'
							: ''}"
						style:pointer-events="none"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m19.5 8.25-7.5 7.5-7.5-7.5"
						/>
					</svg>
				</button>

				<!-- TenantSwitcher popover via Portal -->
				{#if switcherOpen}
					<Portal>
						<div
							bind:this={popoverRef}
							style:position="fixed"
							style:top="{popoverStyle.top}px"
							style:left="{popoverStyle.left}px"
							style:width="{popoverStyle.width}px"
							style:z-index="99999"
							class="bg-surface-elevated rounded-lg border border-border shadow-[0_4px_12px_rgba(15,23,42,0.08),0_8px_24px_rgba(15,23,42,0.06)] overflow-hidden"
						>
							<div class="py-1">
								{#each hospitals as hospital (hospital.id)}
									<button
										onclick={() => handleHospitalSwitch(hospital.id)}
										class="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-canvas-subtle transition-colors"
									>
										<div
											class="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 {hospital.id ===
											tenantId
												? 'bg-viking-600'
												: 'bg-border'}"
										>
											<svg
												class="w-3 h-3 {hospital.id === tenantId
													? 'text-white'
													: 'text-ink-muted'}"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
												/>
											</svg>
										</div>
										<span
											class="text-[13px] truncate {hospital.id === tenantId
												? 'font-medium text-viking-700'
												: 'text-ink'}"
										>
											{hospital.name}
										</span>
										{#if hospital.id === tenantId}
											<svg
												class="w-3.5 h-3.5 text-viking-600 ml-auto"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="m4.5 12.75 6 6 9-13.5"
												/>
											</svg>
										{/if}
									</button>
								{/each}
							</div>
							<div class="border-t border-border-subtle p-1.5">
								<button
									onclick={handleViewAllHospitals}
									class="flex items-center gap-2 w-full px-2.5 py-1.5 text-[13px] text-ink-muted hover:text-viking-600 hover:bg-canvas-subtle rounded-md transition-colors"
								>
									<svg
										class="w-3.5 h-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="1.5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M12 4.5v15m7.5-7.5h-15"
										/>
									</svg>
									View all hospitals
								</button>
							</div>
						</div>
					</Portal>
				{/if}
			</div>
		</div>

		<!-- Mobile close button -->
		<button
			onclick={onClose}
			class="p-1.5 text-ink-subtle hover:text-ink hover:bg-canvas-subtle rounded-md lg:hidden flex-shrink-0"
			aria-label="Close menu"
		>
			<svg
				class="w-4 h-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Navigation items -->
	<nav class="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar-subtle">
		<ul class="space-y-1">
			{#each groupedItems as group}
				{#if group.label}
					<li class="pt-4 pb-1.5 px-2.5 first:pt-0">
						<span class="text-[10px] font-semibold text-ink-subtle uppercase tracking-widest">
							{group.label}
						</span>
					</li>
				{/if}
				{#each group.items as item (item.id)}
					{@const href = getNavItemHref(item.href)}
					{@const active = isNavItemActive(item.href, $page.url.pathname)}
					<li>
						<a
							{href}
							onclick={handleNavClick}
							class="relative flex items-center gap-2.5 py-2 text-[13px] font-medium rounded-md transition-all duration-150 border-l-[3px] pl-[7px] pr-2.5 {active
								? 'text-ink bg-viking-50/50 border-l-viking-500'
								: 'text-ink-muted hover:text-ink hover:bg-canvas-subtle/70 border-l-transparent'}"
						>
							<span
								class="w-4 h-4 flex-shrink-0 transition-colors [&>svg]:stroke-[1.75] {active
									? 'text-viking-600'
									: 'text-ink-subtle'}"
							>
								{@render item.icon()}
							</span>
							<span class="flex-1">{item.label}</span>
							{#if item.badge !== undefined && item.badge > 0}
								<span
									class="bg-red-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
								>
									{item.badge > 99 ? '99+' : item.badge}
								</span>
							{/if}
						</a>
					</li>
				{/each}
			{/each}
		</ul>
	</nav>

	<!-- UserSection -->
	<div class="border-t border-border/60 px-3 py-3">
		<button
			onclick={onProfileClick}
			class="flex items-center gap-2.5 px-2.5 py-2 w-full rounded-md hover:bg-canvas-subtle transition-colors"
		>
			{#if user.avatar}
				<img src={user.avatar} alt={user.name} class="w-8 h-8 rounded-md object-cover" />
			{:else}
				<div
					class="w-8 h-8 rounded-md bg-viking-100 text-viking-700 flex items-center justify-center font-medium text-[11px]"
				>
					{user.initials}
				</div>
			{/if}
			<div class="flex-1 min-w-0 text-left">
				<p class="text-[13px] font-medium text-ink truncate">
					{user.name}
				</p>
				<p class="text-[11px] text-ink-muted truncate">{user.role}</p>
			</div>
		</button>
	</div>
</aside>

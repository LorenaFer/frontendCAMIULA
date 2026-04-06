<script lang="ts">
	export interface Tab {
		id: string;
		label: string;
		/** Texto adicional mostrado junto al label (ej: subtitle en reportes) */
		subtitle?: string;
		/** Contador opcional mostrado entre paréntesis */
		count?: number;
		/** Contenido extra debajo del label (ej: bloques en disponibilidad mobile) */
		detail?: string;
	}

	let {
		tabs,
		active = $bindable(''),
		variant = 'underline',
		class: className = ''
	}: {
		tabs: Tab[];
		active: string;
		variant?: 'underline' | 'pill';
		class?: string;
	} = $props();
</script>

{#if variant === 'underline'}
	<div class="flex gap-1 border-b border-border {className}" role="tablist">
		{#each tabs as tab (tab.id)}
			<button
				role="tab"
				aria-selected={active === tab.id}
				class="px-4 py-2.5 text-sm font-medium transition-colors relative
					{active === tab.id ? 'text-viking-600' : 'text-ink-muted hover:text-ink'}"
				onclick={() => { active = tab.id; }}
			>
				{#if tab.subtitle}
					<span class="font-semibold">{tab.label}</span>
					<span class="hidden sm:inline text-xs font-normal ml-1">— {tab.subtitle}</span>
				{:else}
					{tab.label}
				{/if}
				{#if tab.count != null}
					<span class="ml-1 text-xs text-ink-subtle">({tab.count})</span>
				{/if}
				{#if active === tab.id}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-viking-600"></div>
				{/if}
			</button>
		{/each}
	</div>
{:else}
	<div class="flex gap-1 p-1 bg-canvas-subtle rounded-xl border border-border/40 {className}" role="tablist">
		{#each tabs as tab (tab.id)}
			<button
				role="tab"
				aria-selected={active === tab.id}
				class="flex-1 py-2.5 text-center text-sm font-medium rounded-lg transition-colors
					{active === tab.id
						? 'bg-surface-elevated text-viking-600 shadow-sm border border-border/60'
						: 'text-ink-muted hover:text-ink'}"
				onclick={() => { active = tab.id; }}
			>
				{tab.label}
				{#if tab.count != null}
					<span class="ml-1 text-xs text-ink-subtle">({tab.count})</span>
				{/if}
				{#if tab.detail}
					<span class="text-xs opacity-60 block">{tab.detail}</span>
				{/if}
			</button>
		{/each}
	</div>
{/if}

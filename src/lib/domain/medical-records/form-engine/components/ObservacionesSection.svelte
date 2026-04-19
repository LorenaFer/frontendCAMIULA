<script lang="ts">
	import Textarea from '$shared/components/input/Textarea.svelte';

	interface Props {
		value: string;
		disabled?: boolean;
		onchange: (value: string) => void;
		class?: string;
	}

	let { value, disabled = false, onchange, class: className = '' }: Props = $props();

	let collapsed = $state(false);
</script>

<div class="bg-surface rounded-xl border border-border/60 overflow-hidden {className}">
	<!-- Header -->
	<button
		type="button"
		class="w-full flex items-center justify-between px-5 py-3.5
			cursor-pointer hover:bg-canvas-subtle/50 transition-colors"
		onclick={() => (collapsed = !collapsed)}
	>
		<div class="flex items-center gap-2.5">
			<svg class="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
			</svg>
			<h3 class="text-sm font-semibold text-ink">Observaciones / Notas Libres</h3>
		</div>

		<svg
			class="w-4 h-4 text-ink-muted transition-transform duration-200 {collapsed ? '' : 'rotate-180'}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
		</svg>
	</button>

	<!-- Content -->
	{#if !collapsed}
		<div class="px-5 pb-5 border-t border-border/50">
			<div class="pt-4">
				<Textarea
					{value}
					placeholder="Anotaciones adicionales, hallazgos relevantes, instrucciones especiales..."
					rows={4}
					{disabled}
					oninput={(e) => onchange(e.currentTarget.value)}
					class="w-full"
				/>
			</div>
		</div>
	{/if}
</div>

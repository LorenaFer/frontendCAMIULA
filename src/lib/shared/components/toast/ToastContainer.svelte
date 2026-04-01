<script lang="ts">
	import { getToasts, dismissToast, type ToastVariant } from './toast.svelte.js';

	const iconMap: Record<ToastVariant, { bg: string; color: string; path: string }> = {
		success: {
			bg: 'bg-sage-100 dark:bg-sage-900/30',
			color: 'text-sage-600 dark:text-sage-400',
			path: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
		},
		error: {
			bg: 'bg-red-100 dark:bg-red-900/30',
			color: 'text-red-600 dark:text-red-400',
			path: 'm9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
		},
		warning: {
			bg: 'bg-honey-100 dark:bg-honey-900/30',
			color: 'text-honey-600 dark:text-honey-400',
			path: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
		},
		info: {
			bg: 'bg-viking-100 dark:bg-viking-900/30',
			color: 'text-viking-600 dark:text-viking-400',
			path: 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'
		}
	};
</script>

{#if getToasts().length > 0}
	<div class="fixed top-4 right-4 z-[10000] flex flex-col gap-3 max-w-sm w-full pointer-events-none" role="status" aria-live="polite">
		{#each getToasts() as toast (toast.id)}
			{@const icon = iconMap[toast.variant]}
			<div
				class="pointer-events-auto bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-3)] p-4 flex gap-3 items-start animate-slide-in-toast"
				role="alert"
			>
				<!-- Icon circle -->
				<div class="shrink-0 w-10 h-10 rounded-full {icon.bg} flex items-center justify-center">
					<svg class="w-5 h-5 {icon.color}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d={icon.path} />
					</svg>
				</div>

				<!-- Content -->
				<div class="flex-1 min-w-0">
					<p class="text-sm font-semibold text-ink">{toast.title}</p>
					{#if toast.message}
						<p class="text-sm text-ink-muted mt-0.5">{toast.message}</p>
					{/if}
				</div>

				<!-- Close -->
				<button
					type="button"
					class="shrink-0 p-1 text-ink-subtle hover:text-ink rounded-lg transition-colors"
					onclick={() => dismissToast(toast.id)}
					aria-label="Cerrar"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes slide-in-toast {
		from { opacity: 0; transform: translateX(1rem); }
		to { opacity: 1; transform: translateX(0); }
	}
	.animate-slide-in-toast {
		animation: slide-in-toast 0.25s ease-out;
	}
</style>

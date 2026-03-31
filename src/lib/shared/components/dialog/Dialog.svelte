<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte';
	import Portal from '$shared/components/util/Portal.svelte';

	type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

	const sizeClasses: Record<DialogSize, string> = {
		sm: 'sm:max-w-sm',
		md: 'sm:max-w-md',
		lg: 'sm:max-w-lg',
		xl: 'sm:max-w-xl',
		full: 'sm:max-w-4xl'
	};

	let {
		open,
		onClose,
		children,
		size = 'md',
		persistent = false,
		class: className = ''
	}: {
		open: boolean;
		onClose: () => void;
		children: Snippet;
		size?: DialogSize;
		persistent?: boolean;
		class?: string;
	} = $props();

	let dialogEl: HTMLDivElement;

	setContext('dialog', {
		get onClose() {
			return onClose;
		}
	});

	// Handle escape key
	$effect(() => {
		if (!open) return;

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape' && !persistent) {
				onClose();
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});

	// Lock body scroll when open (counter-based to support stacked dialogs)
	$effect(() => {
		if (!open) return;

		const count = parseInt(document.body.dataset.dialogCount ?? '0', 10);
		document.body.dataset.dialogCount = String(count + 1);
		document.body.style.overflow = 'hidden';

		return () => {
			const c = parseInt(document.body.dataset.dialogCount ?? '1', 10) - 1;
			document.body.dataset.dialogCount = String(c);
			if (c <= 0) {
				document.body.style.overflow = '';
				delete document.body.dataset.dialogCount;
			}
		};
	});

	// Focus trap
	$effect(() => {
		if (!open || !dialogEl) return;

		const focusableElements = dialogEl.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		firstElement?.focus();

		function handleTabKey(e: KeyboardEvent) {
			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				if (document.activeElement === firstElement) {
					e.preventDefault();
					lastElement?.focus();
				}
			} else {
				if (document.activeElement === lastElement) {
					e.preventDefault();
					firstElement?.focus();
				}
			}
		}

		dialogEl.addEventListener('keydown', handleTabKey);
		return () => dialogEl.removeEventListener('keydown', handleTabKey);
	});

	function handleBackdropClick() {
		if (!persistent) {
			onClose();
		}
	}
</script>

{#if open}
	<Portal>
		<div
			class="flex items-end sm:items-center justify-center sm:p-4"
			role="dialog"
			aria-modal="true"
			style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; isolation: isolate;"
		>
			<!-- Backdrop -->
			<div
				class="bg-gray-900/50 animate-in fade-in duration-200"
				style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; -webkit-backdrop-filter: blur(12px) saturate(180%); backdrop-filter: blur(12px) saturate(180%);"
				onclick={handleBackdropClick}
				aria-hidden="true"
				role="presentation"
			></div>

			<!-- Dialog panel - drawer on mobile, modal on sm+ -->
			<div
				bind:this={dialogEl}
				class="
					w-full bg-surface-elevated shadow-[var(--shadow-4)] flex flex-col
					max-h-[85vh] sm:max-h-[90vh]
					rounded-t-2xl sm:rounded-xl
					animate-in fade-in dialog-panel duration-200
					{sizeClasses[size]}
					{className}
				"
				style="position: relative; z-index: 1;"
			>
				<!-- Drag handle - visible only on mobile -->
				<div class="flex justify-center pt-3 pb-1 sm:hidden">
					<div class="w-10 h-1 bg-border-strong rounded-full"></div>
				</div>
				{@render children()}
			</div>
		</div>
	</Portal>
{/if}

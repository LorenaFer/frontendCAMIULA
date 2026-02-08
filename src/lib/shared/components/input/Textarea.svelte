<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type InputSize = 'sm' | 'md' | 'lg';

	interface TextareaProps extends Omit<HTMLTextareaAttributes, 'size'> {
		label?: string;
		error?: string;
		hint?: string;
		textareaSize?: InputSize;
		/** Auto-resize based on content */
		autoResize?: boolean;
		textareaRef?: HTMLTextAreaElement;
	}

	let {
		label,
		error,
		hint,
		textareaSize = 'md',
		autoResize = false,
		class: className = '',
		id,
		rows = 3,
		textareaRef = $bindable(),
		...restProps
	}: TextareaProps = $props();

	const textareaSizeStyles: Record<InputSize, string> = {
		sm: 'px-2.5 py-2 text-sm',
		md: 'px-3 py-2.5 text-sm',
		lg: 'px-3.5 py-3 text-sm'
	};

	const getStateClasses = (err?: string) =>
		err
			? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
			: 'border-border hover:border-border-strong focus:border-border-strong focus:ring-2 focus:ring-border-subtle';

	const disabledClasses =
		'disabled:bg-canvas-subtle disabled:text-ink-subtle disabled:cursor-not-allowed disabled:hover:border-border';

	let textareaId = $derived(id || label?.toLowerCase().replace(/\s+/g, '-'));

	function handleInput(e: Event) {
		if (autoResize) {
			const target = e.target as HTMLTextAreaElement;
			target.style.height = 'auto';
			target.style.height = `${target.scrollHeight}px`;
		}
	}
</script>

<div class="w-full">
	{#if label}
		<label for={textareaId} class="block text-sm font-medium text-ink mb-1.5">
			{label}
		</label>
	{/if}
	<textarea
		bind:this={textareaRef}
		id={textareaId}
		{rows}
		oninput={handleInput}
		class="w-full rounded-lg border bg-surface-elevated text-ink placeholder:text-ink-subtle transition-all duration-150 focus:outline-none {autoResize
			? 'resize-none overflow-hidden'
			: 'resize-y'} {textareaSizeStyles[textareaSize]} {getStateClasses(
			error
		)} {disabledClasses} {className}"
		{...restProps}
	></textarea>
	{#if error || hint}
		<p class="mt-1.5 text-xs {error ? 'text-red-600' : 'text-ink-muted'}">
			{error || hint}
		</p>
	{/if}
</div>

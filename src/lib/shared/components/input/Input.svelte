<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type InputSize = 'sm' | 'md' | 'lg';

	interface InputProps extends Omit<HTMLInputAttributes, 'size'> {
		label?: string;
		error?: string;
		hint?: string;
		icon?: Snippet;
		iconPosition?: 'left' | 'right';
		inputSize?: InputSize;
		/** Make label and input inline */
		inline?: boolean;
		/** Reference to the underlying input element */
		inputRef?: HTMLInputElement;
	}

	let {
		label,
		error,
		hint,
		icon,
		iconPosition: position = 'left',
		inputSize = 'md',
		inline = false,
		class: className = '',
		id,
		inputRef = $bindable(),
		value = $bindable(),
		...restProps
	}: InputProps = $props();

	const sizeStyles: Record<InputSize, string> = {
		sm: 'h-8 px-2.5 text-sm',
		md: 'h-9 px-3 text-sm',
		lg: 'h-10 px-3.5 text-sm'
	};

	const iconPadding: Record<InputSize, { left: string; right: string }> = {
		sm: { left: 'pl-8', right: 'pr-8' },
		md: { left: 'pl-9', right: 'pr-9' },
		lg: { left: 'pl-10', right: 'pr-10' }
	};

	const iconSizeMap: Record<InputSize, string> = {
		sm: 'w-4 h-4',
		md: 'w-4 h-4',
		lg: 'w-5 h-5'
	};

	const iconPositionStyles: Record<InputSize, { left: string; right: string }> = {
		sm: { left: 'left-2.5', right: 'right-2.5' },
		md: { left: 'left-3', right: 'right-3' },
		lg: { left: 'left-3', right: 'right-3' }
	};

	const baseInputClasses =
		'w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none';

	const getStateClasses = (err?: string) =>
		err
			? 'border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-100/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]'
			: 'border-slate-200 hover:border-slate-300 focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60 focus:shadow-[0_0_0_3px_rgba(46,163,181,0.08)]';

	const disabledClasses =
		'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:border-slate-200';

	let inputId = $derived(id || label?.toLowerCase().replace(/\s+/g, '-'));
</script>

{#if inline && label}
	<div class="w-full">
		<div class="flex items-center gap-3">
			<label for={inputId} class="text-sm font-medium text-slate-700 whitespace-nowrap">
				{label}
			</label>
			<div class="relative flex-1">
				{#if icon}
					<div
						class="absolute top-1/2 -translate-y-1/2 {iconPositionStyles[inputSize][position]} text-slate-400 pointer-events-none"
					>
						<span class={iconSizeMap[inputSize]}>
							{@render icon()}
						</span>
					</div>
				{/if}
				<input
					bind:this={inputRef}
					bind:value
					id={inputId}
					class="{baseInputClasses} {sizeStyles[inputSize]} {icon
						? iconPadding[inputSize][position]
						: ''} {getStateClasses(error)} {disabledClasses} {className}"
					{...restProps}
				/>
			</div>
		</div>
		{#if error || hint}
			<p class="mt-1.5 text-xs {error ? 'text-red-600 animate-slide-down' : 'text-slate-500'}">
				{error || hint}
			</p>
		{/if}
	</div>
{:else}
	<div class="w-full">
		{#if label}
			<label for={inputId} class="block text-sm font-medium text-slate-700 mb-1.5">
				{label}
			</label>
		{/if}
		<div class="relative flex-1">
			{#if icon}
				<div
					class="absolute top-1/2 -translate-y-1/2 {iconPositionStyles[inputSize][position]} text-slate-400 pointer-events-none"
				>
					<span class={iconSizeMap[inputSize]}>
						{@render icon()}
					</span>
				</div>
			{/if}
			<input
				bind:this={inputRef}
				bind:value
				id={inputId}
				class="{baseInputClasses} {sizeStyles[inputSize]} {icon
					? iconPadding[inputSize][position]
					: ''} {getStateClasses(error)} {disabledClasses} {className}"
				{...restProps}
			/>
		</div>
		{#if error || hint}
			<p class="mt-1.5 text-xs {error ? 'text-red-600 animate-slide-down' : 'text-slate-500'}">
				{error || hint}
			</p>
		{/if}
	</div>
{/if}

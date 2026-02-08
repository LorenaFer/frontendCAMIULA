<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Input from './Input.svelte';

	type InputSize = 'sm' | 'md' | 'lg';

	interface NumberInputProps extends Omit<HTMLInputAttributes, 'size' | 'value' | 'onchange'> {
		label?: string;
		error?: string;
		hint?: string;
		inputSize?: InputSize;
		value?: number | string;
		onchange?: (value: number | undefined) => void;
		min?: number;
		max?: number;
		step?: number;
		allowDecimals?: boolean;
		/** Show increment/decrement buttons */
		showControls?: boolean;
		inputRef?: HTMLInputElement;
	}

	let {
		value = $bindable(),
		onchange,
		min,
		max,
		step = 1,
		allowDecimals = true,
		showControls = false,
		inputSize = 'md',
		label,
		error,
		hint,
		disabled,
		class: className = '',
		inputRef = $bindable(),
		...restProps
	}: NumberInputProps = $props();

	const sizeStyles: Record<InputSize, string> = {
		sm: 'h-8 px-2.5 text-sm',
		md: 'h-9 px-3 text-sm',
		lg: 'h-10 px-3.5 text-sm'
	};

	const getStateClasses = (err?: string) =>
		err
			? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
			: 'border-border hover:border-border-strong focus:border-border-strong focus:ring-2 focus:ring-border-subtle';

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const rawValue = target.value;
		if (rawValue === '' || rawValue === '-') {
			value = undefined;
			onchange?.(undefined);
			return;
		}
		const numValue = allowDecimals ? parseFloat(rawValue) : parseInt(rawValue, 10);
		if (!isNaN(numValue)) {
			value = numValue;
			onchange?.(numValue);
		}
	}

	function increment() {
		const currentValue = typeof value === 'number' ? value : 0;
		const newValue = currentValue + step;
		if (max === undefined || newValue <= max) {
			value = newValue;
			onchange?.(newValue);
		}
	}

	function decrement() {
		const currentValue = typeof value === 'number' ? value : 0;
		const newValue = currentValue - step;
		if (min === undefined || newValue >= min) {
			value = newValue;
			onchange?.(newValue);
		}
	}
</script>

{#if showControls}
	<div class="w-full">
		{#if label}
			<label class="block text-sm font-medium text-ink mb-1.5">
				{label}
			</label>
		{/if}
		<div class="flex">
			<button
				type="button"
				onclick={decrement}
				class="px-3 border border-r-0 border-border rounded-l-lg bg-canvas-subtle text-ink-muted hover:bg-canvas-subtle transition-colors disabled:opacity-50"
				disabled={disabled || (min !== undefined && typeof value === 'number' && value <= min)}
			>
				<svg
					class="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
				</svg>
			</button>
			<input
				bind:this={inputRef}
				type="text"
				inputmode={allowDecimals ? 'decimal' : 'numeric'}
				value={value ?? ''}
				oninput={handleInput}
				class="flex-1 border-y border-border bg-surface-elevated text-ink text-center {sizeStyles[
					inputSize
				]} {getStateClasses(error)} focus:outline-none focus:z-10 focus:relative {className}"
				{disabled}
				{...restProps}
			/>
			<button
				type="button"
				onclick={increment}
				class="px-3 border border-l-0 border-border rounded-r-lg bg-canvas-subtle text-ink-muted hover:bg-canvas-subtle transition-colors disabled:opacity-50"
				disabled={disabled || (max !== undefined && typeof value === 'number' && value >= max)}
			>
				<svg
					class="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
			</button>
		</div>
		{#if error || hint}
			<p class="mt-1.5 text-xs {error ? 'text-red-600' : 'text-ink-muted'}">
				{error || hint}
			</p>
		{/if}
	</div>
{:else}
	<Input
		bind:inputRef
		type="text"
		inputmode={allowDecimals ? 'decimal' : 'numeric'}
		value={value ?? ''}
		oninput={handleInput}
		{inputSize}
		{label}
		{error}
		{hint}
		{disabled}
		class={className}
		{...restProps}
	/>
{/if}

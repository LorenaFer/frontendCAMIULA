<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface SwitchProps extends Omit<HTMLInputAttributes, 'type' | 'size'> {
		label?: string;
		description?: string;
		switchSize?: 'sm' | 'md' | 'lg';
		checked?: boolean;
		inputRef?: HTMLInputElement;
	}

	let {
		label,
		description,
		switchSize = 'md',
		checked = $bindable(false),
		disabled,
		class: className = '',
		id,
		inputRef = $bindable(),
		...restProps
	}: SwitchProps = $props();

	const switchSizeStyles: Record<
		string,
		{ track: string; thumb: string; translateOn: string; translateOff: string }
	> = {
		sm: {
			track: 'w-8 h-4',
			thumb: 'w-3 h-3',
			translateOn: 'translate-x-4',
			translateOff: 'translate-x-0'
		},
		md: {
			track: 'w-10 h-5',
			thumb: 'w-4 h-4',
			translateOn: 'translate-x-5',
			translateOff: 'translate-x-0'
		},
		lg: {
			track: 'w-12 h-6',
			thumb: 'w-5 h-5',
			translateOn: 'translate-x-6',
			translateOff: 'translate-x-0'
		}
	};

	let switchId = $derived(id || label?.toLowerCase().replace(/\s+/g, '-'));
	let sizes = $derived(switchSizeStyles[switchSize]);
</script>

<label
	for={switchId}
	class="flex items-start gap-3 {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
>
	<div class="relative flex-shrink-0">
		<input
			bind:this={inputRef}
			type="checkbox"
			id={switchId}
			bind:checked
			{disabled}
			class="sr-only"
			{...restProps}
		/>
		<div
			class="{sizes.track} rounded-full transition-colors {checked
				? 'bg-slate-900'
				: 'bg-slate-200'} {className}"
		></div>
		<div
			class="absolute top-0.5 left-0.5 {sizes.thumb} rounded-full bg-white shadow-sm transition-transform duration-200 {checked
				? sizes.translateOn
				: sizes.translateOff}"
		></div>
	</div>
	{#if label || description}
		<div class="flex-1 pt-0.5">
			{#if label}
				<span class="text-sm font-medium text-slate-700">{label}</span>
			{/if}
			{#if description}
				<p class="text-sm text-slate-500 mt-0.5">{description}</p>
			{/if}
		</div>
	{/if}
</label>

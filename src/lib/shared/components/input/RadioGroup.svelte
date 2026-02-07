<script lang="ts">
	interface RadioOption {
		value: string;
		label: string;
		description?: string;
		disabled?: boolean;
	}

	interface RadioGroupProps {
		name: string;
		options: RadioOption[];
		value?: string;
		onchange?: (value: string) => void;
		label?: string;
		error?: string;
		orientation?: 'horizontal' | 'vertical';
		radioSize?: 'sm' | 'md' | 'lg';
	}

	let {
		name,
		options,
		value = $bindable(),
		onchange,
		label,
		error,
		orientation = 'vertical',
		radioSize = 'md'
	}: RadioGroupProps = $props();

	const radioSizeStyles: Record<string, string> = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};

	function handleChange(optionValue: string) {
		value = optionValue;
		onchange?.(optionValue);
	}
</script>

<fieldset class="w-full">
	{#if label}
		<legend class="text-sm font-medium text-slate-700 mb-2">{label}</legend>
	{/if}
	<div
		class="flex {orientation === 'vertical' ? 'flex-col gap-2' : 'flex-wrap gap-4'}"
	>
		{#each options as option (option.value)}
			<label
				class="flex items-start gap-3 cursor-pointer {option.disabled
					? 'opacity-50 cursor-not-allowed'
					: ''}"
			>
				<input
					type="radio"
					{name}
					value={option.value}
					checked={value === option.value}
					onchange={() => handleChange(option.value)}
					disabled={option.disabled}
					class="{radioSizeStyles[radioSize]} border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-200 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
				/>
				<div class="flex-1">
					<span class="text-sm font-medium text-slate-700">{option.label}</span>
					{#if option.description}
						<p class="text-sm text-slate-500 mt-0.5">{option.description}</p>
					{/if}
				</div>
			</label>
		{/each}
	</div>
	{#if error}
		<p class="text-xs text-red-600 mt-2">{error}</p>
	{/if}
</fieldset>

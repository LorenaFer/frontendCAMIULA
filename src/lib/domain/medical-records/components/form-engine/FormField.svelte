<script lang="ts">
	import type { FormFieldSchema } from '$domain/medical-records/form-schema.js';
	import Input from '$shared/components/input/Input.svelte';
	import Textarea from '$shared/components/input/Textarea.svelte';
	import NumberInput from '$shared/components/input/NumberInput.svelte';
	import DateInput from '$shared/components/input/DateInput.svelte';
	import Checkbox from '$shared/components/input/Checkbox.svelte';
	import RadioGroup from '$shared/components/input/RadioGroup.svelte';
	import Switch from '$shared/components/input/Switch.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import DentalChart from '$domain/medical-records/components/widgets/DentalChart.svelte';
	import BodyDiagram from '$domain/medical-records/components/widgets/BodyDiagram.svelte';

	interface Props {
		field: FormFieldSchema;
		value: unknown;
		error?: string;
		disabled?: boolean;
		onchange: (value: unknown) => void;
	}

	let { field, value, error, disabled = false, onchange }: Props = $props();

	// Handlers tipados por tipo de campo
	function handleTextInput(e: Event) {
		const target = e.target as HTMLInputElement;
		onchange(target.value);
	}

	function handleCheckboxChange(checked: boolean) {
		onchange(checked);
	}

	function handleCheckboxGroupItem(optionValue: string, checked: boolean) {
		const current = Array.isArray(value) ? (value as string[]) : [];
		if (checked) {
			onchange([...current, optionValue]);
		} else {
			onchange(current.filter((v) => v !== optionValue));
		}
	}
</script>

{#if field.type === 'text'}
	<Input
		label={field.label}
		placeholder={field.placeholder}
		hint={field.hint}
		{error}
		{disabled}
		value={typeof value === 'string' ? value : ''}
		oninput={handleTextInput}
	/>

{:else if field.type === 'textarea'}
	<Textarea
		label={field.label}
		placeholder={field.placeholder}
		hint={field.hint}
		{error}
		{disabled}
		rows={field.rows ?? 3}
		value={typeof value === 'string' ? value : ''}
		oninput={handleTextInput}
	/>

{:else if field.type === 'number'}
	<NumberInput
		label={field.label}
		placeholder={field.placeholder}
		hint={field.hint}
		{error}
		{disabled}
		value={value as number | string | undefined}
		min={field.validation?.min}
		max={field.validation?.max}
		onchange={(v) => onchange(v)}
	/>

{:else if field.type === 'date'}
	<DateInput
		label={field.label}
		hint={field.hint}
		{error}
		{disabled}
		value={typeof value === 'string' ? value : ''}
		oninput={(e) => onchange(e.target.value)}
	/>

{:else if field.type === 'time'}
	<Input
		type="time"
		label={field.label}
		hint={field.hint}
		{error}
		{disabled}
		value={typeof value === 'string' ? value : ''}
		oninput={handleTextInput}
	/>

{:else if field.type === 'select' && field.options}
	<Select
		label={field.label}
		placeholder={field.placeholder}
		hint={field.hint}
		{error}
		{disabled}
		options={field.options.map((o) => ({ value: o.value, label: o.label }))}
		value={typeof value === 'string' ? value : ''}
		onchange={(v) => onchange(v)}
	/>

{:else if field.type === 'checkbox'}
	<Checkbox
		label={field.label}
		description={field.hint}
		{error}
		{disabled}
		checked={!!value}
		onchange={(e) => handleCheckboxChange((e.target as HTMLInputElement).checked)}
	/>

{:else if field.type === 'checkbox_group' && field.options}
	<fieldset class="w-full">
		{#if field.label}
			<legend class="text-sm font-medium text-ink mb-2">{field.label}</legend>
		{/if}
		{#if field.hint}
			<p class="text-sm text-ink-muted mb-2">{field.hint}</p>
		{/if}
		<div class="flex flex-col gap-2">
			{#each field.options as option (option.value)}
				<Checkbox
					label={option.label}
					description={option.description}
					{disabled}
					checked={Array.isArray(value) && value.includes(option.value)}
					onchange={(e) =>
						handleCheckboxGroupItem(option.value, (e.target as HTMLInputElement).checked)}
				/>
			{/each}
		</div>
		{#if error}
			<p class="text-xs text-red-600 mt-2">{error}</p>
		{/if}
	</fieldset>

{:else if field.type === 'radio' && field.options}
	<RadioGroup
		name={field.key}
		label={field.label}
		{error}
		options={field.options.map((o) => ({
			value: o.value,
			label: o.label,
			description: o.description,
			disabled
		}))}
		value={typeof value === 'string' ? value : ''}
		onchange={(v) => onchange(v)}
	/>

{:else if field.type === 'switch'}
	<Switch
		label={field.label}
		description={field.hint}
		{disabled}
		checked={!!value}
		onchange={(e) => handleCheckboxChange((e.target as HTMLInputElement).checked)}
	/>

{:else if field.type === 'widget' && field.widgetConfig?.widgetType === 'dental_chart'}
	{#if field.label}
		<label class="block text-sm font-medium text-ink mb-2">{field.label}</label>
	{/if}
	<DentalChart
		value={(value ?? {}) as Record<string, { estado: string; descripcion?: string; soporte?: string }>}
		{disabled}
		onchange={(v) => onchange(v)}
	/>

{:else if field.type === 'widget' && field.widgetConfig?.widgetType === 'body_diagram'}
	{#if field.label}
		<label class="block text-sm font-medium text-ink mb-2">{field.label}</label>
	{/if}
	<BodyDiagram
		value={(value ?? []) as { id: string; x: number; y: number; view: 'front' | 'back'; descripcion: string }[]}
		{disabled}
		onchange={(v) => onchange(v)}
	/>

{:else if field.type === 'widget' && field.widgetConfig}
	<!-- Widget no implementado todavía -->
	<div class="rounded-lg border border-dashed border-border p-4 text-center text-sm text-ink-muted">
		<p class="font-medium">{field.label}</p>
		<p>Widget: {field.widgetConfig.widgetType}</p>
	</div>

{:else}
	<!-- Fallback para tipos no reconocidos -->
	<Input
		label={field.label}
		placeholder={field.placeholder}
		hint={field.hint}
		{error}
		{disabled}
		value={typeof value === 'string' ? value : String(value ?? '')}
		oninput={handleTextInput}
	/>
{/if}

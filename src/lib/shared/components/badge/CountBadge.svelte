<script lang="ts">
	let {
		count,
		max = 99,
		variant = 'default',
		class: className = ''
	}: {
		count: number;
		max?: number;
		variant?: 'default' | 'primary' | 'danger';
		class?: string;
	} = $props();

	const variants: Record<'default' | 'primary' | 'danger', string> = {
		default: 'bg-gray-100 text-gray-600',
		primary: 'bg-viking-600 text-white',
		danger: 'bg-red-600 text-white'
	};
</script>

{#if count !== 0}
	<span
		class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-semibold rounded-full tabular-nums {variants[
			variant
		]} {className}"
	>
		{count > max ? `${max}+` : count}
	</span>
{/if}

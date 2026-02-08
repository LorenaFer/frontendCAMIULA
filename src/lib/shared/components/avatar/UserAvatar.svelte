<script lang="ts">
	import Avatar from './Avatar.svelte';

	type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';
	type AvatarColor = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet';

	let {
		src,
		name,
		subtitle,
		initials,
		size = 'md',
		status,
		color,
		class: className = ''
	}: {
		src?: string;
		name: string;
		subtitle?: string;
		initials?: string;
		size?: AvatarSize;
		status?: AvatarStatus;
		color?: AvatarColor;
		class?: string;
	} = $props();

	const gapStyles: Record<AvatarSize, string> = {
		xs: 'gap-2',
		sm: 'gap-2.5',
		md: 'gap-3',
		lg: 'gap-3',
		xl: 'gap-4'
	};

	const computedInitials = $derived(
		initials ||
			name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.slice(0, 2)
				.toUpperCase()
	);
</script>

<div class="flex items-center {gapStyles[size]} {className}">
	<Avatar {src} alt={name} initials={computedInitials} {size} {status} {color} />
	<div class="min-w-0 flex-1">
		<p class="text-sm font-medium text-ink truncate">{name}</p>
		{#if subtitle}
			<p class="text-xs text-ink-muted truncate mt-0.5">{subtitle}</p>
		{/if}
	</div>
</div>

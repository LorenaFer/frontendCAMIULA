<script lang="ts">
	import Avatar from './Avatar.svelte';

	type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';
	type AvatarColor = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet';

	interface AvatarItem {
		src?: string;
		alt?: string;
		initials?: string;
		status?: AvatarStatus;
		color?: AvatarColor;
	}

	let {
		avatars,
		max,
		size = 'md',
		class: className = ''
	}: {
		avatars: AvatarItem[];
		max?: number;
		size?: AvatarSize;
		class?: string;
	} = $props();

	const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
		xs: { container: 'w-6 h-6', text: 'text-[10px]' },
		sm: { container: 'w-8 h-8', text: 'text-xs' },
		md: { container: 'w-10 h-10', text: 'text-sm' },
		lg: { container: 'w-12 h-12', text: 'text-base' },
		xl: { container: 'w-16 h-16', text: 'text-lg' }
	};

	const visibleAvatars = $derived(max ? avatars.slice(0, max) : avatars);
	const remainingCount = $derived(max ? Math.max(0, avatars.length - max) : 0);
	const styles = $derived(sizeStyles[size]);
</script>

<div class="flex -space-x-2 {className}">
	{#each visibleAvatars as avatar, index (index)}
		<div class="ring-2 ring-surface-elevated rounded-full">
			<Avatar
				src={avatar.src}
				alt={avatar.alt}
				initials={avatar.initials}
				{size}
				status={avatar.status}
				color={avatar.color}
			/>
		</div>
	{/each}
	{#if remainingCount > 0}
		<div
			class="{styles.container} rounded-full bg-canvas-subtle text-ink-muted flex items-center justify-center font-medium {styles.text} ring-2 ring-surface-elevated"
		>
			+{remainingCount}
		</div>
	{/if}
</div>

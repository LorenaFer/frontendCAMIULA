<script lang="ts">
	type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';
	type AvatarColor = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet';

	let {
		src,
		alt = '',
		initials,
		size = 'md',
		status,
		color,
		class: className = ''
	}: {
		src?: string;
		alt?: string;
		initials?: string;
		size?: AvatarSize;
		status?: AvatarStatus;
		color?: AvatarColor;
		class?: string;
	} = $props();

	const sizeStyles: Record<
		AvatarSize,
		{ container: string; text: string; status: string; statusRing: string }
	> = {
		xs: { container: 'w-6 h-6', text: 'text-[10px]', status: 'w-1.5 h-1.5', statusRing: 'ring-1' },
		sm: {
			container: 'w-8 h-8',
			text: 'text-xs',
			status: 'w-2 h-2',
			statusRing: 'ring-[1.5px]'
		},
		md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-2.5 h-2.5', statusRing: 'ring-2' },
		lg: { container: 'w-12 h-12', text: 'text-base', status: 'w-3 h-3', statusRing: 'ring-2' },
		xl: { container: 'w-16 h-16', text: 'text-lg', status: 'w-3.5 h-3.5', statusRing: 'ring-2' }
	};

	const statusColors: Record<AvatarStatus, string> = {
		online: 'bg-emerald-500',
		offline: 'bg-slate-300',
		busy: 'bg-red-400',
		away: 'bg-amber-400'
	};

	const avatarColors: Record<AvatarColor, string> = {
		gray: 'bg-slate-100 text-slate-600',
		blue: 'bg-slate-100 text-slate-600',
		green: 'bg-slate-100 text-slate-600',
		amber: 'bg-slate-100 text-slate-600',
		red: 'bg-slate-100 text-slate-600',
		violet: 'bg-slate-100 text-slate-600'
	};

	function getColorFromName(name: string): AvatarColor {
		const colors: AvatarColor[] = ['gray', 'blue', 'green', 'amber', 'violet'];
		const charCode = name.charCodeAt(0) || 0;
		return colors[charCode % colors.length];
	}

	const styles = $derived(sizeStyles[size]);
	const avatarColor = $derived(color || getColorFromName(initials || alt));
</script>

<div class="relative inline-flex flex-shrink-0 {className}">
	{#if src}
		<img {src} {alt} class="{styles.container} rounded-full object-cover" />
	{:else}
		<div
			class="{styles.container} rounded-full flex items-center justify-center font-medium {styles.text} {avatarColors[
				avatarColor
			]}"
		>
			{initials || alt.charAt(0).toUpperCase()}
		</div>
	{/if}
	{#if status}
		<span
			class="absolute bottom-0 right-0 {styles.status} rounded-full ring-white {styles.statusRing} {statusColors[
				status
			]}"
		></span>
	{/if}
</div>

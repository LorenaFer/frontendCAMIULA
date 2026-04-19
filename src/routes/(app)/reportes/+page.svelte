<script lang="ts">
	import type { PageData } from './$types';
	import ReportsView from '$domain/reports/components/views/ReportsView.svelte';

	let { data }: { data: PageData } = $props();
</script>

<ReportsView {data} />

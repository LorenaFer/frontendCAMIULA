<script lang="ts">
	import '../app.css';
	import ToastContainer from '$shared/components/toast/ToastContainer.svelte';

	let { children } = $props();
</script>

{@render children()}
<ToastContainer />

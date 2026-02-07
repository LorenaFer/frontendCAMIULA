<script lang="ts">
  let {
    class: className = ''
  }: {
    class?: string;
  } = $props();
</script>

<td class="px-2 py-2 w-6 text-right {className}">
  <svg
    class="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors ml-auto"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
</td>

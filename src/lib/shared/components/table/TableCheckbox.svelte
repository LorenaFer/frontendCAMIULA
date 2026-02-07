<script lang="ts">
  let {
    checked,
    onchange,
    indeterminate = false,
    class: className = ''
  }: {
    checked: boolean;
    onchange: (checked: boolean) => void;
    indeterminate?: boolean;
    class?: string;
  } = $props();

  let checkboxEl: HTMLInputElement;

  $effect(() => {
    if (checkboxEl) {
      checkboxEl.indeterminate = indeterminate;
    }
  });
</script>

<td class="px-3 py-2 w-8 {className}">
  <input
    type="checkbox"
    {checked}
    bind:this={checkboxEl}
    onchange={(e) => onchange(e.currentTarget.checked)}
    class="w-3.5 h-3.5 rounded border-slate-300 text-viking-600 focus:ring-viking-500/20 focus:ring-offset-0 cursor-pointer"
  />
</td>

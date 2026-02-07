<script lang="ts">
  type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

  interface Props {
    label?: string;
    error?: string;
    hint?: string;
    value?: File | string;
    onchange?: (file: File | undefined) => void;
    size?: AvatarSize;
    disabled?: boolean;
    class?: string;
  }

  let {
    label,
    error,
    hint,
    value,
    onchange,
    size = 'lg',
    disabled = false,
    class: className = '',
  }: Props = $props();

  let inputRef: HTMLInputElement;

  const avatarSizes: Record<AvatarSize, string> = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  };

  let previewUrl = $derived(
    value
      ? typeof value === 'string'
        ? value
        : URL.createObjectURL(value)
      : null
  );

  function handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onchange?.(file);
    }
    target.value = '';
  }

  function handleClick() {
    if (!disabled) inputRef?.click();
  }

  function handleRemove() {
    onchange?.(undefined);
  }
</script>

<div class="inline-flex flex-col items-center {className}">
  {#if label}
    <label class="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
  {/if}

  <div class="relative group">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      onclick={handleClick}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      class="
        {avatarSizes[size]}
        rounded-full overflow-hidden
        flex items-center justify-center
        border-2 border-dashed
        transition-all duration-150 cursor-pointer
        {previewUrl
          ? 'border-transparent'
          : error
            ? 'border-red-300 bg-red-50/30'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300'}
        {disabled ? 'opacity-50 cursor-not-allowed' : ''}
      "
    >
      {#if previewUrl}
        <img
          src={previewUrl}
          alt="Avatar"
          class="w-full h-full object-cover"
        />
      {:else}
        <svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      {/if}
    </div>

    <!-- Hover overlay for existing avatar -->
    {#if previewUrl && !disabled}
      <div
        class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
      >
        <button
          type="button"
          onclick={handleClick}
          class="p-1.5 bg-white rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
          </svg>
        </button>
        <button
          type="button"
          onclick={handleRemove}
          class="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    {/if}
  </div>

  <input
    bind:this={inputRef}
    type="file"
    accept="image/*"
    onchange={handleChange}
    {disabled}
    class="hidden"
  />

  {#if error}
    <p class="mt-2 text-xs text-red-600">{error}</p>
  {/if}
  {#if hint && !error}
    <p class="mt-2 text-xs text-slate-500">{hint}</p>
  {/if}
</div>

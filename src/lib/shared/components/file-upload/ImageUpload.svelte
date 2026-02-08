<script lang="ts">
  interface Props {
    label?: string;
    error?: string;
    hint?: string;
    /** Current files */
    value?: File[];
    /** Called when files change */
    onchange?: (files: File[]) => void;
    /** Allow multiple files */
    multiple?: boolean;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Maximum number of files */
    maxFiles?: number;
    /** Upload size variant */
    uploadSize?: 'sm' | 'md' | 'lg';
    /** Compact inline mode */
    compact?: boolean;
    /** Aspect ratio for preview (e.g., "1/1", "16/9") */
    aspectRatio?: string;
    /** Show circular preview */
    circular?: boolean;
    disabled?: boolean;
    class?: string;
  }

  let {
    label,
    error,
    hint,
    value = [],
    onchange,
    multiple = false,
    maxSize = 5 * 1024 * 1024, // 5MB default
    aspectRatio = '1/1',
    circular = false,
    disabled = false,
    class: className = '',
  }: Props = $props();

  let isDragging = $state(false);
  let inputRef: HTMLInputElement;

  let previewUrl = $derived(value.length > 0 ? URL.createObjectURL(value[0]) : null);

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!disabled) isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (disabled) return;

    const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) {
      onchange?.(multiple ? [...value, ...files] : files.slice(0, 1));
    }
  }

  function handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files);
      onchange?.(multiple ? [...value, ...imageFiles] : imageFiles.slice(0, 1));
    }
    target.value = '';
  }

  function handleRemove(index: number) {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onchange?.(newFiles);
  }

  function handleClick() {
    if (!disabled) inputRef?.click();
  }
</script>

<div class="w-full {className}">
  {#if label}
    <label class="block text-sm font-medium text-ink mb-1.5">
      {label}
    </label>
  {/if}

  {#if !multiple && value.length > 0 && previewUrl}
    <!-- Single image preview -->
    <div class="relative group">
      <div
        class="
          overflow-hidden bg-canvas-subtle
          {circular ? 'rounded-full' : 'rounded-lg'}
        "
        style:aspect-ratio={aspectRatio}
      >
        <img
          src={previewUrl}
          alt="Preview"
          class="w-full h-full object-cover"
        />
      </div>
      <div
        class="
          absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity
          flex items-center justify-center gap-2
          {circular ? 'rounded-full' : 'rounded-lg'}
        "
      >
        <button
          type="button"
          onclick={handleClick}
          class="p-2 bg-surface-elevated rounded-lg text-ink hover:bg-canvas-subtle transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </button>
        <button
          type="button"
          onclick={() => handleRemove(0)}
          class="p-2 bg-surface-elevated rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  {:else}
    <!-- Upload zone -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      onclick={handleClick}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      class="
        border-2 border-dashed rounded-lg p-6
        flex flex-col items-center justify-center gap-2
        transition-all duration-150 cursor-pointer
        {circular ? 'rounded-full aspect-square' : ''}
        {isDragging
          ? 'border-border-strong bg-canvas-subtle'
          : error
            ? 'border-red-300 bg-red-50/30'
            : 'border-border hover:border-border-strong hover:bg-canvas-subtle/50'}
        {disabled ? 'opacity-50 cursor-not-allowed' : ''}
      "
      style:aspect-ratio={!circular ? aspectRatio : undefined}
    >
      <div class="rounded-full p-2 bg-canvas-subtle">
        <svg class="w-6 h-6 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      </div>
      <p class="text-sm text-ink-muted">Upload image</p>
      {#if maxSize}
        <p class="text-xs text-ink-subtle">Max {formatFileSize(maxSize)}</p>
      {/if}
    </div>
  {/if}

  <input
    bind:this={inputRef}
    type="file"
    accept="image/*"
    {multiple}
    onchange={handleChange}
    {disabled}
    class="hidden"
  />

  <!-- Multiple images preview -->
  {#if multiple && value.length > 0}
    <div class="mt-3 grid grid-cols-4 gap-2">
      {#each value as file, index (index)}
        <div class="relative group aspect-square">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            class="w-full h-full object-cover rounded-lg"
          />
          <button
            type="button"
            onclick={() => handleRemove(index)}
            class="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}

  {#if error}
    <p class="mt-1.5 text-xs text-red-600">{error}</p>
  {/if}
  {#if hint && !error}
    <p class="mt-1.5 text-xs text-ink-muted">{hint}</p>
  {/if}
</div>

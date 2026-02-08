<script lang="ts">
  // 2025 Design: Clean file upload components
  // - Muted slate palette
  // - Smooth drag & drop interactions

  type FileUploadSize = 'sm' | 'md' | 'lg';

  interface Props {
    label?: string;
    error?: string;
    hint?: string;
    /** Accepted file types (e.g., "image/*", ".pdf,.doc") */
    accept?: string;
    /** Allow multiple files */
    multiple?: boolean;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Maximum number of files */
    maxFiles?: number;
    /** Current files */
    value?: File[];
    /** Called when files change */
    onchange?: (files: File[]) => void;
    /** Upload size variant */
    uploadSize?: FileUploadSize;
    /** Show file previews */
    showPreviews?: boolean;
    /** Compact inline mode */
    compact?: boolean;
    disabled?: boolean;
    class?: string;
  }

  let {
    label,
    error,
    hint,
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    value = [],
    onchange,
    uploadSize = 'md',
    showPreviews = true,
    compact = false,
    disabled = false,
    class: className = '',
  }: Props = $props();

  let isDragging = $state(false);
  let fileErrors = $state<string[]>([]);
  let inputRef: HTMLInputElement;

  const sizeClasses: Record<FileUploadSize, string> = {
    sm: 'py-4 px-4',
    md: 'py-6 px-6',
    lg: 'py-8 px-8',
  };

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  function getFileIconType(type: string): 'image' | 'pdf' | 'generic' {
    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf') return 'pdf';
    return 'generic';
  }

  function validateFile(file: File): string | null {
    if (maxSize && file.size > maxSize) {
      return `File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`;
    }
    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      const fileType = file.type;
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;

      const isAccepted = acceptedTypes.some((accepted) => {
        if (accepted.startsWith('.')) {
          return fileExtension === accepted.toLowerCase();
        }
        if (accepted.endsWith('/*')) {
          return fileType.startsWith(accepted.replace('/*', '/'));
        }
        return fileType === accepted;
      });

      if (!isAccepted) {
        return `File "${file.name}" is not an accepted file type`;
      }
    }
    return null;
  }

  function handleFiles(newFiles: FileList | File[]) {
    const filesArray = Array.from(newFiles);
    const errors: string[] = [];
    const validFiles: File[] = [];

    const remainingSlots = maxFiles ? maxFiles - value.length : Infinity;
    const filesToProcess = filesArray.slice(0, remainingSlots);

    if (filesArray.length > filesToProcess.length) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }

    filesToProcess.forEach((file) => {
      const fileError = validateFile(file);
      if (fileError) {
        errors.push(fileError);
      } else {
        validFiles.push(file);
      }
    });

    fileErrors = errors;

    if (validFiles.length > 0) {
      if (multiple) {
        onchange?.([...value, ...validFiles]);
      } else {
        onchange?.(validFiles.slice(0, 1));
      }
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;

    if (disabled) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }

  function handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    target.value = '';
  }

  function handleRemove(index: number) {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onchange?.(newFiles);
    fileErrors = [];
  }

  function handleClick() {
    if (!disabled) {
      inputRef?.click();
    }
  }
</script>

{#if compact}
  <div class="w-full {className}">
    {#if label}
      <label class="block text-sm font-medium text-ink mb-1.5">
        {label}
      </label>
    {/if}
    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={handleClick}
        {disabled}
        class="
          inline-flex items-center gap-2 px-3 py-1.5
          bg-surface-elevated border border-border rounded-lg text-sm font-medium text-ink
          hover:bg-canvas-subtle hover:border-border-strong
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        Choose file{multiple ? 's' : ''}
      </button>
      <span class="text-sm text-ink-muted">
        {#if value.length === 0}
          No file selected
        {:else if value.length === 1}
          {value[0].name}
        {:else}
          {value.length} files selected
        {/if}
      </span>
    </div>
    <input
      bind:this={inputRef}
      type="file"
      {accept}
      {multiple}
      onchange={handleInputChange}
      {disabled}
      class="hidden"
    />
    {#if error || fileErrors.length > 0 || hint}
      <p class="mt-1.5 text-xs {error || fileErrors.length > 0 ? 'text-red-600' : 'text-ink-muted'}">
        {error || fileErrors[0] || hint}
      </p>
    {/if}
  </div>
{:else}
  <div class="w-full {className}">
    {#if label}
      <label class="block text-sm font-medium text-ink mb-1.5">
        {label}
      </label>
    {/if}

    <!-- Drop zone -->
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
        {sizeClasses[uploadSize]}
        border-2 border-dashed rounded-lg
        flex flex-col items-center justify-center gap-2
        transition-all duration-150 cursor-pointer
        {isDragging
          ? 'border-border-strong bg-canvas-subtle'
          : error || fileErrors.length > 0
            ? 'border-red-300 bg-red-50/30'
            : 'border-border hover:border-border-strong hover:bg-canvas-subtle/50'}
        {disabled ? 'opacity-50 cursor-not-allowed' : ''}
      "
    >
      <div class="rounded-full p-2 {isDragging ? 'bg-canvas-subtle' : 'bg-canvas-subtle'}">
        <svg class="w-6 h-6 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <div class="text-center">
        <p class="text-sm font-medium text-ink">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p class="text-xs text-ink-muted mt-0.5">
          or <span class="text-ink underline underline-offset-2">browse</span>
        </p>
      </div>
      {#if accept || maxSize}
        <p class="text-xs text-ink-subtle mt-1">
          {#if accept}Accepted: {accept}{/if}
          {#if accept && maxSize} &bull; {/if}
          {#if maxSize}Max size: {formatFileSize(maxSize)}{/if}
        </p>
      {/if}
    </div>

    <input
      bind:this={inputRef}
      type="file"
      {accept}
      {multiple}
      onchange={handleInputChange}
      {disabled}
      class="hidden"
    />

    <!-- Error messages -->
    {#if error || fileErrors.length > 0}
      <div class="mt-2 space-y-1">
        {#if error}
          <p class="text-xs text-red-600">{error}</p>
        {/if}
        {#each fileErrors as err}
          <p class="text-xs text-red-600">{err}</p>
        {/each}
      </div>
    {/if}

    <!-- Hint -->
    {#if hint && !error && fileErrors.length === 0}
      <p class="mt-1.5 text-xs text-ink-muted">{hint}</p>
    {/if}

    <!-- File list -->
    {#if showPreviews && value.length > 0}
      <ul class="mt-3 space-y-2">
        {#each value as file, index (file.name + '-' + index)}
          <li class="flex items-center gap-3 p-2 bg-canvas-subtle rounded-lg">
            <!-- Preview or icon -->
            {#if file.type.startsWith('image/')}
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                class="w-10 h-10 rounded object-cover"
              />
            {:else}
              <div class="w-10 h-10 rounded bg-canvas-subtle flex items-center justify-center text-ink-muted">
                {#if getFileIconType(file.type) === 'image'}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                {:else if getFileIconType(file.type) === 'pdf'}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                {:else}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                {/if}
              </div>
            {/if}

            <!-- File info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink truncate">{file.name}</p>
              <p class="text-xs text-ink-muted">{formatFileSize(file.size)}</p>
            </div>

            <!-- Remove button -->
            <button
              type="button"
              onclick={() => handleRemove(index)}
              {disabled}
              class="p-1.5 text-ink-subtle hover:text-ink-muted hover:bg-canvas-subtle rounded transition-colors disabled:opacity-50"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

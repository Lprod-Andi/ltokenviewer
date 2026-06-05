<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { tokenizeText, acquireEncoders, releaseEncoders, type ModelType, type TokenChunk } from '$lib/tokenizer';

  let inputText = '';
  let selectedModel: ModelType = 'o200k_base';

  let tokenCount = 0;
  let charCount = 0;
  let wordCount = 0;
  let chunks: TokenChunk[] = [];
  let error: string | null = null;
  let isLoading = false;
  let debounceTimer: ReturnType<typeof setTimeout>;

  let tooltip: { visible: boolean; x: number; y: number; chunk: TokenChunk | null } = {
    visible: false, x: 0, y: 0, chunk: null
  };

  onMount(() => acquireEncoders());

  function scheduleTokenize(immediate = false) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (!inputText) {
        tokenCount = 0; charCount = 0; wordCount = 0; chunks = []; error = null;
        return;
      }
      isLoading = true;
      try {
        error = null;
        const result = await tokenizeText(inputText, selectedModel);
        tokenCount = result.tokenCount;
        charCount  = result.charCount;
        wordCount  = result.wordCount;
        chunks     = result.chunks;
      } catch {
        error = 'Fehler beim Tokenisieren.';
        tokenCount = 0; charCount = 0; wordCount = 0; chunks = [];
      } finally {
        isLoading = false;
      }
    }, immediate ? 0 : 200);
  }

  $: selectedModel, scheduleTokenize(true);

  onDestroy(() => {
    clearTimeout(debounceTimer);
    releaseEncoders();
  });

  function showTooltip(e: MouseEvent, chunk: TokenChunk) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const TOOLTIP_H = 36;
    const below = rect.top < TOOLTIP_H + 8;
    tooltip = {
      visible: true,
      x: rect.left,
      y: below ? rect.bottom + 4 : rect.top - TOOLTIP_H - 4,
      chunk
    };
  }
  function hideTooltip() { tooltip = { ...tooltip, visible: false, chunk: null }; }

  function displayText(text: string): string {
    return text.replace(/\n/g, '↵').replace(/ /g, '·');
  }
</script>

<div class="embed-wrapper">
  <div class="controls">
    <div class="branding"><strong>Ltoken</strong></div>
    <select bind:value={selectedModel}>
      <option value="o200k_base">GPT-4o</option>
      <option value="cl100k_base">GPT-4</option>
    </select>
    <div class="badges">
      {#if isLoading}
        <span class="badge loading-badge">
          <span class="spinner" aria-hidden="true"></span>
        </span>
      {:else}
        <span class="badge" class:error-badge={!!error}>{error ? '!' : tokenCount + ' T'}</span>
      {/if}
      <span class="badge">{wordCount} W</span>
      <span class="badge">{charCount} Z</span>
    </div>
  </div>

  <div class="split-view">
    <textarea
      bind:value={inputText}
      on:input={() => scheduleTokenize(false)}
      placeholder="Text einfügen..."
      spellcheck="false"
    ></textarea>

    <div class="visualizer" class:has-error={!!error} class:is-loading={isLoading}>
      {#if error}
        <span class="error-text">{error}</span>
      {:else if isLoading && chunks.length === 0}
        <span class="loading-text">Tokenisiere…</span>
      {:else}
        {#each chunks as chunk, i}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <span
            class="token color-{i % 5}"
            on:mouseenter={(e) => showTooltip(e, chunk)}
            on:mouseleave={hideTooltip}
          >{displayText(chunk.text)}</span>
        {/each}
      {/if}
    </div>
  </div>
</div>

{#if tooltip.visible && tooltip.chunk}
  <div class="tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px;">
    <span>ID <code>{tooltip.chunk.id}</code></span>
    <span>·</span>
    <span>{tooltip.chunk.bytes} B</span>
    <span>·</span>
    <code>"{displayText(tooltip.chunk.text)}"</code>
  </div>
{/if}

<style>
  :root {
    --bg: #ffffff;
    --bg2: #f9fafb;
    --border: #d1d5db;
    --text: #1f2937;
    --muted: #6b7280;
    --c1: #fecaca; --c2: #fed7aa; --c3: #fef08a; --c4: #bbf7d0; --c5: #bfdbfe;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1f2937;
      --bg2: #111827;
      --border: #374151;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --c1: #7f1d1d; --c2: #78350f; --c3: #713f12; --c4: #14532d; --c5: #1e3a5f;
    }
  }

  :global(body, html) {
    margin: 0; padding: 0;
    background: transparent;
    height: 100%;
    overflow: hidden;
  }

  .embed-wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: system-ui, sans-serif;
    color: var(--text);
    box-sizing: border-box;
    padding: 8px;
    gap: 8px;
  }

  .controls {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 8px;
  }

  .branding { font-size: 14px; color: var(--text); margin-right: auto; }

  select {
    padding: 4px 8px; font-size: 12px;
    border: 1px solid var(--border); border-radius: 4px;
    background: var(--bg); color: var(--text); cursor: pointer;
  }

  .badges { display: flex; gap: 4px; }

  .badge {
    padding: 3px 7px; font-size: 11px; font-weight: 600;
    border: 1px solid var(--border); border-radius: 4px;
    background: var(--bg); color: var(--text); white-space: nowrap;
    display: flex; align-items: center; gap: 4px;
  }

  .error-badge   { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
  .loading-badge { min-width: 32px; justify-content: center; }

  .spinner {
    display: inline-block;
    width: 10px; height: 10px;
    border: 1.5px solid var(--border);
    border-top-color: var(--muted);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .split-view { display: flex; gap: 8px; flex-grow: 1; min-height: 0; }

  textarea, .visualizer {
    flex: 1; border: 1px solid var(--border); border-radius: 6px;
    padding: 12px; font-size: 14px; line-height: 1.6;
    background: var(--bg); color: var(--text);
    overflow-y: auto; resize: none; box-sizing: border-box;
  }

  textarea:focus { outline: none; border-color: #6b7280; }

  .visualizer {
    white-space: pre-wrap;
    word-break: break-all;
    transition: opacity 0.15s;
  }
  .visualizer.is-loading { opacity: 0.45; }
  .visualizer.has-error  { border-color: #fecaca; background: #fef2f2; }

  .error-text   { font-size: 12px; color: #991b1b; }
  .loading-text { font-size: 12px; color: var(--muted); font-style: italic; }

  .token { border-radius: 2px; cursor: default; transition: filter 0.1s; }
  .token:hover { filter: brightness(0.88); }
  .color-0 { background-color: var(--c1); }
  .color-1 { background-color: var(--c2); }
  .color-2 { background-color: var(--c3); }
  .color-3 { background-color: var(--c4); }
  .color-4 { background-color: var(--c5); }

  /* position:fixed — korrekte Viewport-Koordinaten, kein scroll-Offset */
  .tooltip {
    position: fixed;
    background: #1f2937; color: #f9fafb;
    border-radius: 5px; padding: 4px 9px;
    font-size: 11px; pointer-events: none; z-index: 100;
    white-space: nowrap; display: flex; align-items: center; gap: 5px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  }

  .tooltip span { color: #9ca3af; }
  .tooltip code { font-family: ui-monospace, monospace; color: #f9fafb; font-size: 11px; }

  @media (max-width: 600px) { .split-view { flex-direction: column; } }
</style>
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { tokenizeText, acquireEncoders, releaseEncoders, type ModelType, type TokenChunk } from '$lib/tokenizer';

  let inputText = 'Willkommen bei Ltoken!\nFüge hier deinen Text ein, um die Tokenisierung zu visualisieren.';
  let selectedModel: ModelType = 'o200k_base';

  let tokenCount: number = 0;
  let charCount: number = 0;
  let wordCount: number = 0;
  let chunks: TokenChunk[] = [];
  let error: string | null = null;
  let isLoading = false;
  let debounceTimer: ReturnType<typeof setTimeout>;

  let tooltip: { visible: boolean; x: number; y: number; chunk: TokenChunk | null; below: boolean } = {
    visible: false, x: 0, y: 0, chunk: null, below: false
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
      } catch (e) {
        console.error('[page] tokenize error:', e);
        error = 'Tokenisierung fehlgeschlagen.';
        tokenCount = 0; charCount = 0; wordCount = 0; chunks = [];
      } finally {
        isLoading = false;
      }
    }, immediate ? 0 : 250);
  }

  $: selectedModel, scheduleTokenize(true);
  scheduleTokenize(true);

  onDestroy(() => {
    clearTimeout(debounceTimer);
    releaseEncoders();
  });

  function showTooltip(e: MouseEvent, chunk: TokenChunk) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const TOOLTIP_H = 96;
    const below = rect.top < TOOLTIP_H + 8;
    tooltip = {
      visible: true,
      x: rect.left,
      y: below ? rect.bottom + 6 : rect.top - TOOLTIP_H - 6,
      chunk,
      below,
    };
  }
  function hideTooltip() { tooltip = { ...tooltip, visible: false, chunk: null }; }

  function displayText(text: string): string {
    return text.replace(/\n/g, '↵').replace(/ /g, '·');
  }
</script>

<svelte:head>
  <title>Ltoken by LProd</title>
</svelte:head>

<div class="app-shell">

  <header class="topbar">
    <div class="logo">Ltoken <span class="logo-sub">by LProd</span></div>
    <nav class="nav-links">
      <a href="/" class="nav-link active">Stack</a>
      <a href="/simple" class="nav-link">Simple</a>
      <a href="/compare" class="nav-link">Compare</a>
    </nav>
    <select bind:value={selectedModel} class="model-select">
      <option value="o200k_base">GPT-4o (o200k_base)</option>
      <option value="cl100k_base">GPT-4 (cl100k_base)</option>
    </select>
  </header>

  <main class="layout">

    <div class="panel input-panel">
      <div class="panel-header">
        <span class="panel-label">Input</span>
      </div>
      <textarea
        class="input-area"
        bind:value={inputText}
        on:input={() => scheduleTokenize(false)}
        placeholder="Text eingeben..."
        spellcheck="false"
      ></textarea>
    </div>

    <div class="right-col">

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Tokens</div>
          <div class="stat-value">{tokenCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Wörter</div>
          <div class="stat-value">{wordCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Zeichen</div>
          <div class="stat-value">{charCount}</div>
        </div>
      </div>

      <div class="panel vis-panel">
        <div class="panel-header">
          <span class="panel-label">Token-Visualisierung</span>
          {#if isLoading}
            <span class="panel-hint loading-hint">
              <span class="spinner" aria-hidden="true"></span>
              Lädt…
            </span>
          {:else if chunks.length > 0}
            <span class="panel-hint">Hover für Details</span>
          {/if}
        </div>

        {#if error}
          <div class="empty-state error-state">{error}</div>
        {:else if isLoading && chunks.length === 0}
          <div class="empty-state">Tokenisiere…</div>
        {:else if chunks.length === 0}
          <div class="empty-state">Visualisierung erscheint hier…</div>
        {:else}
          <div class="vis-body" class:is-loading={isLoading}>
            {#each chunks as chunk, i}
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class="tok tok-{i % 5}"
                role="mark"
                aria-label="Token {chunk.id}"
                on:mouseenter={(e) => showTooltip(e, chunk)}
                on:mouseleave={hideTooltip}
              >
                <div class="tok-text">{displayText(chunk.text)}</div>
                <div class="tok-id">{chunk.id}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    </div>
  </main>
</div>

{#if tooltip.visible && tooltip.chunk}
  <div
    class="tooltip"
    style="left:{tooltip.x}px;top:{tooltip.y}px;"
  >
    <div class="tt-row"><span class="tt-label">ID</span><code>{tooltip.chunk.id}</code></div>
    <div class="tt-row"><span class="tt-label">Bytes</span><code>{tooltip.chunk.bytes}</code></div>
    <div class="tt-row"><span class="tt-label">Text</span><code>"{displayText(tooltip.chunk.text)}"</code></div>
  </div>
{/if}

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }

  :global(body) {
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--bg-page);
    color: var(--text-primary);
    line-height: 1.5;
    min-height: 100vh;
  }

  :root {
    --bg-page:       #f0f0ed;
    --bg-surface:    #ffffff;
    --bg-raised:     #f9f9f7;
    --border:        rgba(0,0,0,0.09);
    --border-mid:    rgba(0,0,0,0.13);
    --text-primary:  #1a1a18;
    --text-secondary:#6b6b67;
    --text-hint:     #9a9a96;
    --radius-sm:     7px;
    --radius-md:     11px;
    --radius-lg:     15px;
    --tok-font-size: 15px;
    --tok-padding-x: 10px;
    --tok-padding-y: 5px;

    --t0-text-bg:#E6F1FB; --t0-id-bg:#B5D4F4; --t0-fg:#0C447C;
    --t1-text-bg:#EAF3DE; --t1-id-bg:#C0DD97; --t1-fg:#27500A;
    --t2-text-bg:#FAEEDA; --t2-id-bg:#FAC775; --t2-fg:#633806;
    --t3-text-bg:#EEEDFE; --t3-id-bg:#CECBF6; --t3-fg:#3C3489;
    --t4-text-bg:#FAECE7; --t4-id-bg:#F5C4B3; --t4-fg:#712B13;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg-page:       #111110;
      --bg-surface:    #1c1c1a;
      --bg-raised:     #242422;
      --border:        rgba(255,255,255,0.08);
      --border-mid:    rgba(255,255,255,0.13);
      --text-primary:  #f0f0ec;
      --text-secondary:#9a9a94;
      --text-hint:     #6a6a66;

      --t0-text-bg:#0C447C; --t0-id-bg:#042C53; --t0-fg:#B5D4F4;
      --t1-text-bg:#27500A; --t1-id-bg:#173404; --t1-fg:#C0DD97;
      --t2-text-bg:#633806; --t2-id-bg:#412402; --t2-fg:#FAC775;
      --t3-text-bg:#3C3489; --t3-id-bg:#26215C; --t3-fg:#CECBF6;
      --t4-text-bg:#712B13; --t4-id-bg:#4A1B0C; --t4-fg:#F5C4B3;
    }
  }

  .app-shell {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.75rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
  }

  .topbar { display: flex; align-items: center; gap: 1.5rem; padding: 1.4rem 0 0; }
  .logo { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.3px; }
  .logo-sub { font-size: 0.88rem; font-weight: 400; color: var(--text-secondary); margin-left: 6px; }

  .nav-links {
    display: flex; gap: 2px;
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 3px;
  }
  .nav-link {
    font-size: 0.85rem; padding: 5px 14px;
    border-radius: calc(var(--radius-md) - 3px);
    color: var(--text-secondary); text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }
  .nav-link:hover  { background: var(--bg-raised); color: var(--text-primary); }
  .nav-link.active { background: var(--bg-raised); color: var(--text-primary); font-weight: 500; }

  .model-select {
    margin-left: auto; font-size: 0.88rem; padding: 6px 14px;
    border-radius: 99px; border: 0.5px solid var(--border-mid);
    background: var(--bg-surface); color: var(--text-primary); cursor: pointer;
  }

  .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  @media (max-width: 760px) { .layout { grid-template-columns: 1fr; } }

  .panel {
    background: var(--bg-surface); border: 0.5px solid var(--border);
    border-radius: var(--radius-lg); overflow: hidden;
  }

  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 18px; border-bottom: 0.5px solid var(--border);
  }

  .panel-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); letter-spacing: 0.06em; text-transform: uppercase; }
  .panel-hint  { font-size: 12px; color: var(--text-hint); }

  .loading-hint { display: flex; align-items: center; gap: 6px; color: var(--text-hint); }

  .spinner {
    display: inline-block; width: 11px; height: 11px;
    border: 1.5px solid var(--border-mid);
    border-top-color: var(--text-secondary);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .input-panel { display: flex; flex-direction: column; }
  .input-area {
    flex: 1; min-height: 340px; padding: 18px;
    font-size: var(--tok-font-size); line-height: 1.75;
    color: var(--text-primary); background: transparent;
    border: none; outline: none; resize: vertical;
    font-family: inherit; width: 100%;
  }

  .right-col { display: flex; flex-direction: column; gap: 14px; }
  .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  .stat-card { background: var(--bg-surface); border: 0.5px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; }
  .stat-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; letter-spacing: 0.04em; }
  .stat-value { font-size: 28px; font-weight: 600; color: var(--text-primary); line-height: 1; letter-spacing: -0.5px; }

  .vis-panel { display: flex; flex-direction: column; }
  .vis-body {
    padding: 16px 18px; display: flex; flex-wrap: wrap;
    gap: 5px; align-content: flex-start;
    transition: opacity 0.15s;
  }
  .vis-body.is-loading { opacity: 0.45; pointer-events: none; }

  .empty-state { padding: 36px 18px; text-align: center; font-size: 14px; color: var(--text-hint); font-style: italic; }
  .error-state { color: #A32D2D; font-style: normal; }

  .tok {
    display: inline-flex; flex-direction: column; align-items: center;
    border-radius: var(--radius-sm); overflow: hidden;
    cursor: default; transition: transform 0.1s, filter 0.1s; min-width: 28px;
  }
  .tok:hover { transform: translateY(-2px); filter: brightness(0.93); }

  .tok-text {
    font-size: var(--tok-font-size); font-weight: 500;
    padding: var(--tok-padding-y) var(--tok-padding-x);
    width: 100%; text-align: center; white-space: pre; line-height: 1.5;
  }
  .tok-id {
    font-size: var(--tok-font-size); font-weight: 400;
    padding: var(--tok-padding-y) var(--tok-padding-x);
    width: 100%; text-align: center;
    font-family: ui-monospace, monospace; line-height: 1.5; opacity: 0.95;
  }

  .tok-0 .tok-text { background: var(--t0-text-bg); color: var(--t0-fg); }
  .tok-0 .tok-id   { background: var(--t0-id-bg);   color: var(--t0-fg); }
  .tok-1 .tok-text { background: var(--t1-text-bg); color: var(--t1-fg); }
  .tok-1 .tok-id   { background: var(--t1-id-bg);   color: var(--t1-fg); }
  .tok-2 .tok-text { background: var(--t2-text-bg); color: var(--t2-fg); }
  .tok-2 .tok-id   { background: var(--t2-id-bg);   color: var(--t2-fg); }
  .tok-3 .tok-text { background: var(--t3-text-bg); color: var(--t3-fg); }
  .tok-3 .tok-id   { background: var(--t3-id-bg);   color: var(--t3-fg); }
  .tok-4 .tok-text { background: var(--t4-text-bg); color: var(--t4-fg); }
  .tok-4 .tok-id   { background: var(--t4-id-bg);   color: var(--t4-fg); }

  .tooltip {
    position: fixed;
    background: var(--text-primary); color: var(--bg-surface);
    border-radius: var(--radius-md); padding: 10px 14px;
    font-size: 13px; pointer-events: none; z-index: 200;
    white-space: nowrap; display: flex; flex-direction: column;
    gap: 4px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .tt-row { display: flex; align-items: center; gap: 10px; }
  .tt-label { font-size: 11px; opacity: 0.55; min-width: 36px; letter-spacing: 0.04em; text-transform: uppercase; }
  code { font-family: ui-monospace, monospace; font-size: 13px; }
</style>
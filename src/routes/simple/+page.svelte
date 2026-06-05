<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { tokenizeText, acquireEncoders, releaseEncoders, type ModelType, type TokenChunk } from '$lib/tokenizer';

  let inputText = '';
  let selectedModel: ModelType = 'o200k_base';
  let activeTab: 'tokens' | 'ids' | 'bytes' | 'bits' = 'tokens';

  let tokenCount: number = 0;
  let charCount: number = 0;
  let wordCount: number = 0;

  // Atomar — verhindert Race Condition zwischen chunks und charOffsets
  let state: { chunks: TokenChunk[]; charOffsets: number[] } = { chunks: [], charOffsets: [] };

  let error: string | null = null;
  let isLoading = false;
  let debounceTimer: ReturnType<typeof setTimeout>;

  let selStart = -1;
  let selEnd   = -1;
  let textareaEl: HTMLTextAreaElement;

  onMount(() => acquireEncoders());

  function scheduleTokenize(immediate = false) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (!inputText) {
        tokenCount = 0; charCount = 0; wordCount = 0;
        state = { chunks: [], charOffsets: [] };
        selStart = -1; selEnd = -1;
        error = null;
        return;
      }
      isLoading = true;
      try {
        error = null;
        const result = await tokenizeText(inputText, selectedModel);
        tokenCount = result.tokenCount;
        charCount  = result.charCount;
        wordCount  = result.wordCount;
        selStart   = -1;
        selEnd     = -1;

        let pos = 0;
        const offsets = result.chunks.map(c => {
          const start = pos;
          pos += c.text.length;
          return start;
        });
        state = { chunks: result.chunks, charOffsets: offsets };

      } catch (e) {
        console.error('[simple] tokenize error:', e);
        error = 'Tokenisierung fehlgeschlagen.';
        tokenCount = 0; charCount = 0; wordCount = 0;
        state = { chunks: [], charOffsets: [] };
      } finally {
        isLoading = false;
      }
    }, immediate ? 0 : 250);
  }

  $: selectedModel, scheduleTokenize(true);

  onDestroy(() => {
    clearTimeout(debounceTimer);
    releaseEncoders();
  });

  function readSelection() {
    if (!textareaEl) return;
    selStart = textareaEl.selectionStart;
    selEnd   = textareaEl.selectionEnd;
  }

  function isHighlighted(i: number): boolean {
    if (selStart === -1 || selStart === selEnd) return false;
    const tStart = state.charOffsets[i];
    const tEnd   = state.charOffsets[i] + state.chunks[i].text.length;
    return tStart < selEnd && tEnd > selStart;
  }

  function hasSelection(): boolean {
    return selStart !== -1 && selStart !== selEnd;
  }

  function displayText(text: string): string {
    return text.replace(/\n/g, '↵').replace(/ /g, '·');
  }

  function toHex(b: number): string {
    return b.toString(16).toUpperCase().padStart(2, '0');
  }

  function toBin(b: number): string {
    return b.toString(2).padStart(8, '0');
  }

  function chunkToHex(chunk: TokenChunk): string {
    return chunk.rawBytes.map(toHex).join('\u00A0');
  }

  function chunkToBits(chunk: TokenChunk): string {
    return chunk.rawBytes.map(toBin).join('\u00A0');
  }
</script>

<svelte:head>
  <title>Ltoken Simple — by LProd</title>
</svelte:head>

<div class="app-shell">

  <header class="topbar">
    <div class="logo">Ltoken <span class="logo-sub">by LProd</span></div>
    <nav class="nav-links">
      <a href="/" class="nav-link">Stack</a>
      <a href="/simple" class="nav-link active">Simple</a>
      <a href="/compare" class="nav-link">Compare</a>
    </nav>
    <select bind:value={selectedModel} class="model-select">
      <option value="o200k_base">GPT-4o (o200k_base)</option>
      <option value="cl100k_base">GPT-4 (cl100k_base)</option>
    </select>
  </header>

  <div class="stats-row">
    <div class="stat-card"><div class="stat-label">Tokens</div><div class="stat-value">{tokenCount}</div></div>
    <div class="stat-card"><div class="stat-label">Wörter</div><div class="stat-value">{wordCount}</div></div>
    <div class="stat-card"><div class="stat-label">Zeichen</div><div class="stat-value">{charCount}</div></div>
  </div>

  <main class="layout">

    <div class="panel input-panel">
      <div class="panel-header">
        <span class="panel-label">Input</span>
        {#if hasSelection()}
          <span class="panel-hint sel-active">● Selektion aktiv</span>
        {:else}
          <span class="panel-hint">Text markieren zum Highlighten</span>
        {/if}
      </div>
      <textarea
        class="input-area"
        bind:value={inputText}
        bind:this={textareaEl}
        on:input={() => scheduleTokenize(false)}
        on:mouseup={readSelection}
        on:keyup={readSelection}
        on:select={readSelection}
        placeholder="Text eingeben..."
        spellcheck="false"
      ></textarea>
    </div>

    <div class="panel right-panel">

      <div class="panel-header tab-header">
        <div class="tabs">
          <button class="tab" class:active={activeTab === 'tokens'} on:click={() => activeTab = 'tokens'}>Tokens</button>
          <button class="tab" class:active={activeTab === 'ids'}    on:click={() => activeTab = 'ids'}>Token-IDs</button>
          <button class="tab" class:active={activeTab === 'bytes'}  on:click={() => activeTab = 'bytes'}>Bytes</button>
          <button class="tab" class:active={activeTab === 'bits'}   on:click={() => activeTab = 'bits'}>Bits</button>
        </div>
        {#if isLoading}
          <span class="loading-hint">
            <span class="spinner" aria-hidden="true"></span>
            Lädt…
          </span>
        {/if}
      </div>

      {#if error}
        <div class="empty-state error-state">{error}</div>
      {:else if isLoading && state.chunks.length === 0}
        <div class="empty-state">Tokenisiere…</div>
      {:else if state.chunks.length === 0}
        <div class="empty-state">Erscheint hier…</div>
      {:else}
        <div
          class="flow-body"
          class:is-loading={isLoading}
          class:tab-tokens={activeTab === 'tokens'}
          class:tab-ids={activeTab === 'ids'}
          class:tab-bytes={activeTab === 'bytes'}
          class:tab-bits={activeTab === 'bits'}
        >
          {#each state.chunks as chunk, i}
            <span
              class="tok tok-{i % 5}"
              class:highlighted={isHighlighted(i)}
              class:dimmed={hasSelection() && !isHighlighted(i)}
            >{#if activeTab === 'tokens'}{displayText(chunk.text)}{:else if activeTab === 'ids'}{chunk.id}{:else if activeTab === 'bytes'}{chunkToHex(chunk)}{:else}{chunkToBits(chunk)}{/if}</span>
          {/each}
        </div>
      {/if}

    </div>
  </main>
</div>

<style>
  /* ════════════════════════════════════════════════════════════════════════════
     KONFIGURATIONSBLOCK — hier alle stilrelevanten Werte anpassen
     ════════════════════════════════════════════════════════════════════════════

     --cfg-font-size        Schriftgröße für Input-Textarea UND Token-Ausgabe
     --cfg-font-family      Schriftart für beide Seiten
     --cfg-font-family-mono Schriftart für Bytes/Bits-Tabs (und Token-IDs)
     --cfg-line-height      Zeilenhöhe für beide Seiten
     --cfg-letter-spacing   Letter-Spacing für Token-Ausgabe (nicht Textarea)

     Farben der Token-Blöcke (Light Mode):
     --cfg-t0 … --cfg-t4    Hintergrundfarbe je Farbslot
     --cfg-t0-fg … -t4-fg   Textfarbe je Farbslot

     ════════════════════════════════════════════════════════════════════════════ */

  :root {
    /* Typografie */
    --cfg-font-size:        15px;
    --cfg-font-family:      system-ui, -apple-system, sans-serif;
    --cfg-font-family-mono: ui-monospace, monospace;
    --cfg-line-height:      1.75;
    --cfg-letter-spacing:   0em;

    /* Token-Farben Light */
    --cfg-t0: #E6F1FB; --cfg-t0-fg: #0C447C;
    --cfg-t1: #EAF3DE; --cfg-t1-fg: #27500A;
    --cfg-t2: #FAEEDA; --cfg-t2-fg: #633806;
    --cfg-t3: #EEEDFE; --cfg-t3-fg: #3C3489;
    --cfg-t4: #FAECE7; --cfg-t4-fg: #712B13;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      /* Token-Farben Dark — Typografie-Variablen bleiben gleich */
      --cfg-t0: #0C447C; --cfg-t0-fg: #B5D4F4;
      --cfg-t1: #27500A; --cfg-t1-fg: #C0DD97;
      --cfg-t2: #633806; --cfg-t2-fg: #FAC775;
      --cfg-t3: #3C3489; --cfg-t3-fg: #CECBF6;
      --cfg-t4: #712B13; --cfg-t4-fg: #F5C4B3;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     LAYOUT-VARIABLEN — hier nicht anfassen
     ════════════════════════════════════════════════════════════════════════════ */

  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }

  :global(body) {
    font-family: var(--cfg-font-family);
    background: var(--bg-page);
    color: var(--text-primary);
    line-height: 1.5;
    min-height: 100vh;
  }

  :root {
    --bg-page:        #f0f0ed;
    --bg-surface:     #ffffff;
    --bg-raised:      #f9f9f7;
    --border:         rgba(0,0,0,0.09);
    --border-mid:     rgba(0,0,0,0.13);
    --text-primary:   #1a1a18;
    --text-secondary: #6b6b67;
    --text-hint:      #9a9a96;
    --radius-sm:      7px;
    --radius-md:      11px;
    --radius-lg:      15px;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg-page:        #111110;
      --bg-surface:     #1c1c1a;
      --bg-raised:      #242422;
      --border:         rgba(255,255,255,0.08);
      --border-mid:     rgba(255,255,255,0.13);
      --text-primary:   #f0f0ec;
      --text-secondary: #9a9a94;
      --text-hint:      #6a6a66;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     KOMPONENTEN
     ════════════════════════════════════════════════════════════════════════════ */

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

  .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  .stat-card { background: var(--bg-surface); border: 0.5px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; }
  .stat-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
  .stat-value { font-size: 28px; font-weight: 600; color: var(--text-primary); line-height: 1; letter-spacing: -0.5px; }

  .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  @media (max-width: 760px) { .layout { grid-template-columns: 1fr; } }

  .panel {
    background: var(--bg-surface); border: 0.5px solid var(--border);
    border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column;
  }

  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 18px; border-bottom: 0.5px solid var(--border); flex-shrink: 0;
  }

  .panel-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); letter-spacing: 0.06em; text-transform: uppercase; }
  .panel-hint  { font-size: 12px; color: var(--text-hint); }
  .sel-active  { color: #60A5FA; font-weight: 500; }

  .loading-hint { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-hint); }

  .spinner {
    display: inline-block; width: 11px; height: 11px;
    border: 1.5px solid var(--border-mid);
    border-top-color: var(--text-secondary);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .tab-header { padding: 8px 14px; }
  .tabs {
    display: flex; gap: 2px;
    background: var(--bg-raised);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 3px;
  }
  .tab {
    font-size: 12px; font-weight: 500; padding: 5px 12px;
    border-radius: calc(var(--radius-md) - 3px); border: none;
    background: transparent; color: var(--text-secondary);
    cursor: pointer; transition: background 0.15s, color 0.15s; font-family: inherit;
  }
  .tab:hover  { background: var(--bg-surface); color: var(--text-primary); }
  .tab.active { background: var(--bg-surface); color: var(--text-primary); font-weight: 600; }

  /* ── Input-Seite ── */
  .input-panel { min-height: 440px; }
  .input-area {
    flex: 1; min-height: 400px; padding: 18px;
    font-size: var(--cfg-font-size);
    line-height: var(--cfg-line-height);
    font-family: var(--cfg-font-family);
    color: var(--text-primary); background: transparent;
    border: none; outline: none; resize: vertical; width: 100%;
  }

  /* ── Output-Seite ── */
  .right-panel { min-height: 440px; }

  .empty-state { padding: 36px 18px; text-align: center; font-size: 14px; color: var(--text-hint); font-style: italic; flex: 1; }
  .error-state { color: #A32D2D; font-style: normal; }

  .flow-body {
    padding: 18px;
    /* Schriftgröße und Zeilenhöhe identisch zur Textarea */
    font-size: var(--cfg-font-size);
    line-height: var(--cfg-line-height);
    font-family: var(--cfg-font-family);
    letter-spacing: var(--cfg-letter-spacing);
    white-space: pre-wrap;
    word-break: break-word;
    overflow-y: auto;
    transition: opacity 0.15s;
  }
  .flow-body.is-loading { opacity: 0.45; pointer-events: none; }

  /* Bytes- und Bits-Tab: Monospace-Font, Letter-Spacing überschreiben */
  .flow-body.tab-bytes,
  .flow-body.tab-bits {
    font-family: var(--cfg-font-family-mono);
    letter-spacing: 0.04em;
  }

  /* Token-IDs-Tab: nur Monospace-Font */
  .flow-body.tab-ids {
    font-family: var(--cfg-font-family-mono);
  }

  /* ── Token-Spans ── */
  .tok {
    border-radius: 3px;
    padding: 0.1em 0;
    transition: opacity 0.12s, filter 0.12s, outline 0.1s;
  }

  .tok-0 { background: var(--cfg-t0); color: var(--cfg-t0-fg); }
  .tok-1 { background: var(--cfg-t1); color: var(--cfg-t1-fg); }
  .tok-2 { background: var(--cfg-t2); color: var(--cfg-t2-fg); }
  .tok-3 { background: var(--cfg-t3); color: var(--cfg-t3-fg); }
  .tok-4 { background: var(--cfg-t4); color: var(--cfg-t4-fg); }

  .highlighted { filter: brightness(1.08); outline: 2px solid currentColor; outline-offset: 1px; }
  .dimmed { opacity: 0.3; }
</style>
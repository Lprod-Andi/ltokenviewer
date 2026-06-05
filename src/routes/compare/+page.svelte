<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { tokenizeText, acquireEncoders, releaseEncoders, type ModelType, type TokenChunk } from '$lib/tokenizer';

  let inputText = 'Das·ist·ein·Beispieltext';
  let selectedModel: ModelType = 'o200k_base';
  let reversed = false;

  let chunks: TokenChunk[] = [];
  let tokenCount = 0;
  let error: string | null = null;
  let isLoading = false;
  let debounceTimer: ReturnType<typeof setTimeout>;

  type ViewKey = 'tokens' | 'ids' | 'bytes' | 'bits';

  const LABELS: Record<ViewKey, string> = {
    tokens: 'Tokens',
    ids:    'Token-IDs',
    bytes:  'Bytes',
    bits:   'Bits',
  };

  let order: ViewKey[] = ['tokens', 'ids', 'bytes', 'bits'];
  $: displayOrder = reversed ? [...order].reverse() : order;

  onMount(() => acquireEncoders());

  function scheduleTokenize(immediate = false) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (!inputText) { chunks = []; tokenCount = 0; error = null; return; }
      isLoading = true;
      try {
        error = null;
        const result = await tokenizeText(inputText, selectedModel);
        chunks     = result.chunks;
        tokenCount = result.tokenCount;
      } catch {
        error = 'Tokenisierung fehlgeschlagen.';
        chunks = []; tokenCount = 0;
      } finally {
        isLoading = false;
      }
    }, immediate ? 0 : 250);
  }

  $: selectedModel, scheduleTokenize(true);
  scheduleTokenize(true);

  onDestroy(() => { clearTimeout(debounceTimer); releaseEncoders(); });

  function displayText(text: string): string {
    return text.replace(/\n/g, '↵').replace(/ /g, '·');
  }
  function toHex(b: number) { return b.toString(16).toUpperCase().padStart(2, '0'); }
  function toBin(b: number) { return b.toString(2).padStart(8, '0'); }
  function chunkToHex(c: TokenChunk) { return c.rawBytes.map(toHex).join('\u00A0'); }
  function chunkToBits(c: TokenChunk) { return c.rawBytes.map(toBin).join('\u00A0'); }
</script>

<svelte:head>
  <title>Ltoken Compare — by LProd</title>
</svelte:head>

<div class="app-shell">

  <header class="topbar">
    <div class="logo">Ltoken <span class="logo-sub">by LProd</span></div>
    <nav class="nav-links">
      <a href="/"        class="nav-link">Stack</a>
      <a href="/simple"  class="nav-link">Simple</a>
      <a href="/compare" class="nav-link active">Compare</a>
    </nav>

    <div class="controls">
      <select bind:value={selectedModel} class="model-select">
        <option value="o200k_base">GPT-4o</option>
        <option value="cl100k_base">GPT-4</option>
      </select>

      <button class="btn-reverse" on:click={() => reversed = !reversed} title="Reihenfolge umkehren">
        {#if reversed}⇤ Normal{:else}⇥ Umkehren{/if}
      </button>

      {#if tokenCount > 0}
        <span class="token-badge">{tokenCount} Tokens</span>
      {/if}
    </div>
  </header>

  <!-- Input -->
  <div class="input-wrap">
    <textarea
      class="input-area"
      bind:value={inputText}
      on:input={() => scheduleTokenize(false)}
      placeholder="Text eingeben…"
      spellcheck="false"
      rows="3"
    ></textarea>
    {#if isLoading}
      <span class="input-loading">
        <span class="spinner" aria-hidden="true"></span>
      </span>
    {/if}
  </div>

  <!-- Compare Grid -->
  {#if error}
    <div class="error-state">{error}</div>
  {:else}
    <div class="compare-grid" class:is-loading={isLoading}>
      {#each displayOrder as view}
        <div class="panel">
          <div class="panel-head">
            <span class="panel-label">{LABELS[view]}</span>
          </div>
          <div class="panel-body" class:mono={view === 'bytes' || view === 'bits' || view === 'ids'}>
            {#if chunks.length === 0}
              <span class="empty">—</span>
            {:else}
              {#each chunks as chunk, i}
                <span class="tok tok-{i % 5}">
                  {#if view === 'tokens'}{displayText(chunk.text)}
                  {:else if view === 'ids'}{chunk.id}
                  {:else if view === 'bytes'}{chunkToHex(chunk)}
                  {:else}{chunkToBits(chunk)}
                  {/if}
                </span>
              {/each}
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

</div>

<style>
  /* ════════════════════════════════════════════════════════════════════════════
     KONFIGURATIONSBLOCK
     ════════════════════════════════════════════════════════════════════════════ */
  :root {
    --cfg-font-size:        14px;
    --cfg-font-family:      system-ui, -apple-system, sans-serif;
    --cfg-font-family-mono: ui-monospace, monospace;
    --cfg-line-height:      1.7;
    --cfg-letter-spacing:   0em;

    --cfg-t0: #E6F1FB; --cfg-t0-fg: #0C447C;
    --cfg-t1: #EAF3DE; --cfg-t1-fg: #27500A;
    --cfg-t2: #FAEEDA; --cfg-t2-fg: #633806;
    --cfg-t3: #EEEDFE; --cfg-t3-fg: #3C3489;
    --cfg-t4: #FAECE7; --cfg-t4-fg: #712B13;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --cfg-t0: #0C447C; --cfg-t0-fg: #B5D4F4;
      --cfg-t1: #27500A; --cfg-t1-fg: #C0DD97;
      --cfg-t2: #633806; --cfg-t2-fg: #FAC775;
      --cfg-t3: #3C3489; --cfg-t3-fg: #CECBF6;
      --cfg-t4: #712B13; --cfg-t4-fg: #F5C4B3;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     LAYOUT
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
    --bg-head:        #f4f4f1;
    --border:         rgba(0,0,0,0.09);
    --border-mid:     rgba(0,0,0,0.13);
    --text-primary:   #1a1a18;
    --text-secondary: #6b6b67;
    --text-hint:      #9a9a96;
    --radius-sm:      7px;
    --radius-md:      11px;
    --radius-lg:      13px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg-page:        #111110;
      --bg-surface:     #1c1c1a;
      --bg-raised:      #242422;
      --bg-head:        #202020;
      --border:         rgba(255,255,255,0.08);
      --border-mid:     rgba(255,255,255,0.13);
      --text-primary:   #f0f0ec;
      --text-secondary: #9a9a94;
      --text-hint:      #6a6a66;
    }
  }

  .app-shell {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1.5rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  /* ── Topbar ── */
  .topbar {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.4rem 0 0;
    flex-wrap: wrap;
  }

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

  .controls {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .model-select {
    font-size: 0.85rem; padding: 5px 12px;
    border-radius: 99px; border: 0.5px solid var(--border-mid);
    background: var(--bg-surface); color: var(--text-primary); cursor: pointer;
  }

  .btn-reverse {
    font-size: 0.82rem; padding: 5px 12px;
    border-radius: 99px; border: 0.5px solid var(--border-mid);
    background: var(--bg-surface); color: var(--text-secondary);
    cursor: pointer; font-family: inherit;
    transition: background 0.15s, color 0.15s;
  }
  .btn-reverse:hover { background: var(--bg-raised); color: var(--text-primary); }

  .token-badge {
    font-size: 11px; font-weight: 500;
    padding: 4px 10px; border-radius: 99px;
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    color: var(--text-secondary);
  }

  /* ── Input ── */
  .input-wrap {
    position: relative;
  }

  .input-area {
    width: 100%;
    padding: 14px 18px;
    font-size: var(--cfg-font-size);
    line-height: var(--cfg-line-height);
    font-family: var(--cfg-font-family);
    color: var(--text-primary);
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-lg);
    outline: none;
    resize: none;
  }
  .input-area:focus { border-color: var(--border-mid); }

  .input-loading {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
  }

  .spinner {
    display: inline-block; width: 11px; height: 11px;
    border: 1.5px solid var(--border-mid);
    border-top-color: var(--text-secondary);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Compare Grid ── */
  .compare-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    align-items: start;
    transition: opacity 0.15s;
  }
  .compare-grid.is-loading { opacity: 0.45; pointer-events: none; }

  @media (max-width: 900px) {
    .compare-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 520px) {
    .compare-grid { grid-template-columns: 1fr; }
  }

  /* ── Panel ── */
  .panel {
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 120px;
  }

  .panel-head {
    padding: 8px 12px;
    background: var(--bg-head);
    border-bottom: 0.5px solid var(--border);
    flex-shrink: 0;
  }

  .panel-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .panel-body {
    padding: 12px;
    font-size: var(--cfg-font-size);
    line-height: var(--cfg-line-height);
    font-family: var(--cfg-font-family);
    letter-spacing: var(--cfg-letter-spacing);
    white-space: pre-wrap;
    word-break: break-word;
    overflow-y: auto;
    max-height: 340px;
  }
  .panel-body.mono {
    font-family: var(--cfg-font-family-mono);
    letter-spacing: 0.03em;
  }

  .empty {
    color: var(--text-hint);
    font-style: italic;
    font-size: 13px;
  }

  .error-state {
    padding: 24px;
    text-align: center;
    color: #A32D2D;
    font-size: 14px;
  }

  /* ── Token-Spans ── */
  .tok { border-radius: 3px; padding: 0.1em 0; }

  .tok-0 { background: var(--cfg-t0); color: var(--cfg-t0-fg); }
  .tok-1 { background: var(--cfg-t1); color: var(--cfg-t1-fg); }
  .tok-2 { background: var(--cfg-t2); color: var(--cfg-t2-fg); }
  .tok-3 { background: var(--cfg-t3); color: var(--cfg-t3-fg); }
  .tok-4 { background: var(--cfg-t4); color: var(--cfg-t4-fg); }
</style>
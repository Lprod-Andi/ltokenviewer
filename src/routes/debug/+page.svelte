<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';

  let output = 'Warte auf Browser...';
  let encoder: Record<string, any> | null = null;

  onMount(async () => {
    if (!browser) return;

    output = 'Lade js-tiktoken...';

    try {
      const { getEncoding } = await import('js-tiktoken');
      output += '\n✓ Import OK';

      encoder = getEncoding('cl100k_base');
      output += '\n✓ Encoder erstellt';

      const text = 'Hallo';
      const tokens = encoder.encode(text);
      output += `\n✓ encode("Hallo") = [${Array.from(tokens).join(', ')}]`;
      output += `\n  typeof tokens = ${typeof tokens}`;
      output += `\n  tokens constructor = ${tokens?.constructor?.name}`;

      // Ersten Token dekodieren
      const firstId = tokens[0];
      output += `\n\nErster Token ID: ${firstId}`;

      // decode() gibt Uint8Array zurück — kein String-Cast mehr
      const decoded: Uint8Array = encoder.decode([firstId]);
      output += `\n  decode([${firstId}]) zurückgegeben`;
      output += `\n  typeof decoded = ${typeof decoded}`;
      output += `\n  constructor = ${decoded?.constructor?.name}`;
      output += `\n  instanceof Uint8Array = ${decoded instanceof Uint8Array}`;
      output += `\n  instanceof Array = ${Array.isArray(decoded)}`;
      output += `\n  length = ${decoded?.length}`;
      output += `\n  Werte = [${Array.from(decoded).join(', ')}]`;

      // Konvertierungsversuche
      output += '\n\n--- Konvertierungsversuche ---';

      // Versuch 1: new Uint8Array() + TextDecoder
      try {
        const u8 = new Uint8Array(decoded);
        const str1 = new TextDecoder('utf-8', { fatal: false }).decode(u8);
        output += `\n1. new Uint8Array + TextDecoder = "${str1}" (len=${str1.length})`;
      } catch (e: any) { output += `\n1. FEHLER: ${e.message}`; }

      // Versuch 2: TextDecoder direkt auf Uint8Array
      try {
        const str2 = new TextDecoder('utf-8', { fatal: false }).decode(decoded);
        output += `\n2. TextDecoder direkt = "${str2}" (len=${str2.length})`;
      } catch (e: any) { output += `\n2. FEHLER: ${e.message}`; }

      // Versuch 3: String.fromCharCode
      try {
        const str3 = String.fromCharCode(...Array.from(decoded));
        output += `\n3. fromCharCode = "${str3}" (len=${str3.length})`;
      } catch (e: any) { output += `\n3. FEHLER: ${e.message}`; }

      // Versuch 4: Buffer (Node-Umgebung — schlägt im Browser fehl, zeigt FEHLER)
      try {
        const str4 = Buffer.from(decoded).toString('utf-8');
        output += `\n4. Buffer.from = "${str4}" (len=${str4.length})`;
      } catch (e: any) { output += `\n4. FEHLER (erwartet im Browser): ${e.message}`; }

      // Versuch 5: .buffer (ArrayBuffer) + TextDecoder
      try {
        const str5 = new TextDecoder('utf-8', { fatal: false }).decode(decoded.buffer);
        output += `\n5. .buffer + TextDecoder = "${str5}" (len=${str5.length})`;
      } catch (e: any) { output += `\n5. FEHLER: ${e.message}`; }

      output += '\n\n✓ Debug abgeschlossen';

    } catch (e: any) {
      output += `\n\n❌ FEHLER: ${e.message}\n${e.stack}`;
    }
  });

  onDestroy(() => {
    // WASM-Buffer des Debug-Encoders freigeben
    try { encoder?.free(); } catch { /* ignore */ }
    encoder = null;
  });
</script>

<svelte:head><title>Ltoken Debug</title></svelte:head>

<div style="padding: 2rem; font-family: ui-monospace, monospace; font-size: 13px; line-height: 1.8; background: #111; color: #e0e0e0; min-height: 100vh; white-space: pre-wrap;">
  <div style="color: #FAC775; margin-bottom: 1rem; font-size: 16px; font-family: sans-serif;">🔍 Ltoken Debug</div>
  {output}
</div>
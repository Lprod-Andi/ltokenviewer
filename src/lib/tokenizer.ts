import { browser } from '$app/environment';

export type ModelType = 'o200k_base' | 'cl100k_base';

export interface TokenChunk {
  text: string;
  id: number;
  bytes: number;
  rawBytes: number[];
}

export interface TokenizeResult {
  tokenCount: number;
  charCount: number;
  wordCount: number;
  chunks: TokenChunk[];
}

export const MAX_INPUT_LENGTH = 50_000;

const EMPTY: TokenizeResult = { tokenCount: 0, charCount: 0, wordCount: 0, chunks: [] };

// ─── Client-seitiger Encoder-Cache ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const encodingCache = new Map<ModelType, any>();
let consumerCount = 0;

export function acquireEncoders(): void {
  consumerCount++;
}

export function releaseEncoders(): void {
  consumerCount--;
  if (consumerCount <= 0) {
    consumerCount = 0;
    encodingCache.clear();
  }
}

async function getEncoder(model: ModelType) {
  if (encodingCache.has(model)) return encodingCache.get(model);
  const { getEncoding } = await import('js-tiktoken');
  const enc = getEncoding(model);
  encodingCache.set(model, enc);
  return enc;
}

// ─── Server-seitiger Encoder-Cache ───────────────────────────────────────────
// Modul-level Map — lebt für die gesamte Node-Prozess-Laufzeit.
// Verhindert dass jeder API-Request das WASM-Binary neu initialisiert.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serverEncoderCache = new Map<ModelType, any>();

async function getServerEncoder(model: ModelType) {
  if (serverEncoderCache.has(model)) return serverEncoderCache.get(model);
  const { getEncoding } = await import('js-tiktoken');
  const enc = getEncoding(model);
  serverEncoderCache.set(model, enc);
  return enc;
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

const clientDecoder = new TextDecoder('utf-8', { fatal: false });

// decode() gibt je nach js-tiktoken-Version string | Uint8Array zurück —
// diese Hilfsfunktion normalisiert beides zu Uint8Array.
function toUint8Array(val: string | Uint8Array): Uint8Array {
  if (typeof val === 'string') return new TextEncoder().encode(val);
  return val;
}

function buildChunks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  encoder: any,
  tokens: number[],
  decoder: TextDecoder
): TokenChunk[] {
  return tokens.map((id: number) => {
    const raw: Uint8Array = toUint8Array(encoder.decode([id]));
    const rawBytes: number[] = Array.from(raw);
    return {
      text: decoder.decode(raw),
      id,
      bytes: rawBytes.length,
      rawBytes,
    };
  });
}

function buildStats(text: string, chunks: TokenChunk[]): TokenizeResult {
  return {
    tokenCount: chunks.length,
    charCount: text.length,
    wordCount: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
    chunks,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function tokenizeText(text: string, model: ModelType): Promise<TokenizeResult> {
  if (!browser || !text) return EMPTY;
  if (text.length > MAX_INPUT_LENGTH) return EMPTY;

  try {
    const encoder = await getEncoder(model);
    const tokens: number[] = Array.from(encoder.encode(text));
    const chunks = buildChunks(encoder, tokens, clientDecoder);
    return buildStats(text, chunks);
  } catch (err) {
    console.error('[tokenizer] Fehler:', err);
    return EMPTY;
  }
}

export async function tokenizeTextServer(text: string, model: ModelType): Promise<TokenizeResult> {
  if (!text || text.length > MAX_INPUT_LENGTH) return EMPTY;

  try {
    const encoder = await getServerEncoder(model);
    const tokens: number[] = Array.from(encoder.encode(text));
    const td = new TextDecoder('utf-8', { fatal: false });
    const chunks = buildChunks(encoder, tokens, td);
    return buildStats(text, chunks);
  } catch (err) {
    console.error('[tokenizer:server] Fehler:', err);
    return EMPTY;
  }
}
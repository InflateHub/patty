/**
 * gemini.ts — Gemini Flash API client for Patty 2.9.0
 *
 * Supports:
 *   - Text-only prompts (AI Recipe Generator, AI Week Planner)
 *   - Image + text prompts (AI Macro Scan)
 * Always requests structured JSON output via response_mime_type + response_schema.
 */

const MODEL = 'gemini-2.0-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export type GeminiError =
  | { code: 'invalid_key' }
  | { code: 'quota' }
  | { code: 'network'; message: string }
  | { code: 'parse'; message: string };

export class GeminiApiError extends Error {
  constructor(public readonly detail: GeminiError) {
    super(detail.code);
  }
}

// Minimal schema shape accepted by the Gemini API
export type JsonSchemaValue =
  | { type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'INTEGER' }
  | { type: 'OBJECT'; properties: Record<string, JsonSchemaValue>; required?: string[] }
  | { type: 'ARRAY'; items: JsonSchemaValue };

export interface GeminiRequestOptions {
  apiKey: string;
  prompt: string;
  /** Base64 data URI (e.g. "data:image/jpeg;base64,...") — optional */
  imageDataUri?: string;
  /** Response schema to enforce structured JSON output */
  schema: JsonSchemaValue;
}

/** Send a request to Gemini and return the parsed JSON response. */
export async function geminiRequest<T>(opts: GeminiRequestOptions): Promise<T> {
  const { apiKey, prompt, imageDataUri, schema } = opts;

  // Build the parts array
  const parts: unknown[] = [];

  if (imageDataUri) {
    // Extract mime type and base64 data from data URI
    const [header, data] = imageDataUri.split(',');
    const mimeType = (header.match(/:(.*?);/) ?? ['', 'image/jpeg'])[1];
    parts.push({ inline_data: { mime_type: mimeType, data } });
  }

  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      response_mime_type: 'application/json',
      response_schema: schema,
      temperature: 0.7,
    },
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new GeminiApiError({ code: 'network', message: String(err) });
  }

  if (res.status === 400 || res.status === 401 || res.status === 403) {
    throw new GeminiApiError({ code: 'invalid_key' });
  }
  if (res.status === 429) {
    throw new GeminiApiError({ code: 'quota' });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new GeminiApiError({ code: 'network', message: `HTTP ${res.status}: ${text}` });
  }

  const json = await res.json();
  const rawText: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new GeminiApiError({ code: 'parse', message: 'Empty response from Gemini' });
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new GeminiApiError({ code: 'parse', message: `Could not parse JSON: ${rawText.slice(0, 200)}` });
  }
}

/** Fire a minimal ping to validate that the key works. Returns true on success. */
export async function testGeminiKey(apiKey: string): Promise<true> {
  await geminiRequest<{ ok: boolean }>({
    apiKey,
    prompt: 'Reply with {"ok":true}.',
    schema: {
      type: 'OBJECT',
      properties: { ok: { type: 'BOOLEAN' } },
      required: ['ok'],
    },
  });
  return true;
}

/** Human-readable message for a GeminiError. */
export function geminiErrorMessage(err: unknown): string {
  if (err instanceof GeminiApiError) {
    switch (err.detail.code) {
      case 'invalid_key': return 'Invalid API key. Please check your key in Profile → AI Settings.';
      case 'quota':       return 'API quota exceeded. Wait a moment and try again.';
      case 'network':     return `Network error: ${err.detail.message}`;
      case 'parse':       return `Could not read AI response: ${err.detail.message}`;
    }
  }
  return 'An unexpected error occurred.';
}

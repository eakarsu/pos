import OpenAI from 'openai';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
// Default to Claude 3.5 Sonnet on OpenRouter (overridable via env)
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }
    client = new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': 'https://elitepos.app',
        'X-Title': 'ElitePos AI',
      },
    });
  }
  return client;
}

export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean; model?: string } = {}
): Promise<string> {
  const openai = getClient();
  const completion = await openai.chat.completions.create({
    model: options.model || DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    ...(options.jsonMode !== false ? { response_format: { type: 'json_object' as const } } : {}),
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2048,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI');
  return content;
}

/**
 * parseAIJson - 3-strategy JSON parsing for resilient AI output handling.
 *
 * Strategy 1: Direct JSON.parse on trimmed input.
 * Strategy 2: Extract from markdown code fence (```json ... ``` or ``` ... ```).
 * Strategy 3: Repair truncated JSON by closing open brackets/strings.
 *
 * Throws if all 3 strategies fail.
 */
export function parseAIJson<T = any>(raw: string): T {
  if (!raw || typeof raw !== 'string') {
    throw new Error('parseAIJson: empty input');
  }
  const trimmed = raw.trim();

  // Strategy 1: direct
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* fall through */
  }

  // Strategy 2: extract from markdown code fence
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    const inner = fenceMatch[1].trim();
    try {
      return JSON.parse(inner) as T;
    } catch {
      // fall through to repair on inner
      try {
        return JSON.parse(repairTruncatedJSON(inner)) as T;
      } catch {
        /* fall through */
      }
    }
  }

  // Strategy 3: repair truncated JSON
  try {
    return JSON.parse(repairTruncatedJSON(trimmed)) as T;
  } catch (err: any) {
    throw new Error(`parseAIJson: all 3 strategies failed: ${err.message}`);
  }
}

function repairTruncatedJSON(json: string): string {
  let str = json.trim();
  // Strip leading text up to first { or [
  const firstBrace = str.search(/[\{\[]/);
  if (firstBrace > 0) str = str.substring(firstBrace);

  // Remove trailing comma before closing
  str = str.replace(/,\s*$/, '');

  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === '{') stack.push('}');
      else if (ch === '[') stack.push(']');
      else if (ch === '}' || ch === ']') stack.pop();
    }
  }

  // Close open string by truncating to last safe boundary
  if (inString) {
    str += '"';
  }

  // Strip trailing comma before closing
  str = str.replace(/,\s*$/, '');

  while (stack.length > 0) {
    str += stack.pop();
  }
  return str;
}

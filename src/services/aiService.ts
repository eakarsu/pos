import OpenAI from 'openai';

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
// Default to Claude 3.5 Sonnet on OpenRouter (overridable via env)
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

let client: OpenAI | null = null;
let clientKey = '';

export const requestedAIModel = () => process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
const failure = (message: string, status = 502) => Object.assign(new Error(message), { status });

function getClient(): OpenAI {
    const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim();
    if (!apiKey) {
      throw failure('Configure OPENROUTER_API_KEY to use AI features.', 503);
    }
  const localFixture = process.env.NODE_ENV === 'test' && /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(OPENROUTER_BASE_URL);
  if (OPENROUTER_BASE_URL !== 'https://openrouter.ai/api/v1' && !localFixture) {
    throw failure('Exact OpenRouter configuration is required.', 503);
  }
  if (!client || apiKey !== clientKey) {
    clientKey = apiKey;
    client = new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
      timeout: 90_000,
      maxRetries: 0,
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
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean; model?: string; signal?: AbortSignal } = {}
): Promise<string> {
  options.signal?.throwIfAborted();
  const openai = getClient();
  try {
  const completion = await openai.chat.completions.create({
    model: options.model || requestedAIModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    ...(options.jsonMode !== false ? { response_format: { type: 'json_object' as const } } : {}),
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2048,
  }, { signal: options.signal, timeout: 90_000, maxRetries: 0 });

  options.signal?.throwIfAborted();
  if (completion.choices[0]?.finish_reason === 'length') throw failure('The provider response was truncated. Try again with a shorter request.');
  if (completion.choices[0]?.message?.refusal) throw failure('The provider declined this request. Review the supplied brief.');
  const content = completion.choices[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw failure('The provider returned an empty response.');
  return content;
  } catch (error: any) {
    if (options.signal?.aborted) throw failure('AI request canceled.', 499);
    if (error.status && !error.headers && !error.error) throw error;
    throw failure(error.status === 429 ? 'OpenRouter rate limited the request. Try again shortly.' : 'OpenRouter could not complete this request. Check the connection and try again.', error.status === 429 ? 429 : 502);
  }
}

/**
 * Parse actual structured provider output. Incomplete output is rejected rather
 * than repaired into a successful recommendation.
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
      /* fall through */
    }
  }

  throw failure('The provider returned invalid structured output. Try generating the review again.');
}

import {
  AIProvider,
  AICompletionRequest,
  AICompletionResult,
  AIQuotaError,
  AIProviderError,
} from './types';

/**
 * Provider adapters. These run on the SERVER (Cloudflare Worker / Vercel fn),
 * where API keys live — keys must never ship in the app bundle. The same code
 * can run in the emulator. Each adapter normalizes a different HTTP shape into
 * the common `AICompletionResult`.
 *
 * Free-tier ordering (priority asc): Groq (fast, generous) → Gemini → OpenRouter
 * free models → DeepSeek. The router falls through on 429/5xx.
 */

type Keys = {
  groq?: string;
  gemini?: string;
  openrouter?: string;
  deepseek?: string;
};

const isRateLimited = (status: number) => status === 429;

/** OpenAI-compatible chat endpoint shared by Groq / OpenRouter / DeepSeek. */
async function openAICompatible(
  opts: {
    name: string;
    model: string;
    baseUrl: string;
    apiKey: string;
    extraHeaders?: Record<string, string>;
  },
  req: AICompletionRequest,
): Promise<AICompletionResult> {
  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
      ...opts.extraHeaders,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: req.messages,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.7,
      ...(req.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (isRateLimited(res.status)) throw new AIQuotaError(opts.name);
  if (!res.ok) throw new AIProviderError(opts.name, `HTTP ${res.status}`);

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new AIProviderError(opts.name, 'empty completion');
  return { text, provider: opts.name, model: opts.model, degraded: false };
}

export function createProviders(keys: Keys): AIProvider[] {
  const providers: AIProvider[] = [];

  if (keys.groq) {
    providers.push({
      name: 'groq',
      model: 'llama-3.3-70b-versatile',
      priority: 0,
      isConfigured: () => true,
      complete: (req) =>
        openAICompatible(
          {
            name: 'groq',
            model: 'llama-3.3-70b-versatile',
            baseUrl: 'https://api.groq.com/openai/v1',
            apiKey: keys.groq!,
          },
          req,
        ),
    });
  }

  if (keys.gemini) {
    providers.push({
      name: 'gemini',
      model: 'gemini-1.5-flash',
      priority: 1,
      isConfigured: () => true,
      complete: async (req) => {
        // Gemini has its own REST shape; map messages → contents.
        const model = 'gemini-1.5-flash';
        const system = req.messages.find((m) => m.role === 'system')?.content;
        const contents = req.messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keys.gemini}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
              contents,
              generationConfig: {
                maxOutputTokens: req.maxTokens ?? 1024,
                temperature: req.temperature ?? 0.7,
                ...(req.json ? { responseMimeType: 'application/json' } : {}),
              },
            }),
          },
        );
        if (isRateLimited(res.status)) throw new AIQuotaError('gemini');
        if (!res.ok) throw new AIProviderError('gemini', `HTTP ${res.status}`);
        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (!text) throw new AIProviderError('gemini', 'empty completion');
        return { text, provider: 'gemini', model, degraded: false };
      },
    });
  }

  if (keys.openrouter) {
    providers.push({
      name: 'openrouter',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      priority: 2,
      isConfigured: () => true,
      complete: (req) =>
        openAICompatible(
          {
            name: 'openrouter',
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            baseUrl: 'https://openrouter.ai/api/v1',
            apiKey: keys.openrouter!,
            extraHeaders: {
              'HTTP-Referer': 'https://duet.app',
              'X-Title': 'Duet',
            },
          },
          req,
        ),
    });
  }

  if (keys.deepseek) {
    providers.push({
      name: 'deepseek',
      model: 'deepseek-chat',
      priority: 3,
      isConfigured: () => true,
      complete: (req) =>
        openAICompatible(
          {
            name: 'deepseek',
            model: 'deepseek-chat',
            baseUrl: 'https://api.deepseek.com/v1',
            apiKey: keys.deepseek!,
          },
          req,
        ),
    });
  }

  return providers.sort((a, b) => a.priority - b.priority);
}

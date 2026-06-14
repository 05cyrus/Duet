/**
 * AI proxy — Cloudflare Worker (free: 100k req/day, no card).
 *
 * This is the ONLY place AI keys exist. The app POSTs /complete; we run the
 * AIRouter with provider fallback and return a normalized result. Add a shared
 * secret / Firebase App Check verification before production to stop abuse.
 *
 * Deploy:  wrangler deploy
 * Secrets: wrangler secret put GROQ_API_KEY  (and GEMINI/OPENROUTER/DEEPSEEK)
 *
 * NOTE: imports use relative paths to the shared core so the same router logic
 * is reused. In a real monorepo, share via a workspace package.
 */
import { AIRouter } from '../../src/core/ai/AIRouter';
import { createProviders } from '../../src/core/ai/providers';
import type { AICompletionRequest } from '../../src/core/ai/types';

interface Env {
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  SHARED_SECRET?: string;
}

function offlineFallback(req: AICompletionRequest): string {
  // Minimal, honest degraded response. Feature-specific templates can override.
  const last = req.messages[req.messages.length - 1]?.content ?? '';
  return JSON.stringify({
    degraded: true,
    note: 'AI is temporarily unavailable (free quota reached). Try again later.',
    echo: last.slice(0, 200),
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/complete') {
      return new Response('Not found', { status: 404 });
    }
    // Optional shared-secret gate (set EXPO_PUBLIC_AI_PROXY_SECRET on client).
    if (env.SHARED_SECRET) {
      const auth = request.headers.get('x-duet-secret');
      if (auth !== env.SHARED_SECRET) return new Response('Unauthorized', { status: 401 });
    }

    let req: AICompletionRequest;
    try {
      req = (await request.json()) as AICompletionRequest;
    } catch {
      return new Response('Bad JSON', { status: 400 });
    }

    const providers = createProviders({
      groq: env.GROQ_API_KEY,
      gemini: env.GEMINI_API_KEY,
      openrouter: env.OPENROUTER_API_KEY,
      deepseek: env.DEEPSEEK_API_KEY,
    });
    const router = new AIRouter(providers, { offlineFallback });
    const result = await router.complete(req);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

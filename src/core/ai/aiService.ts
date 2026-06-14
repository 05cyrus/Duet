import { env } from '@/core/config/env';
import { AICompletionRequest, AICompletionResult } from './types';

/**
 * CLIENT-side AI entry point. The app does NOT hold provider keys — it calls
 * our server proxy (Cloudflare Worker / Vercel fn), which runs the AIRouter
 * with the real keys and provider fallback. This keeps keys off-device and
 * lets us cache + rate-limit centrally.
 *
 * If the proxy is unreachable, we still degrade gracefully with a template so
 * the feature never hard-fails.
 */
export const aiService = {
  async complete(
    req: AICompletionRequest,
    offlineFallback: (req: AICompletionRequest) => string,
  ): Promise<AICompletionResult> {
    if (!env.aiProxyUrl) {
      return { text: offlineFallback(req), provider: 'offline', model: 'template', degraded: true };
    }
    try {
      const res = await fetch(`${env.aiProxyUrl}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`proxy HTTP ${res.status}`);
      return (await res.json()) as AICompletionResult;
    } catch {
      return { text: offlineFallback(req), provider: 'offline', model: 'template', degraded: true };
    }
  },
};

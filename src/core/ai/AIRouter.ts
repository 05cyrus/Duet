import {
  AIProvider,
  AICompletionRequest,
  AICompletionResult,
  AIQuotaError,
  AIProviderError,
} from './types';

export interface AIRouterOptions {
  /** Produce a deterministic, useful response when all providers fail. */
  offlineFallback: (req: AICompletionRequest) => string;
}

/**
 * Tries each configured provider in priority order. On quota (429) or provider
 * error it falls through to the next. If every provider fails, returns the
 * offline template marked `degraded: true` so the UI can show "offline mode".
 *
 * This is the single seam for swapping/adding providers: register a new
 * `AIProvider` and the router picks it up by priority — no feature code changes.
 */
export class AIRouter {
  constructor(
    private readonly providers: AIProvider[],
    private readonly opts: AIRouterOptions,
  ) {}

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const errors: string[] = [];
    for (const provider of this.providers) {
      if (!provider.isConfigured()) continue;
      try {
        return await provider.complete(req);
      } catch (e) {
        if (e instanceof AIQuotaError) {
          errors.push(`${provider.name}: quota`);
          continue; // try the next free provider
        }
        if (e instanceof AIProviderError) {
          errors.push(`${provider.name}: ${e.message}`);
          continue;
        }
        errors.push(`${provider.name}: ${(e as Error).message}`);
      }
    }
    // Everything failed — degrade gracefully.
    return {
      text: this.opts.offlineFallback(req),
      provider: 'offline',
      model: 'template',
      degraded: true,
    };
  }
}

/**
 * AI abstraction — provider-agnostic contracts.
 *
 * The app never calls a provider directly. It calls `AIRouter`, which tries
 * providers in cheapest-first order and degrades to an offline template when
 * every free tier is exhausted. Providers implement `AIProvider`.
 */

export type AIRole = 'system' | 'user' | 'assistant';

export interface AIMessage {
  role: AIRole;
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  /** Soft cap; providers map to their own param. */
  maxTokens?: number;
  temperature?: number;
  /** Ask provider for strict JSON when supported. */
  json?: boolean;
}

export interface AICompletionResult {
  text: string;
  provider: string;
  model: string;
  degraded: boolean; // true if this was the offline fallback
}

export class AIQuotaError extends Error {
  constructor(public provider: string) {
    super(`AI provider quota/rate-limit hit: ${provider}`);
    this.name = 'AIQuotaError';
  }
}

export class AIProviderError extends Error {
  constructor(public provider: string, message: string) {
    super(`[${provider}] ${message}`);
    this.name = 'AIProviderError';
  }
}

export interface AIProvider {
  readonly name: string;
  /** The default free model id for this provider. */
  readonly model: string;
  /** Lower = tried first (cheapest / fastest free). */
  readonly priority: number;
  isConfigured(): boolean;
  complete(req: AICompletionRequest): Promise<AICompletionResult>;
}

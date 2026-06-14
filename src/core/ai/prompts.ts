import { AIMessage, LetterStyle } from '@/core/ai/types-bridge';

/**
 * Centralized prompt builders. Keeping prompts here (not inline) makes them
 * reviewable, versionable, and reusable between client and the server proxy.
 */

export const MEDIATOR_SYSTEM =
  'You are a neutral couples therapist. Never take sides. Identify emotions, ' +
  'needs, misunderstandings, and actionable compromises. Be warm, concise, and fair.';

export function mediatorMessages(userText: string, partnerText: string): AIMessage[] {
  return [
    { role: 'system', content: MEDIATOR_SYSTEM },
    {
      role: 'user',
      content:
        'Return STRICT JSON with keys: userSummary, partnerSummary, ' +
        'misunderstandings (string[]), emotionalNeeds ([{side:"user"|"partner",needs:string[]}]), ' +
        'commonGround (string[]), fairSolution (string), actionItems (string[]).\n\n' +
        `PARTNER A (the requester) says:\n${userText}\n\n` +
        `PARTNER B says:\n${partnerText}`,
    },
  ];
}

const STYLE_HINT: Record<LetterStyle, string> = {
  romantic: 'deeply romantic and poetic',
  cute: 'playful, sweet and a little silly',
  anniversary: 'celebratory, reflecting on time together',
  long_distance: 'tender, about missing each other across distance',
  appreciation: 'grateful, specific about what you admire',
};

export function loveLetterMessages(input: {
  style: LetterStyle;
  partnerName: string;
  memories: string[];
  mood?: string;
}): AIMessage[] {
  return [
    {
      role: 'system',
      content:
        'You write heartfelt, personal love letters. Avoid clichés; use the ' +
        'specific details provided. 150-250 words. First person.',
    },
    {
      role: 'user',
      content:
        `Write a ${STYLE_HINT[input.style]} letter to ${input.partnerName}.\n` +
        (input.mood ? `Current mood: ${input.mood}.\n` : '') +
        (input.memories.length
          ? `Weave in these shared memories:\n- ${input.memories.join('\n- ')}`
          : ''),
    },
  ];
}

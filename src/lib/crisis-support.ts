export const CRISIS_PHRASES = [
  "kill myself", "killing myself", "take my own life", "end my life", "ending my life",
  "want to die", "wanna die", "want to be dead", "wish i was dead", "wish i were dead",
  "better off dead", "hurt myself", "hurting myself", "harm myself", "harming myself",
  "self harm", "self-harm", "cut myself", "cutting myself",
  "i am suicidal", "i'm suicidal", "im suicidal", "feel suicidal", "feeling suicidal",
  "no reason to live", "nothing to live for", "don't want to live", "dont want to live",
  "don't want to be alive", "dont want to be alive"
];

export function isCrisis(text: string): boolean {
  const haystack = text.toLowerCase();
  return CRISIS_PHRASES.some(phrase => haystack.includes(phrase));
}

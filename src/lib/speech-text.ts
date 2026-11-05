// Shared by the server (ElevenLabs) and the browser (built-in voice fallback).

/** Strips Markdown so the voice doesn't read out asterisks. */
export function toSpeakableText(markdown: string): string {
  return markdown
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*\s][^*]*)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .trim();
}

const FRACTION_NAMES: Record<number, [string, string]> = {
  2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"], 5: ["fifth", "fifths"], 6: ["sixth", "sixths"],
  7: ["seventh", "sevenths"], 8: ["eighth", "eighths"], 9: ["ninth", "ninths"], 10: ["tenth", "tenths"], 12: ["twelfth", "twelfths"],
  16: ["sixteenth", "sixteenths"], 100: ["hundredth", "hundredths"],
};

/**
 * Turns plain-text math into words a voice reads correctly: 5^2 → "5 squared", 3/4 → "3 fourths",
 * -5 → "negative 5", √ → "the square root of", ≤ → "is less than or equal to".
 */
export function toSpokenMath(text: string): string {
  return toSpeakableText(text)
    .replace(/−/g, "-")
    .replace(/\^2\b/g, " squared")
    .replace(/\^3\b/g, " cubed")
    .replace(/\^\(?(-?\w+)\)?/g, (_m, p: string) => ` to the power of ${p.replace(/^-/, "negative ")}`)
    .replace(/√\(?/g, "the square root of ")
    .replace(/∛\(?/g, "the cube root of ")
    .replace(/π/g, "pi")
    .replace(/≤/g, " is less than or equal to ")
    .replace(/≥/g, " is greater than or equal to ")
    .replace(/≠/g, " is not equal to ")
    .replace(/≈/g, " is about ")
    .replace(/×|·/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/(\d)\s+:\s+(\d)/g, "$1 to $2")
    .replace(/(^|[\s(=,:[])-(?=\d|\.\d|[a-z]\b)/g, "$1negative ")
    .replace(/(^|[^\d/.])(\d+)\/(\d+)(?![\d/])/g, (_m, pre: string, n: string, d: string) => {
      const name = FRACTION_NAMES[Number(d)];
      return `${pre}${n} ${name ? name[n === "1" ? 0 : 1] : `over ${d}`}`;
    })
    .replace(/\s-\s/g, " minus ")
    .replace(/\s\+\s/g, " plus ")
    .replace(/\s=\s/g, " equals ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

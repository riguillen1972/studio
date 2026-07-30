import { ai, geminiFlash } from "../genkit";
import { z } from "zod";

export const CrossSubjectInput = z.object({
  topic: z.string(),
  secondarySubject: z.string().optional(),
  groundingContext: z.string().optional(),
});

export const crossSubject = ai.defineFlow(
  {
    name: "crossSubject",
    inputSchema: CrossSubjectInput,
    outputSchema: z.object({
      connection: z.string(),
      insight: z.string()
    }),
  },
  async ({ topic, secondarySubject, groundingContext }) => {
    let prompt = `
    You are the Cross-Subject Finder. The user is studying "${topic}".
    ${secondarySubject ? `Connect this topic to "${secondarySubject}".` : `Find a surprising connection between this topic and a completely unrelated subject (like art, economics, or biology).`}
    Explain the connection and provide a mind-expanding insight.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your response aligns with this Context Pack:\n${groundingContext}`;
    }

    const { output } = await ai.generate({
      model: geminiFlash,
      prompt: prompt,
      output: {
        schema: z.object({
          connection: z.string(),
          insight: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate Cross Subject response.");
    return output;
  }
);

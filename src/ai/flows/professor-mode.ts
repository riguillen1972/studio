import { ai, geminiFlash } from "../genkit";
import { z } from "zod";

export const ProfessorModeInput = z.object({
  topic: z.string(),
  question: z.string(),
  groundingContext: z.string().optional(),
});

export const professorMode = ai.defineFlow(
  {
    name: "professorMode",
    inputSchema: ProfessorModeInput,
    outputSchema: z.object({
      answer: z.string(),
      furtherReading: z.array(z.string())
    }),
  },
  async ({ topic, question, groundingContext }) => {
    let prompt = `
    You are in Professor Mode. The user has an advanced, high-level question about "${topic}".
    Question: "${question}"
    
    Provide an academic, highly detailed, and rigorous answer. Assume the user has a strong baseline understanding.
    Suggest 2-3 specific further readings or concepts they should explore.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your response aligns with this Context Pack:\n${groundingContext}`;
    }

    const { output } = await ai.generate({
      model: geminiFlash,
      prompt: prompt,
      output: {
        schema: z.object({
          answer: z.string(),
          furtherReading: z.array(z.string())
        })
      }
    });

    if (!output) throw new Error("Failed to generate Professor Mode response.");
    return output;
  }
);

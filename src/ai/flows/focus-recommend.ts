import { ai, gemmaLite } from "../genkit";
import { z } from "zod";

export const FocusRecommendInput = z.object({
  subject: z.string(),
  taskType: z.string().optional(),
});

export const focusRecommend = ai.defineFlow(
  {
    name: "focusRecommend",
    inputSchema: FocusRecommendInput,
    outputSchema: z.object({
      recommendedSound: z.enum(["deep-focus", "memory-mode", "noise-shield", "adhd-mode", "chill-study", "calm-study"]),
      reasoning: z.string()
    }),
  },
  async ({ subject, taskType }) => {
    const prompt = `
    You are an expert in cognitive psychology and acoustic environments. 
    A student is about to start a focus session.
    Subject: ${subject}
    Task Type: ${taskType || "studying"}

    Based on research, recommend the best background sound for this session.
    - deep-focus (Deep Focus): Best for deep concentration, writing, coding, essays.
    - memory-mode (Memory Mode): Best for reading, memorization, long study sessions.
    - noise-shield (Noise Shield): Best for blocking out distracting environments.
    - adhd-mode (ADHD Mode): Best for attention challenges.
    - chill-study (Chill Study): Best for low-intensity work, general studying.
    - calm-study (Calm Study): Best for reducing anxiety, light focus.

    Explain your reasoning in 1-2 short sentences.
    `;

    const { output } = await ai.generate({
      model: gemmaLite,
      prompt: prompt,
      output: {
        schema: z.object({
          recommendedSound: z.enum(["deep-focus", "memory-mode", "noise-shield", "adhd-mode", "chill-study", "calm-study"]),
          reasoning: z.string()
        })
      }
    });

    if (!output) {
      throw new Error("Failed to generate recommendation");
    }

    return output;
  }
);

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
      recommendedSound: z.enum(["brownNoise", "pinkNoise", "whiteNoise", "lofi", "rain", "cafe"]),
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
    - brownNoise (Deep Focus): Best for deep concentration, writing, coding, math.
    - pinkNoise (Memory Mode): Best for reading, memorization, long study sessions.
    - whiteNoise (Noise Shield): Best for blocking out distracting environments.
    - lofi (Chill Study): Best for low-intensity work, relaxed review.
    - rain (Calm Study): Best for reducing anxiety, gentle focus.
    - cafe (Coffee Shop): Best for brainstorming, creative tasks, essays.

    Explain your reasoning in 1-2 short sentences.
    `;

    const { output } = await ai.generate({
      model: gemmaLite,
      prompt: prompt,
      output: {
        schema: z.object({
          recommendedSound: z.enum(["brownNoise", "pinkNoise", "whiteNoise", "lofi", "rain", "cafe"]),
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

'use server';
/**
 * @fileOverview AI-powered video generation for educational tutorials.
 *
 * - generateVideo - A function that generates a video for a given topic.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import {ai, getModel, safetySettings} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const GenerateVideoInputSchema = z.object({
  topic: z.string().describe('The topic for the tutorial video.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async (input) => {
    const prompt = `Create a short, engaging, and educational tutorial video about "${input.topic}". The video should be study-related and suitable for students. Focus on clear explanations and visual appeal. Do not include any text overlays in the video.`;

    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: prompt,
      config: {
        durationSeconds: 8,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
        throw new Error('Video generation operation failed to start.');
    }

    // Poll for completion
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds
        operation = await ai.checkOperation(operation);
    }
    
    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);

    if (!video || !video.media?.url) {
        throw new Error('Generated video not found in the operation result.');
    }

    // The URL from Veo is a temporary download link. We need to fetch it and convert to a data URI.
    // This requires node-fetch to be installed.
    const fetch = (await import('node-fetch')).default;
    
    // The URL requires the API key to be appended for download.
    const videoDownloadResponse = await fetch(`${video.media.url}&key=${process.env.GEMINI_API_KEY}`);
    
    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to download video file. Status: ${videoDownloadResponse.statusText}`);
    }
    
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    const contentType = video.media.contentType || 'video/mp4';

    return {
        videoUrl: `data:${contentType};base64,${videoBase64}`
    };
  }
);

'use server';
/**
 * @fileOverview A flow that transcribes audio and generates prayer points.
 *
 * - transcribeAudioToPrayerPoints - A function that handles the audio transcription and prayer point generation.
 * - TranscribeAudioToPrayerPointsInput - The input type for the transcribeAudioToPrayerPoints function.
 * - TranscribeAudioToPrayerPointsOutput - The return type for the transcribeAudioToPrayerPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generatePrayerPointsFromText, type GeneratePrayerPointsFromTextOutput } from './generate-prayer-points-from-text';

const TranscribeAudioToPrayerPointsInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioToPrayerPointsInput = z.infer<typeof TranscribeAudioToPrayerPointsInputSchema>;

export type TranscribeAudioToPrayerPointsOutput = GeneratePrayerPointsFromTextOutput;

export async function transcribeAudioToPrayerPoints(input: TranscribeAudioToPrayerPointsInput): Promise<TranscribeAudioToPrayerPointsOutput> {
  return transcribeAudioToPrayerPointsFlow(input);
}

const transcribeAudioToPrayerPointsPrompt = ai.definePrompt({
  name: 'transcribeAudioPrompt',
  input: {schema: TranscribeAudioToPrayerPointsInputSchema},
  output: {schema: z.object({ transcribedText: z.string() })},
  prompt: `Transcribe the following audio recording to text:

Audio: {{media url=audioDataUri}}`,
});

const transcribeAudioToPrayerPointsFlow = ai.defineFlow(
  {
    name: 'transcribeAudioToPrayerPointsFlow',
    inputSchema: TranscribeAudioToPrayerPointsInputSchema,
    outputSchema: z.custom<GeneratePrayerPointsFromTextOutput>(),
  },
  async input => {
    const {output: transcriptionOutput} = await transcribeAudioToPrayerPointsPrompt(input);
    if (!transcriptionOutput?.transcribedText) {
        return { prayerPoints: [] };
    }
    
    return await generatePrayerPointsFromText({ text: transcriptionOutput.transcribedText });
  }
);

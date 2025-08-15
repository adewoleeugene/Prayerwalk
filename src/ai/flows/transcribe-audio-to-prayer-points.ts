'use server';
/**
 * @fileOverview A flow that transcribes audio recordings into text for prayer point selection.
 *
 * - transcribeAudioToPrayerPoints - A function that handles the audio transcription and returns the transcribed text.
 * - TranscribeAudioToPrayerPointsInput - The input type for the transcribeAudioToPrayerPoints function.
 * - TranscribeAudioToPrayerPointsOutput - The return type for the transcribeAudioToPrayerPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeAudioToPrayerPointsInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioToPrayerPointsInput = z.infer<typeof TranscribeAudioToPrayerPointsInputSchema>;

const TranscribeAudioToPrayerPointsOutputSchema = z.object({
  transcribedText: z.string().describe('The transcribed text from the audio recording.'),
});
export type TranscribeAudioToPrayerPointsOutput = z.infer<typeof TranscribeAudioToPrayerPointsOutputSchema>;

export async function transcribeAudioToPrayerPoints(input: TranscribeAudioToPrayerPointsInput): Promise<TranscribeAudioToPrayerPointsOutput> {
  return transcribeAudioToPrayerPointsFlow(input);
}

const transcribeAudioToPrayerPointsPrompt = ai.definePrompt({
  name: 'transcribeAudioToPrayerPointsPrompt',
  input: {schema: TranscribeAudioToPrayerPointsInputSchema},
  output: {schema: TranscribeAudioToPrayerPointsOutputSchema},
  prompt: `Transcribe the following audio recording to text:

Audio: {{media url=audioDataUri}}`,
});

const transcribeAudioToPrayerPointsFlow = ai.defineFlow(
  {
    name: 'transcribeAudioToPrayerPointsFlow',
    inputSchema: TranscribeAudioToPrayerPointsInputSchema,
    outputSchema: TranscribeAudioToPrayerPointsOutputSchema,
  },
  async input => {
    const {output} = await transcribeAudioToPrayerPointsPrompt(input);
    return output!;
  }
);


'use server';
/**
 * @fileOverview A flow that transcribes short audio, generates a summary, and creates prayer points.
 *
 * - transcribeAudioToPrayerPoints - A function that handles the audio transcription and prayer point generation.
 * - TranscribeAudioToPrayerPointsInput - The input type for the function.
 * - TranscribeAudioToPrayerPointsOutput - The return type for the function.
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


const PrayerPointSchema = z.object({
    point: z.string().describe('A suggested prayer point.'),
    bibleVerse: z.string().describe('A relevant Bible verse suggestion.'),
});

const TranscribeAudioToPrayerPointsOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the audio's content."),
  notes: z.string().describe("The full transcription of the audio."),
  prayerPoints: z.array(PrayerPointSchema).describe('A list of suggested prayer points and Bible verses.'),
});
export type TranscribeAudioToPrayerPointsOutput = z.infer<typeof TranscribeAudioToPrayerPointsOutputSchema>;

export async function transcribeAudioToPrayerPoints(input: TranscribeAudioToPrayerPointsInput): Promise<TranscribeAudioToPrayerPointsOutput> {
  return transcribeAudioToPrayerPointsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'summarizeAndExtractPrayersFromAudioPrompt',
    input: { schema: z.object({ audioDataUri: z.string() }) },
    output: { schema: TranscribeAudioToPrayerPointsOutputSchema },
    prompt: `You are an expert spiritual assistant. Listen to the following audio recording and perform these tasks:
1.  Transcribe the entire audio content verbatim. This will be the 'notes'.
2.  Write a concise, one-paragraph summary of the main themes and topics discussed. This will be the 'summary'.
3.  Based on the content, generate a list of actionable prayer points with relevant Bible verses.

Format your response as a single JSON object.

Audio: {{media url=audioDataUri}}
`
});


const transcribeAudioToPrayerPointsFlow = ai.defineFlow(
  {
    name: 'transcribeAudioToPrayerPointsFlow',
    inputSchema: TranscribeAudioToPrayerPointsInputSchema,
    outputSchema: TranscribeAudioToPrayerPointsOutputSchema,
  },
  async input => {
    
    if (!input.audioDataUri) {
        return { summary: "", notes: "", prayerPoints: [] };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);

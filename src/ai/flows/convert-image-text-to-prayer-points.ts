'use server';
/**
 * @fileOverview Converts image text to prayer points with suggested Bible verses.
 *
 * - convertImageTextToPrayerPoints - A function that handles the conversion process.
 * - ConvertImageTextToPrayerPointsInput - The input type for the convertImageTextToPrayerPoints function.
 * - ConvertImageTextToPrayerPointsOutput - The return type for the convertImageTextToPrayerPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConvertImageTextToPrayerPointsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ConvertImageTextToPrayerPointsInput = z.infer<typeof ConvertImageTextToPrayerPointsInputSchema>;

const ConvertImageTextToPrayerPointsOutputSchema = z.object({
  extractedText: z.string().describe('The full text extracted from the image.'),
  prayerPoints: z.array(
    z.object({
      point: z.string().describe('A suggested prayer point.'),
      bibleVerse: z.string().describe('A relevant Bible verse suggestion.'),
    })
  ).describe('A list of suggested prayer points and Bible verses.'),
});
export type ConvertImageTextToPrayerPointsOutput = z.infer<typeof ConvertImageTextToPrayerPointsOutputSchema>;

export async function convertImageTextToPrayerPoints(input: ConvertImageTextToPrayerPointsInput): Promise<ConvertImageTextToPrayerPointsOutput> {
  return convertImageTextToPrayerPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'convertImageTextToPrayerPointsPrompt',
  input: {schema: ConvertImageTextToPrayerPointsInputSchema},
  output: {schema: ConvertImageTextToPrayerPointsOutputSchema},
  prompt: `You are a helpful AI that extracts text from an image, and then generates prayer points and suggests relevant Bible verses from the extracted text.

First, extract all the text from the following image.
Then, analyze the extracted text and suggest prayer points and relevant Bible verses.

**IMPORTANT:** Each Bible verse MUST be formatted as "Reference: Full verse text" (e.g., "Philippians 4:13: I can do all things through Christ who strengthens me."). Always include both the complete reference and the full text of the verse.

Image: {{media url=photoDataUri}}

Format your response as a JSON object containing the full extracted text and a list of prayer points, where each prayer point includes the point itself and a suggested Bible verse.
`,
});

const convertImageTextToPrayerPointsFlow = ai.defineFlow(
  {
    name: 'convertImageTextToPrayerPointsFlow',
    inputSchema: ConvertImageTextToPrayerPointsInputSchema,
    outputSchema: ConvertImageTextToPrayerPointsOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (error: any) {
      if (error.message && error.message.includes('429 Too Many Requests')) {
          throw new Error('You have exceeded the daily limit for AI requests. Please try again tomorrow.');
      }
      console.error("Error in convertImageTextToPrayerPointsFlow: ", error);
      throw new Error('An unexpected error occurred while processing the image.');
    }
  }
);

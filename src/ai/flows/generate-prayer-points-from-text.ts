'use server';
/**
 * @fileOverview Generates prayer points from text with suggested Bible verses.
 *
 * - generatePrayerPointsFromText - A function that handles the generation process.
 * - GeneratePrayerPointsFromTextInput - The input type for the function.
 * - GeneratePrayerPointsFromTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePrayerPointsFromTextInputSchema = z.object({
  text: z.string().describe('The text to generate prayer points from.'),
});
export type GeneratePrayerPointsFromTextInput = z.infer<typeof GeneratePrayerPointsFromTextInputSchema>;

const PrayerPointSchema = z.object({
    point: z.string().describe('A suggested prayer point.'),
    bibleVerse: z.string().describe('A relevant Bible verse suggestion.'),
});

const GeneratePrayerPointsFromTextOutputSchema = z.object({
  notes: z.string().describe("The original text provided as input."),
  prayerPoints: z.array(PrayerPointSchema).describe('A list of suggested prayer points and Bible verses.'),
});
export type GeneratePrayerPointsFromTextOutput = z.infer<typeof GeneratePrayerPointsFromTextOutputSchema>;


export async function generatePrayerPointsFromText(input: GeneratePrayerPointsFromTextInput): Promise<GeneratePrayerPointsFromTextOutput> {
  return generatePrayerPointsFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePrayerPointsFromTextPrompt',
  input: {schema: GeneratePrayerPointsFromTextInputSchema},
  output: {schema: z.object({ prayerPoints: z.array(PrayerPointSchema) })},
  prompt: `You are a helpful AI that creates prayer points and suggests relevant Bible verses from a given text.

Analyze the following text and suggest prayer points and relevant Bible verses.

Text:
{{{text}}}

Format your response as a JSON object containing a list of prayer points, where each prayer point includes the point itself and a suggested Bible verse. If no prayer points can be derived from the text, return an empty list.
`,
});

const generatePrayerPointsFromTextFlow = ai.defineFlow(
  {
    name: 'generatePrayerPointsFromTextFlow',
    inputSchema: GeneratePrayerPointsFromTextInputSchema,
    outputSchema: GeneratePrayerPointsFromTextOutputSchema,
  },
  async input => {
    if (!input.text.trim()) {
        return { notes: input.text, prayerPoints: [] };
    }
    const {output} = await prompt(input);
    return {
        notes: input.text,
        prayerPoints: output!.prayerPoints,
    };
  }
);

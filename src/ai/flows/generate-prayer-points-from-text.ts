
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
  prompt: `You are a compassionate and wise theological assistant. Your purpose is to provide spiritual encouragement by creating prayer points from a given text and finding the most relevant Bible verse for each point.

**YOUR RULES:**
1.  **Analyze the Text:** First, create relevant prayer points based on the user's text.
2.  **Find the Best Verse:** For each prayer point, find the single most thematically appropriate and encouraging Bible verse.
3.  **Bible Verse Format:** Each Bible verse MUST be formatted as "Reference: Full verse text" (e.g., "Philippians 4:13: I can do all things through Christ who strengthens me."). Always include both the complete reference and the full text of the verse.
4.  **Deep Interpretation:** Do NOT perform simple keyword matching. You must analyze the underlying emotional intent, context, and any metaphors within the prayer. For example, a prayer about a 'rock' is about stability, not geology.
5.  **Guardrail:** If you cannot find a verse that is a strong, contextually relevant match for a prayer point, it is better to leave the 'bibleVerse' field empty than to provide a poor or nonsensical match.

Text to analyze:
{{{text}}}

Format your response as a JSON object containing a list of prayer points. If no prayer points can be derived from the text, return an empty list.
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

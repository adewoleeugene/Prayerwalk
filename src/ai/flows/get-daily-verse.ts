'use server';
/**
 * @fileOverview A flow that returns an inspirational Bible verse.
 *
 * - getDailyVerse - A function that returns a verse of the day.
 * - DailyVerse - The return type for the getDailyVerse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyVerseSchema = z.object({
  verse: z.string().describe('The Bible verse text.'),
  reference: z.string().describe('The reference of the Bible verse (e.g., John 3:16).'),
});
export type DailyVerse = z.infer<typeof DailyVerseSchema>;

export async function getDailyVerse(): Promise<DailyVerse> {
  // Direct call to the flow - caching will be handled on the client side
  return getDailyVerseFlow();
}

const prompt = ai.definePrompt({
  name: 'getDailyVersePrompt',
  output: {schema: DailyVerseSchema},
  prompt: `You are a spiritual guide. Your task is to provide a single, inspirational, and well-known Bible verse of the day. 
  
  Do not provide any commentary or introduction, just the verse and its reference.
  
  Please provide a verse that is encouraging, uplifting, or thought-provoking.`,
});

const getDailyVerseFlow = ai.defineFlow(
  {
    name: 'getDailyVerseFlow',
    outputSchema: DailyVerseSchema,
  },
  async () => {
    const {output} = await prompt({});
    return output!;
  }
);

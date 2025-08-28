
'use server';
/**
 * @fileOverview A flow that returns the text for a given Bible verse reference.
 *
 * - getVerseText - A function that returns the text of a verse.
 * - GetVerseTextInput - The input type for the function.
 * - GetVerseTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetVerseTextInputSchema = z.object({
  reference: z.string().describe('The reference of the Bible verse (e.g., John 3:16).'),
});
export type GetVerseTextInput = z.infer<typeof GetVerseTextInputSchema>;

const GetVerseTextOutputSchema = z.object({
  text: z.string().describe('The Bible verse text.'),
});
export type GetVerseTextOutput = z.infer<typeof GetVerseTextOutputSchema>;

export async function getVerseText(input: GetVerseTextInput): Promise<GetVerseTextOutput> {
  // Direct call to the flow - caching will be handled on the client side
  return getVerseTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getVerseTextPrompt',
  input: {schema: GetVerseTextInputSchema},
  output: {schema: GetVerseTextOutputSchema},
  prompt: `You are a biblical assistant. Your task is to return the full text for the given Bible verse reference: {{reference}}.
  
  Do not provide any commentary or introduction, just the verse text.
  If the reference is not found or is invalid, return an empty string for the text.`,
});

const getVerseTextFlow = ai.defineFlow(
  {
    name: 'getVerseTextFlow',
    inputSchema: GetVerseTextInputSchema,
    outputSchema: GetVerseTextOutputSchema,
  },
  async (input) => {
    if (!input.reference) {
        return { text: '' };
    }
    const {output} = await prompt(input);
    return output!;
  }
);

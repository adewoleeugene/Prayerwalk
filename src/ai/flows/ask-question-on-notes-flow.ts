
'use server';
/**
 * @fileOverview Answers questions based on provided text notes.
 *
 * - askQuestionOnNotes - A function that answers a question about notes.
 * - AskQuestionOnNotesInput - The input type for the function.
 * - AskQuestionOnNotesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskQuestionOnNotesInputSchema = z.object({
  notes: z.string().describe('The text content of the journal entry or notes.'),
  question: z.string().describe('The user\'s question about the notes.'),
});
export type AskQuestionOnNotesInput = z.infer<typeof AskQuestionOnNotesInputSchema>;

const AskQuestionOnNotesOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the question.'),
});
export type AskQuestionOnNotesOutput = z.infer<typeof AskQuestionOnNotesOutputSchema>;

export async function askQuestionOnNotes(input: AskQuestionOnNotesInput): Promise<AskQuestionOnNotesOutput> {
  return askQuestionOnNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askQuestionOnNotesPrompt',
  input: {schema: AskQuestionOnNotesInputSchema},
  output: {schema: AskQuestionOnNotesOutputSchema},
  prompt: `You are a helpful assistant. Your task is to answer the user's question based *only* on the provided notes.

Do not use any external knowledge. If the answer cannot be found in the notes, say "I can't find an answer to that in these notes."

**Notes:**
---
{{{notes}}}
---

**Question:**
{{question}}

**Answer:**
`,
});

const askQuestionOnNotesFlow = ai.defineFlow(
  {
    name: 'askQuestionOnNotesFlow',
    inputSchema: AskQuestionOnNotesInputSchema,
    outputSchema: AskQuestionOnNotesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

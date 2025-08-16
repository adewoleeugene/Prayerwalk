
'use server';
/**
 * @fileOverview Suggests a category for a list of prayer points.
 *
 * - suggestCategory - A function that suggests a category.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The return type for the suggestCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCategoryInputSchema = z.object({
  prayerPoints: z.array(z.string()).describe('A list of prayer points.'),
  categories: z.array(z.object({id: z.string(), name: z.string()})).describe('A list of available categories.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  categoryId: z.string().describe('The suggested category ID.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: {schema: SuggestCategoryInputSchema},
  output: {schema: SuggestCategoryOutputSchema},
  prompt: `You are an expert at organizing information. Your task is to suggest the most relevant category for a given list of prayer points by analyzing keywords in the text.

The available categories are:
{{#each categories}}
- {{name}} (id: {{id}})
{{/each}}

Analyze the keywords in the following prayer points:
{{#each prayerPoints}}
- {{this}}
{{/each}}

Based on the keywords and content of the prayer points, choose the single most appropriate category ID from the list provided.

Return only the category ID as a JSON object.`,
});

const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async (input) => {
    if (input.categories.length === 0) {
      return { categoryId: '' };
    }
    const {output} = await prompt(input);
    
    const validCategory = input.categories.some(c => c.id === output?.categoryId);
    if (!output || !validCategory) {
        return { categoryId: input.categories[0].id }; // Default fallback
    }

    return output!;
  }
);


'use server';
/**
 * @fileOverview Suggests an alternative, more suitable category for a prayer point.
 *
 * - suggestAlternativeCategory - A function that suggests a better category.
 * - SuggestAlternativeCategoryInput - The input type for the function.
 * - SuggestAlternativeCategoryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAlternativeCategoryInputSchema = z.object({
  prayerTitle: z.string().describe('The title or main text of the prayer point.'),
  originalCategoryId: z.string().describe('The ID of the category the user originally selected.'),
  categories: z.array(z.object({id: z.string(), name: z.string()})).describe('A list of all available categories.'),
});
export type SuggestAlternativeCategoryInput = z.infer<typeof SuggestAlternativeCategoryInputSchema>;

const SuggestAlternativeCategoryOutputSchema = z.object({
  suggestedCategoryId: z.string().nullable().describe('The ID of the suggested category, or null if the original is best.'),
  suggestionReason: z.string().nullable().describe('A brief reason for the suggestion, or null.'),
});
export type SuggestAlternativeCategoryOutput = z.infer<typeof SuggestAlternativeCategoryOutputSchema>;

export async function suggestAlternativeCategory(input: SuggestAlternativeCategoryInput): Promise<SuggestAlternativeCategoryOutput> {
  return suggestAlternativeCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAlternativeCategoryPrompt',
  input: {schema: SuggestAlternativeCategoryInputSchema},
  output: {schema: SuggestAlternativeCategoryOutputSchema},
  prompt: `You are an intelligent assistant that helps users organize their prayer points. Your task is to determine if there is a *more suitable* category for a prayer than the one the user originally selected.

**CONTEXT:**
- The user has written a prayer: "{{prayerTitle}}"
- They have placed it in the category with ID: "{{originalCategoryId}}"
- Here are all the available categories:
{{#each categories}}
- {{name}} (id: {{id}})
{{/each}}

**YOUR TASK:**
1.  Analyze the prayer's content and intent.
2.  Compare the user's chosen category ("{{originalCategoryId}}") with all other available categories.
3.  If you find a category that is a **significantly better fit** for the prayer, return that category's ID and a brief, friendly reason for the suggestion. The reason should be one sentence. For example: "Prayers about final exams often fit well under Study."
4.  If the user's original choice is appropriate or the best fit, return null for both 'suggestedCategoryId' and 'suggestionReason'. Do NOT suggest an alternative if the original choice is reasonable.

**EXAMPLE:**
- Prayer: "Praying for my final exam in history."
- Original Category: "personal"
- Available Categories: "personal", "family", "study"
- Your analysis: "study" is a much better fit.
- Your output: { "suggestedCategoryId": "study", "suggestionReason": "Prayers about exams often fit well in the Study category." }

Analyze the provided prayer and categories now.
`,
});

const suggestAlternativeCategoryFlow = ai.defineFlow(
  {
    name: 'suggestAlternativeCategoryFlow',
    inputSchema: SuggestAlternativeCategoryInputSchema,
    outputSchema: SuggestAlternativeCategoryOutputSchema,
  },
  async (input) => {
    // Don't suggest if there's only one category
    if (input.categories.length <= 1) {
      return { suggestedCategoryId: null, suggestionReason: null };
    }

    const {output} = await prompt(input);

    // Ensure the suggested category is valid and not the same as the original
    if (output?.suggestedCategoryId && output.suggestedCategoryId !== input.originalCategoryId) {
        const isValidSuggestion = input.categories.some(c => c.id === output.suggestedCategoryId);
        if (isValidSuggestion) {
            return output;
        }
    }
    
    return { suggestedCategoryId: null, suggestionReason: null };
  }
);

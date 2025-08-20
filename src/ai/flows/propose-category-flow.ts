
'use server';
/**
 * @fileOverview Proposes a category for prayer points, creating a new one if necessary.
 *
 * - proposeCategory - A function that suggests or creates a category.
 * - ProposeCategoryInput - The input type for the function.
 * - ProposeCategoryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ProposeCategoryInputSchema, ProposeCategoryOutputSchema, type ProposeCategoryInput, type ProposeCategoryOutput } from '@/lib/types';

export async function proposeCategory(input: ProposeCategoryInput): Promise<ProposeCategoryOutput> {
  return proposeCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proposeCategoryPrompt',
  input: {schema: ProposeCategoryInputSchema},
  output: {schema: ProposeCategoryOutputSchema},
  prompt: `You are an expert at organizing information. Your task is to categorize a list of prayer points.

Analyze the main theme of the following prayer points:
{{#each prayerPoints}}
- {{this}}
{{/each}}

Here are the available categories:
{{#each categories}}
- {{name}} (id: {{id}})
{{else}}
- No categories exist yet.
{{/each}}

**Your Decision Process:**

1.  **Check for a Strong Match:** First, determine if any of the existing categories is a strong, clear fit for the theme of the prayer points. If yes, return the ID of that category in the 'existingCategoryId' field.

2.  **Propose a New Category:** If NO existing category is a good fit, or if no categories exist, create a concise, relevant new category name (2-3 words max) that accurately describes the theme of the prayers. Return this name in the 'newCategoryName' field. Do not propose a category name that is very similar to an existing one.

**Examples:**
- Prayers: "Help my son with his exams", "Guide my daughter in her studies." Existing Categories: "Family", "Work". -> You should propose a new category: "Education" or "Children's Schooling".
- Prayers: "Thank you for the promotion", "Help me with the big project." Existing Categories: "Family", "Work". -> You should return the existing category ID for "Work".
- Prayers: "Heal my mother's sickness." No existing categories. -> You should propose a new category: "Family Health".

Return ONLY the JSON object with your decision.`,
});

const proposeCategoryFlow = ai.defineFlow(
  {
    name: 'proposeCategoryFlow',
    inputSchema: ProposeCategoryInputSchema,
    outputSchema: ProposeCategoryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);

    // Validate the output
    if (output?.existingCategoryId) {
        const isValid = input.categories.some(c => c.id === output.existingCategoryId);
        if (isValid) {
            return { existingCategoryId: output.existingCategoryId };
        }
    }
    
    if (output?.newCategoryName) {
        return { newCategoryName: output.newCategoryName };
    }

    // Fallback logic
    if (input.categories.length > 0) {
        return { existingCategoryId: input.categories[0].id };
    } else {
        return { newCategoryName: "General" };
    }
  }
);

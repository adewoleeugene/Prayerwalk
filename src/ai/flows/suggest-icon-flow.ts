'use server';
/**
 * @fileOverview Suggests an icon for a category.
 *
 * - suggestIcon - A function that suggests an icon.
 * - SuggestIconInput - The input type for the suggestIcon function.
 * - SuggestIconOutput - The return type for the suggestIcon function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {iconMap} from '@/components/icons';

const SuggestIconInputSchema = z.object({
  categoryName: z.string().describe('The name of the category.'),
});
export type SuggestIconInput = z.infer<typeof SuggestIconInputSchema>;

const SuggestIconOutputSchema = z.object({
  iconName: z.string().describe('The suggested icon name.'),
});
export type SuggestIconOutput = z.infer<typeof SuggestIconOutputSchema>;

export async function suggestIcon(input: SuggestIconInput): Promise<SuggestIconOutput> {
  return suggestIconFlow(input);
}

const availableIcons = Object.keys(iconMap).filter(key => key !== 'Default').join(', ');

const prompt = ai.definePrompt({
  name: 'suggestIconPrompt',
  input: {schema: SuggestIconInputSchema},
  output: {schema: SuggestIconOutputSchema},
  prompt: `You are a UI expert. Your task is to suggest a relevant icon for a given category name.
  
  The available icons are: ${availableIcons}.
  
  Please choose the most appropriate icon from the list for the category: "{{categoryName}}".
  
  Return only the name of the icon as a JSON object.`,
});

const suggestIconFlow = ai.defineFlow(
  {
    name: 'suggestIconFlow',
    inputSchema: SuggestIconInputSchema,
    outputSchema: SuggestIconOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !Object.keys(iconMap).includes(output.iconName)) {
        return { iconName: 'Folder' }; // Default fallback
    }
    return output!;
  }
);


'use server';
/**
 * @fileOverview Analyzes recent prayer activity to provide insights.
 *
 * - analyzePrayerActivity - A function that analyzes prayer data.
 * - AnalyzePrayerActivityInput - The input type for the function.
 * - AnalyzePrayerActivityOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Category, Prayer } from '@/lib/types';

const PrayerSchema = z.object({
    id: z.string(),
    title: z.string(),
    categoryId: z.string(),
    status: z.enum(['active', 'answered']),
    createdAt: z.string(),
});

const CategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
});

const AnalyzePrayerActivityInputSchema = z.object({
  recentPrayers: z.array(PrayerSchema).describe('A list of recently added prayers.'),
  answeredPrayers: z.array(PrayerSchema).describe('A list of recently answered prayers.'),
  categories: z.array(CategorySchema).describe('A list of all available categories.'),
});
export type AnalyzePrayerActivityInput = z.infer<typeof AnalyzePrayerActivityInputSchema>;

const AnalyzePrayerActivityOutputSchema = z.object({
  summary: z.string().describe('A thoughtful summary of recent prayer activity, including themes and encouragement.'),
});
export type AnalyzePrayerActivityOutput = z.infer<typeof AnalyzePrayerActivityOutputSchema>;


export async function analyzePrayerActivity(input: AnalyzePrayerActivityInput): Promise<AnalyzePrayerActivityOutput> {
  return analyzePrayerActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePrayerActivityPrompt',
  input: {schema: AnalyzePrayerActivityInputSchema},
  output: {schema: z.object({ summary: z.string() })},
  prompt: `You are a thoughtful and encouraging spiritual guide. Analyze the following prayer activity and provide a short, uplifting summary (2-3 sentences).

Focus on identifying recurring themes or topics in the recent prayers. Mention the answered prayers as a point of celebration and encouragement.

Recent Prayers:
{{#each recentPrayers}}
- {{title}} (Category: {{categoryId}})
{{else}}
No new prayers recently.
{{/each}}

Answered Prayers:
{{#each answeredPrayers}}
- {{title}} (Category: {{categoryId}})
{{else}}
No answered prayers recently.
{{/each}}

Generate a warm and insightful summary based on this activity.
`,
});

const analyzePrayerActivityFlow = ai.defineFlow(
  {
    name: 'analyzePrayerActivityFlow',
    inputSchema: AnalyzePrayerActivityInputSchema,
    outputSchema: AnalyzePrayerActivityOutputSchema,
  },
  async ({ recentPrayers, answeredPrayers, categories }) => {
    
    try {
      // Generate AI summary
      const { output } = await prompt({ recentPrayers, answeredPrayers, categories });
      const summary = output?.summary || "Keep going! Your consistency in prayer is wonderful.";

      return {
        summary,
      };
    } catch (error) {
      console.error("Error analyzing prayer activity:", error);
      // Return a graceful fallback if the AI model fails
      return {
        summary: "Could not generate analysis at this time. Keep up your prayer practice!",
      };
    }
  }
);

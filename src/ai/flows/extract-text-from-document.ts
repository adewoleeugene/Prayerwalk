
'use server';
/**
 * @fileOverview Extracts text from a document and generates prayer points.
 *
 * - extractTextFromDocument - A function that handles the document processing.
 * - ExtractTextFromDocumentInput - The input type for the function.
 * - ExtractTextFromDocumentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generatePrayerPointsFromText, type GeneratePrayerPointsFromTextOutput } from './generate-prayer-points-from-text';


const ExtractTextFromDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromDocumentInput = z.infer<typeof ExtractTextFromDocumentInputSchema>;
export type ExtractTextFromDocumentOutput = GeneratePrayerPointsFromTextOutput;


export async function extractTextFromDocument(input: ExtractTextFromDocumentInput): Promise<ExtractTextFromDocumentOutput> {
  return extractTextFromDocumentFlow(input);
}


const extractTextFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractTextFromDocumentFlow',
    inputSchema: ExtractTextFromDocumentInputSchema,
    outputSchema: z.custom<ExtractTextFromDocumentOutput>(),
  },
  async ({ documentDataUri }) => {
    // Step 1: Extract text from the document
    const { output } = await ai.generate({
      prompt: `Extract all text from this document.`,
      input: [{ media: { url: documentDataUri } }],
    });
    const extractedText = output?.text || '';

    // If no text is extracted, return an empty result.
    if (!extractedText.trim()) {
      return { notes: '', prayerPoints: [] };
    }

    // Step 2: Generate prayer points from the extracted text
    return await generatePrayerPointsFromText({ text: extractedText });
  }
);


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
  async input => {
    const {output} = await ai.generate({
      prompt: `Extract all text from the following document. Then, analyze the extracted text and suggest prayer points and relevant Bible verses.`,
      input: [{media: {url: input.documentDataUri}}]
    });

    const extractedText = output?.text || "";

    if (!extractedText.trim()) {
        return { notes: "", prayerPoints: [] };
    }
    
    return await generatePrayerPointsFromText({ text: extractedText });
  }
);

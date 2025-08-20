
'use server';
/**
 * @fileOverview Extracts text from a document or audio file.
 *
 * - extractTextFromDocument - A function that handles the file processing.
 * - ExtractTextFromDocumentInput - The input type for the function.
 * - ExtractTextFromDocumentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document or audio file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromDocumentInput = z.infer<typeof ExtractTextFromDocumentInputSchema>;

const ExtractTextFromDocumentOutputSchema = z.object({
    text: z.string().describe("The extracted text from the document or audio."),
});
export type ExtractTextFromDocumentOutput = z.infer<typeof ExtractTextFromDocumentOutputSchema>;


export async function extractTextFromDocument(input: ExtractTextFromDocumentInput): Promise<ExtractTextFromDocumentOutput> {
  return extractTextFromDocumentFlow(input);
}


const extractTextFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractTextFromDocumentFlow',
    inputSchema: ExtractTextFromDocumentInputSchema,
    outputSchema: ExtractTextFromDocumentOutputSchema,
  },
  async ({ documentDataUri }) => {
    
    const {text} = await ai.generate({
      prompt: [
        {text: `Transcribe the following audio file.`},
        {media: {url: documentDataUri}}
      ],
    });

    const extractedText = text ?? '';

    return { text: extractedText };
  }
);

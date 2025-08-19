
'use server';
/**
 * @fileOverview Analyzes a sermon document to produce a structured spiritual guide.
 *
 * - analyzeSermonDocument - A function that handles the sermon analysis process.
 * - AnalyzeSermonDocumentInput - The input type for the function.
 * - AnalyzeSermonDocumentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSermonDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document file (e.g., PDF, DOCX) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeSermonDocumentInput = z.infer<typeof AnalyzeSermonDocumentInputSchema>;

const AnalyzeSermonDocumentOutputSchema = z.object({
  title: z.string().describe("A concise and fitting title for the sermon or document."),
  scriptureReference: z.string().describe("All specific biblical passages referenced in the text."),
  coreMessageSummary: z.string().describe("A single paragraph summarizing the main message or central theme of the document."),
  keySpiritualTakeaways: z.array(z.string()).describe("3-5 of the most important spiritual truths or concepts presented."),
  notesAndReflectionPoints: z.array(z.string()).describe("Key phrases, memorable quotes, or reflective questions that encourage personal application and study."),
  prayerPoints: z.array(z.string()).describe("All specific, actionable prayer points."),
});
export type AnalyzeSermonDocumentOutput = z.infer<typeof AnalyzeSermonDocumentOutputSchema>;

export async function analyzeSermonDocument(input: AnalyzeSermonDocumentInput): Promise<AnalyzeSermonDocumentOutput> {
  return analyzeSermonDocumentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'analyzeSermonDocumentPrompt',
    input: { schema: z.object({ documentDataUri: z.string() }) },
    output: { schema: AnalyzeSermonDocumentOutputSchema },
    prompt: `You are an AI assistant built to process sermon-related documents. First, read and analyze the ENTIRE document from start to finish. Then, your goal is to transform the provided content into a structured, actionable spiritual guide for the user. Your output must be a single JSON object based strictly on the input text.

Your final output must be in this exact JSON format:

{
  "title": "",
  "scriptureReference": "",
  "coreMessageSummary": "",
  "keySpiritualTakeaways": [
    ""
  ],
  "notesAndReflectionPoints": [
    ""
  ],
  "prayerPoints": [
    ""
  ]
}

Instructions for Populating the JSON Object:

title: Create a concise and fitting title for the sermon or document.

scriptureReference: Extract all specific biblical passages referenced in the text.

coreMessageSummary: Write a single paragraph summarizing the main message or central theme of the document.

keySpiritualTakeaways: Identify and list 3-5 of the most important spiritual truths or concepts presented. Use a bulleted list format.

notesAndReflectionPoints: Extract key phrases, memorable quotes, or reflective questions that encourage personal application and study. Format these as a bulleted list.

prayerPoints: Extract all specific, actionable prayer points. Organize them by their respective topics or days if provided in the original text.

Input Document Content:

{{media url=documentDataUri}}

Strict Constraints:

Output must be a single, valid JSON object.

All content must be derived directly from the Input Document Content.

Do not add any explanations or text outside of the JSON structure.`,
});

const analyzeSermonDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeSermonDocumentFlow',
    inputSchema: AnalyzeSermonDocumentInputSchema,
    outputSchema: AnalyzeSermonDocumentOutputSchema,
  },
  async ({ documentDataUri }) => {
    // If no document is provided, return an empty result.
    if (!documentDataUri) {
      return {
        title: "Empty or Unreadable Document",
        scriptureReference: "",
        coreMessageSummary: "No text content could be extracted from the document.",
        keySpiritualTakeaways: [],
        notesAndReflectionPoints: [],
        prayerPoints: [],
      };
    }
    
    // Step 2: Analyze the extracted text using the detailed prompt
    const {output: analysisOutput} = await prompt({ documentDataUri });
    return analysisOutput!;
  }
);

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Use environment variable for API key security
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY environment variable is required');
}

export const ai = genkit({
  plugins: [
    googleAI({apiKey: GEMINI_API_KEY}),
  ],
  model: 'googleai/gemini-2.5-flash-lite',
});

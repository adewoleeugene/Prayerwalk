import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// WARNING: It is strongly recommended to use environment variables for your API key.
// Hardcoding keys in your source code can be a security risk.
// Replace "YOUR_API_KEY_HERE" with your actual Gemini API key.
const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

export const ai = genkit({
  plugins: [
    googleAI({apiKey: GEMINI_API_KEY}),
  ],
  model: 'googleai/gemini-1.5-pro-latest',
});

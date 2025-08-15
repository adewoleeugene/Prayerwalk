import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import {app} from '@/lib/firebase';

export const ai = genkit({
  plugins: [
    googleAI(),
    firebase({
      firebaseApp: app,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase, firebaseAuth} from '@genkit-ai/firebase/plugin';
import {app} from '@/lib/firebase';

export const ai = genkit({
  plugins: [
    googleAI(),
    firebase({
      firebaseApp: app,
    }),
    firebaseAuth(),
  ],
  model: 'googleai/gemini-2.0-flash',
});

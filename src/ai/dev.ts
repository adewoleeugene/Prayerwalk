import { config } from 'dotenv';
config();

import '@/ai/flows/convert-image-text-to-prayer-points.ts';
import '@/ai/flows/transcribe-audio-to-prayer-points.ts';
import '@/ai/flows/get-daily-verse.ts';
import '@/ai/flows/generate-prayer-points-from-text.ts';
import '@/ai/flows/suggest-icon-flow.ts';
import '@/ai/flows/suggest-category-flow.ts';
import '@/ai/flows/analyze-prayer-activity.ts';

'use server';
/**
 * @fileOverview Transcribes long audio files by chunking and generates prayer points.
 *
 * - transcribeLongAudio - A function that handles the transcription of long audio files.
 * - TranscribeLongAudioInput - The input type for the function.
 * - TranscribeLongAudioOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generatePrayerPointsFromText, type GeneratePrayerPointsFromTextOutput } from './generate-prayer-points-from-text';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);

const TranscribeLongAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A long audio recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeLongAudioInput = z.infer<typeof TranscribeLongAudioInputSchema>;
export type TranscribeLongAudioOutput = GeneratePrayerPointsFromTextOutput;

export async function transcribeLongAudio(input: TranscribeLongAudioInput): Promise<TranscribeLongAudioOutput> {
  return transcribeLongAudioFlow(input);
}

const transcribeLongAudioFlow = ai.defineFlow(
  {
    name: 'transcribeLongAudioFlow',
    inputSchema: TranscribeLongAudioInputSchema,
    outputSchema: z.custom<GeneratePrayerPointsFromTextOutput>(),
  },
  async (input) => {
    const { audioDataUri } = input;
    const { buffer, mimeType } = dataUriToBuffer(audioDataUri);
    
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-chunks-'));
    const tempFilePath = path.join(tempDir, `input.${mimeType.split('/')[1]}`);
    fs.writeFileSync(tempFilePath, buffer);

    try {
      const chunkPaths = await splitAudio(tempFilePath, tempDir);
      
      let fullTranscript = '';
      for (const chunkPath of chunkPaths) {
        const chunkBuffer = fs.readFileSync(chunkPath);
        const chunkMimeType = `audio/${path.extname(chunkPath).slice(1)}`;
        const chunkDataUri = `data:${chunkMimeType};base64,${chunkBuffer.toString('base64')}`;

        const { output } = await ai.generate({
          prompt: `Transcribe the following audio recording to text:`,
          input: [{ media: { url: chunkDataUri } }],
        });

        if (output?.text) {
          fullTranscript += output.text + ' ';
        }
      }

      if (!fullTranscript.trim()) {
        return { prayerPoints: [] };
      }

      return await generatePrayerPointsFromText({ text: fullTranscript });

    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
);

function dataUriToBuffer(dataUri: string) {
  const data = dataUri.split(',')[1];
  const mimeType = dataUri.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const buffer = Buffer.from(data, 'base64');
  return { buffer, mimeType };
}

function splitAudio(filePath: string, outputDir: string, chunkDuration = 55): Promise<string[]> {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .outputOptions([
        '-f segment',
        `-segment_time ${chunkDuration}`,
        '-c copy',
      ])
      .output(path.join(outputDir, 'chunk-%03d.mp3'))
      .on('end', () => {
        const files = fs.readdirSync(outputDir)
          .filter(file => file.startsWith('chunk-') && file.endsWith('.mp3'))
          .map(file => path.join(outputDir, file))
          .sort();
        resolve(files);
      })
      .on('error', (err) => {
        console.error('Error splitting audio:', err);
        reject(err);
      })
      .run();
  });
}

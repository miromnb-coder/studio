import { genkit } from 'genkit';
import { groq } from 'genkitx-groq';

/**
 * @fileOverview AI Configuration Engine.
 * Powered by Firebase Genkit and Groq.
 */

export const ai = genkit({
  plugins: [
    groq({ apiKey: process.env.GROQ_API_KEY })
  ],
});

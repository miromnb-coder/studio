import { genkit } from 'genkit';
import { groq } from 'genkitx-groq';

/**
 * @fileOverview AI Configuration Engine.
 * Exclusively powered by Groq for high-performance reasoning.
 */

export const ai = genkit({
  plugins: [
    groq({ apiKey: process.env.GROQ_API_KEY })
  ],
});

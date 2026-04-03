import Groq from 'groq-sdk';

/**
 * @fileOverview Groq SDK:n alustus.
 * Käyttää GROQ_API_KEY-ympäristömuuttujaa.
 */

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

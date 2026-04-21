import OpenAI from 'openai';

/**
 * @fileOverview OpenAI SDK Initialization (server-side only).
 */

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

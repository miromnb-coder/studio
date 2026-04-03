
import Groq from 'groq-sdk';

/**
 * @fileOverview Groq SDK Initialization.
 */

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

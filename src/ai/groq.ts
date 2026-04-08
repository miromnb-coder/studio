
import Groq from 'groq-sdk';

/**
 * @fileOverview Groq SDK Initialization.
 */

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true, // Required to prevent crash when imported in client components, although calls should remain on server
});

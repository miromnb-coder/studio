/**
 * @fileOverview Client-side service for interacting with the Gmail API.
 * Handles OAuth scope acquisition and filtered email retrieval for financial analysis.
 */

import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';

export interface GmailMessage {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export class GmailService {
  private static SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

  /**
   * Requests Gmail Read-Only access from the user and returns an access token.
   */
  static async connect(): Promise<string | null> {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    provider.addScope(this.SCOPE);

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      return credential?.accessToken || null;
    } catch (error) {
      console.error('Gmail Connection Error:', error);
      return null;
    }
  }

  /**
   * Fetches relevant financial emails using the provided access token.
   */
  static async fetchFinancialEmails(accessToken: string): Promise<GmailMessage[]> {
    // Queries for common financial keywords to minimize data retrieval
    const query = 'subject:(receipt OR invoice OR "subscription" OR "renewal" OR "billing" OR "trial" OR "payment")';
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`;

    try {
      const listResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!listResponse.ok) throw new Error('Failed to fetch message list');
      const listData = await listResponse.json();

      if (!listData.messages || listData.messages.length === 0) return [];

      const messages: GmailMessage[] = [];

      for (const msg of listData.messages) {
        const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
        const detailRes = await fetch(detailUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const headers = detailData.payload.headers;
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';

          messages.push({
            id: msg.id,
            snippet: detailData.snippet,
            subject,
            from,
            date,
          });
        }
      }

      return messages;
    } catch (error) {
      console.error('Gmail Fetch Error:', error);
      return [];
    }
  }
}

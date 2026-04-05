
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  Firestore,
  limit
} from 'firebase/firestore';
import { scanForSignals } from './proactive-service';

/**
 * @fileOverview Hardened Gmail API Service.
 * Filters for financial signals and manages secure ingestion into Firestore.
 */

export interface GmailMessage {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export class GmailService {
  private static SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
  ];

  static async connect(): Promise<string | null> {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    this.SCOPES.forEach(scope => provider.addScope(scope));

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      
      if (token) {
        localStorage.setItem('operator_gmail_token', token);
        localStorage.setItem('operator_gmail_connected', 'true');
        localStorage.setItem('operator_gmail_last_auth', new Date().toISOString());
      }
      
      return token;
    } catch (error) {
      console.error('[GMAIL] OAuth failed:', error);
      return null;
    }
  }

  static async sendEmail(accessToken: string, to: string, subject: string, body: string): Promise<boolean> {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      body,
    ];
    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedMessage }),
        }
      );

      return response.ok;
    } catch (e) {
      console.error('[GMAIL] Send error:', e);
      return false;
    }
  }

  static async fetchFinancialEmails(accessToken: string, maxResults = 15): Promise<GmailMessage[]> {
    const queryStr = 'subject:(receipt OR invoice OR "renewal notice" OR statement OR subscription OR payment OR lasku OR kuitti)';
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(queryStr)}&maxResults=${maxResults}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) return [];
      
      const data = await response.json();
      if (!data.messages) return [];

      const details = await Promise.all(
        data.messages.map(async (msg: { id: string }) => {
          const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
          const detailRes = await fetch(detailUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (detailRes.ok) {
            const d = await detailRes.json();
            const headers = d.payload.headers;
            return {
              id: msg.id,
              snippet: d.snippet,
              subject: headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject',
              from: headers.find((h: any) => h.name === 'From')?.value || 'Unknown',
              date: headers.find((h: any) => h.name === 'Date')?.value || '',
            };
          }
          return null;
        })
      );

      return details.filter((m): m is GmailMessage => m !== null);
    } catch (e) {
      console.error('[GMAIL] Sync error:', e);
      return [];
    }
  }

  static async syncToFirestore(db: Firestore, userId: string): Promise<number> {
    const token = localStorage.getItem('operator_gmail_token');
    if (!token) return 0;

    const emails = await this.fetchFinancialEmails(token);
    let syncedCount = 0;

    const inboxRef = collection(db, 'users', userId, 'inbox');
    
    for (const email of emails) {
      const q = query(inboxRef, where('id', '==', email.id), limit(1));
      const existing = await getDocs(q);
      
      if (existing.empty) {
        await addDoc(inboxRef, {
          ...email,
          userId,
          receivedAt: new Date(email.date).toISOString(),
          createdAt: serverTimestamp(),
          source: 'gmail_api'
        });
        
        // TRIGGER PROACTIVE SCAN (Safe Server Action call)
        scanForSignals(userId, `Subject: ${email.subject}\n\n${email.snippet}`);
        
        syncedCount++;
      }
    }

    if (syncedCount > 0) {
      localStorage.setItem('operator_gmail_last_sync', new Date().toISOString());
    }

    return syncedCount;
  }
}

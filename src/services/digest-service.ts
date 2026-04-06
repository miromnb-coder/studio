
/**
 * @fileOverview Service for generating and retrieving daily financial digests.
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  Firestore 
} from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export interface DailyDigest {
  id: string;
  userId: string;
  date: string;
  summary: string;
  estimatedMonthlySavings: number;
  findingsCount: number;
  topActions: Array<{
    title: string;
    description: string;
    urgency: string;
  }>;
  createdAt: any;
}

export class DigestService {
  /**
   * Fetches the latest digest for the user.
   */
  static async getLatestDigest(db: Firestore, userId: string): Promise<DailyDigest | null> {
    try {
      const q = query(
        collection(db, 'users', userId, 'digests'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as DailyDigest;
      }
      return null;
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}/digests`,
        operation: 'list',
      }));
      return null;
    }
  }

  /**
   * Generates a new digest based on recent findings.
   */
  static async generateDigest(db: Firestore, userId: string): Promise<DailyDigest | null> {
    try {
      // 1. Fetch recent analyses from last 24h
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const q = query(
        collection(db, 'users', userId, 'analyses'),
        where('analysisDate', '>=', yesterday),
        orderBy('analysisDate', 'desc')
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        return null; // No new data to summarize
      }

      const analyses = snap.docs.map(d => d.data());
      const totalSavings = analyses.reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0);
      
      // 2. Synthesize findings
      const digestData = {
        userId,
        date: new Date().toISOString().split('T')[0],
        summary: `I identified ${snap.size} new optimization markers today. Your projected reclaimed liquidity is approximately $${totalSavings.toFixed(0)} per month.`,
        estimatedMonthlySavings: totalSavings,
        findingsCount: snap.size,
        topActions: analyses.slice(0, 3).map(a => ({
          title: a.title,
          description: a.summary.substring(0, 100) + '...',
          urgency: a.estimatedMonthlySavings > 50 ? 'high' : 'medium'
        })),
        createdAt: serverTimestamp(),
      };

      const digestsRef = collection(db, 'users', userId, 'digests');
      const docRef = await addDoc(digestsRef, digestData);
      return { id: docRef.id, ...digestData } as DailyDigest;
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}/digests`,
        operation: 'create',
      }));
      return null;
    }
  }
}

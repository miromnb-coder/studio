import { initializeFirebase } from '@/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

export interface StructuredFailure {
  code: string;
  provider: string;
  context: Record<string, unknown>;
}

export interface EmailJobPayload {
  recipient: string;
  subject: string;
  body: string;
  provider: string;
}

export interface EmailJobRecord extends EmailJobPayload {
  status: 'pending' | 'retrying' | 'sent' | 'failed';
  maxAttempts: number;
  attemptCount: number;
  nextRetryAt: string;
  lastError: StructuredFailure | null;
  providerMessageId?: string;
}

const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 15 * 60_000;

export function calculateNextRetryAt(attemptCount: number): string {
  const delay = Math.min(BASE_DELAY_MS * (2 ** Math.max(attemptCount - 1, 0)), MAX_DELAY_MS);
  return new Date(Date.now() + delay).toISOString();
}

function toStructuredFailure(error: unknown, provider: string, context: Record<string, unknown>): StructuredFailure {
  if (typeof error === 'object' && error && 'code' in error && typeof (error as { code: unknown }).code === 'string') {
    return {
      code: (error as { code: string }).code,
      provider,
      context,
    };
  }

  return {
    code: 'OUTBOUND_SEND_FAILED',
    provider,
    context,
  };
}

async function sendViaProvider(payload: EmailJobPayload): Promise<{ providerMessageId: string }> {
  const providerUrl = process.env.OUTBOUND_EMAIL_PROVIDER_URL;

  if (!providerUrl) {
    throw { code: 'PROVIDER_ENDPOINT_MISSING' };
  }

  const response = await fetch(providerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw { code: `PROVIDER_HTTP_${response.status}` };
  }

  const data = await response.json().catch(() => ({}));
  return { providerMessageId: data.messageId || data.id || `${Date.now()}` };
}

export async function enqueueEmailJob(payload: EmailJobPayload, maxAttempts = 5): Promise<string> {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    throw { code: 'FIRESTORE_NOT_INITIALIZED' };
  }

  const nextRetryAt = new Date().toISOString();
  const ref = await addDoc(collection(firestore, 'emailJobs'), {
    ...payload,
    status: 'pending',
    maxAttempts,
    attemptCount: 0,
    nextRetryAt,
    lastError: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as EmailJobRecord);

  return ref.id;
}

export async function processEmailJob(jobId: string): Promise<{ success: boolean; failure?: StructuredFailure }> {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return {
      success: false,
      failure: {
        code: 'FIRESTORE_NOT_INITIALIZED',
        provider: 'system',
        context: { jobId },
      },
    };
  }

  const jobRef = doc(firestore, 'emailJobs', jobId);
  const snapshot = await getDoc(jobRef);
  if (!snapshot.exists()) {
    return {
      success: false,
      failure: {
        code: 'EMAIL_JOB_NOT_FOUND',
        provider: 'system',
        context: { jobId },
      },
    };
  }

  const job = snapshot.data() as EmailJobRecord;

  if (job.status === 'sent' || job.status === 'failed') {
    return { success: true };
  }

  const attemptNumber = (job.attemptCount || 0) + 1;

  try {
    const { providerMessageId } = await sendViaProvider(job);

    await updateDoc(jobRef, {
      attemptCount: attemptNumber,
      providerMessageId,
      status: 'sent',
      lastError: null,
      nextRetryAt: null,
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(firestore, 'emailJobs', jobId, 'attempts'), {
      attemptNumber,
      success: true,
      provider: job.provider,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: unknown) {
    const failure = toStructuredFailure(error, job.provider, { jobId, recipient: job.recipient, attemptNumber });
    const hasMoreRetries = attemptNumber < (job.maxAttempts || 5);
    const nextRetryAt = hasMoreRetries ? calculateNextRetryAt(attemptNumber) : null;

    await updateDoc(jobRef, {
      attemptCount: attemptNumber,
      status: hasMoreRetries ? 'retrying' : 'failed',
      lastError: failure,
      nextRetryAt,
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(firestore, 'emailJobs', jobId, 'attempts'), {
      attemptNumber,
      success: false,
      error: failure,
      provider: job.provider,
      nextRetryAt,
      createdAt: serverTimestamp(),
    });

    return { success: false, failure };
  }
}

export async function processDueEmailJobs(maxJobs = 20): Promise<{ processed: number; failures: StructuredFailure[] }> {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return {
      processed: 0,
      failures: [{ code: 'FIRESTORE_NOT_INITIALIZED', provider: 'system', context: {} }],
    };
  }

  const now = new Date().toISOString();
  const jobsQuery = query(
    collection(firestore, 'emailJobs'),
    where('status', 'in', ['pending', 'retrying']),
    where('nextRetryAt', '<=', now),
    limit(maxJobs),
  );

  const snapshot = await getDocs(jobsQuery);
  const failures: StructuredFailure[] = [];

  for (const queuedJob of snapshot.docs) {
    const result = await processEmailJob(queuedJob.id);
    if (!result.success && result.failure) {
      failures.push(result.failure);
    }
  }

  return {
    processed: snapshot.size,
    failures,
  };
}

export async function claimInboundWebhook(
  provider: string,
  providerMessageId: string,
  recipient: string,
): Promise<{ duplicate: boolean; key: string }> {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    throw { code: 'FIRESTORE_NOT_INITIALIZED' };
  }

  const key = encodeURIComponent(`${provider}:${providerMessageId}:${recipient}`);
  const idempotencyRef = doc(firestore, 'inboundWebhookReceipts', key);

  const result = await runTransaction(firestore, async (tx) => {
    const existing = await tx.get(idempotencyRef);
    if (existing.exists()) {
      return { duplicate: true };
    }

    tx.set(idempotencyRef, {
      provider,
      providerMessageId,
      recipient,
      createdAt: serverTimestamp(),
    });

    return { duplicate: false };
  });

  return { ...result, key };
}

export async function markWebhookReceiptProcessed(key: string, updates: Record<string, unknown>): Promise<void> {
  const { firestore } = initializeFirebase();
  if (!firestore) return;

  const receiptRef = doc(firestore, 'inboundWebhookReceipts', key);
  await setDoc(receiptRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
}

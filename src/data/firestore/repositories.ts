import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  AnalysisDocument,
  EmailDeliveryEventDocument,
  InboundEmailDocument,
  LongTermMemoryDocument,
  NoteDocument,
  OutboundEmailDocument,
  TaskDocument,
} from './models';

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${field}`);
  }
}

function optionalIdPayload<T extends object>(payload: T, id?: string) {
  return {
    id,
    payload: {
      ...payload,
      updatedAt: serverTimestamp(),
    },
  };
}

export async function findUserIdByInboundEmail(db: Firestore, inboundEmailAddress: string): Promise<string | null> {
  assertNonEmptyString(inboundEmailAddress, 'inboundEmailAddress');
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('inboundEmailAddress', '==', inboundEmailAddress));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : snapshot.docs[0].id;
}

export async function createInboundEmail(
  db: Firestore,
  userId: string,
  input: Omit<InboundEmailDocument, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
) {
  assertNonEmptyString(userId, 'userId');
  assertNonEmptyString(input.subject, 'subject');
  assertNonEmptyString(input.body, 'body');

  const { id, payload } = optionalIdPayload(
    {
      ...input,
      createdAt: serverTimestamp(),
    },
    input.id,
  );

  if (id) {
    const ref = doc(db, 'users', userId, 'inbound_emails', id);
    await setDoc(ref, payload, { merge: true });
    return ref;
  }

  return addDoc(collection(db, 'users', userId, 'inbound_emails'), payload);
}

export async function createOutboundEmail(
  db: Firestore,
  userId: string,
  input: Omit<OutboundEmailDocument, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
) {
  assertNonEmptyString(userId, 'userId');
  assertNonEmptyString(input.to, 'to');
  assertNonEmptyString(input.subject, 'subject');

  const { id, payload } = optionalIdPayload(
    {
      ...input,
      createdAt: serverTimestamp(),
    },
    input.id,
  );

  if (id) {
    const ref = doc(db, 'users', userId, 'outbound_emails', id);
    await setDoc(ref, payload, { merge: true });
    return ref;
  }

  return addDoc(collection(db, 'users', userId, 'outbound_emails'), payload);
}

export async function createEmailDeliveryEvent(
  db: Firestore,
  userId: string,
  input: Omit<EmailDeliveryEventDocument, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
) {
  assertNonEmptyString(userId, 'userId');
  assertNonEmptyString(input.eventType, 'eventType');
  assertNonEmptyString(input.occurredAt, 'occurredAt');

  const { id, payload } = optionalIdPayload(
    {
      ...input,
      createdAt: serverTimestamp(),
    },
    input.id,
  );

  if (input.outboundEmailId) {
    if (id) {
      const ref = doc(db, 'users', userId, 'outbound_emails', input.outboundEmailId, 'delivery_events', id);
      await setDoc(ref, payload, { merge: true });
      return ref;
    }

    return addDoc(collection(db, 'users', userId, 'outbound_emails', input.outboundEmailId, 'delivery_events'), payload);
  }

  if (id) {
    const ref = doc(db, 'users', userId, 'email_delivery_events', id);
    await setDoc(ref, payload, { merge: true });
    return ref;
  }

  return addDoc(collection(db, 'users', userId, 'email_delivery_events'), payload);
}

export async function createAnalysis(
  db: Firestore,
  userId: string,
  input: Omit<AnalysisDocument, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
) {
  assertNonEmptyString(userId, 'userId');
  assertNonEmptyString(input.title, 'title');

  const { id, payload } = optionalIdPayload(
    {
      ...input,
      createdAt: serverTimestamp(),
    },
    input.id,
  );

  if (id) {
    const ref = doc(db, 'users', userId, 'analyses', id);
    await setDoc(ref, payload, { merge: true });
    return ref;
  }

  return addDoc(collection(db, 'users', userId, 'analyses'), payload);
}

export async function createTask(
  db: Firestore,
  userId: string,
  input: Omit<TaskDocument, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
) {
  assertNonEmptyString(userId, 'userId');
  assertNonEmptyString(input.title, 'title');

  const { id, payload } = optionalIdPayload(
    {
      ...input,
      createdAt: serverTimestamp(),
    },
    input.id,
  );

  if (id) {
    const ref = doc(db, 'users', userId, 'tasks', id);
    await setDoc(ref, payload, { merge: true });
    return ref;
  }

  return addDoc(collection(db, 'users', userId, 'tasks'), payload);
}

export async function createNote(
  db: Firestore,
  userId: string,
  input: Omit<NoteDocument, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
) {
  assertNonEmptyString(userId, 'userId');
  assertNonEmptyString(input.content, 'content');

  const { id, payload } = optionalIdPayload(
    {
      ...input,
      createdAt: serverTimestamp(),
    },
    input.id,
  );

  if (id) {
    const ref = doc(db, 'users', userId, 'notes', id);
    await setDoc(ref, payload, { merge: true });
    return ref;
  }

  return addDoc(collection(db, 'users', userId, 'notes'), payload);
}

export async function getLongTermMemory(db: Firestore, userId: string): Promise<LongTermMemoryDocument | null> {
  assertNonEmptyString(userId, 'userId');
  const memoryRef = doc(db, 'users', userId, 'memory', 'main');
  const snap = await getDoc(memoryRef);
  if (!snap.exists()) return null;

  return {
    id: 'main',
    ...(snap.data() as Omit<LongTermMemoryDocument, 'id'>),
  };
}

export async function upsertLongTermMemory(
  db: Firestore,
  userId: string,
  updates: Partial<Omit<LongTermMemoryDocument, 'id' | 'createdAt' | 'updatedAt'>>,
) {
  assertNonEmptyString(userId, 'userId');
  const memoryRef = doc(db, 'users', userId, 'memory', 'main');
  await setDoc(
    memoryRef,
    {
      ...updates,
      userId,
      lastUpdated: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

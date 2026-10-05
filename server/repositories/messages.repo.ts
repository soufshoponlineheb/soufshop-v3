import 'server-only';
import { getAdminDb } from '@/server/config/firebase-admin';
import type { ContactMessage } from '@/types';
import { validateContactInput } from '@/server/validators';

const COLLECTION = 'messages';

export async function createContactMessage(input: unknown): Promise<ContactMessage> {
  const validated = validateContactInput(input);
  const db = getAdminDb();

  if (!db) {
    throw new Error('Message service is temporarily unavailable.');
  }

  const now = new Date().toISOString();
  const docRef = db.collection(COLLECTION).doc();
  const record: Omit<ContactMessage, 'id'> = {
    ...validated,
    isRead: false,
    createdAt: now,
  };

  await docRef.set(record);
  return { id: docRef.id, ...record };
}

export async function listMessagesAdmin(): Promise<ContactMessage[]> {
  const db = getAdminDb();
  if (!db) return [];

  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(100).get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ContactMessage, 'id'>),
  }));
}

export async function markMessageReadAdmin(messageId: string, isRead = true): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Database connection is not configured yet.');
  }
  await db.collection(COLLECTION).doc(messageId).update({ isRead });
}

export async function deleteMessageAdmin(messageId: string): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Database connection is not configured yet.');
  }
  await db.collection(COLLECTION).doc(messageId).delete();
}

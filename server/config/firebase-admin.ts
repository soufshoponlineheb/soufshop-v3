import 'server-only';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { loadServerEnv } from './env';

const SOUFSHOP_PROJECT_ID = 'soufshopstore';
const SOUFSHOP_RTDB_URL = 'https://soufshopstore-default-rtdb.firebaseio.com';
const SOUFSHOP_FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${SOUFSHOP_PROJECT_ID}/databases/(default)/documents`;

const PERSISTENT_DB_PATH = path.join(process.cwd(), '.soufshopstore-data.json');
const TMP_DB_PATH = path.join('/tmp', 'soufshopstore-db.json');
const TMP_TOKEN_PATH = path.join('/tmp', 'soufshopstore-idtoken.txt');

const CLOUD_FETCH_TIMEOUT_MS = 3500;
const COLLECTION_CACHE_TTL_MS = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CloudDocumentData = { [field: string]: any };

export interface CloudDocSnapshot {
  id: string;
  exists: boolean;
  data: () => CloudDocumentData | undefined;
}

export interface CloudQuerySnapshot {
  empty: boolean;
  docs: Array<{
    id: string;
    exists: boolean;
    data: () => CloudDocumentData;
  }>;
}

export interface CloudBatch {
  set: (
    ref: CloudSyncedDocRef,
    data: object,
    options?: { merge?: boolean }
  ) => void;
  update: (ref: CloudSyncedDocRef, data: object) => void;
  delete: (ref: CloudSyncedDocRef) => void;
  commit: () => Promise<void>;
}

export interface CloudFirestoreAdapter {
  collection: (name: string) => CloudSyncedCollectionQuery;
  batch: () => CloudBatch;
}

export interface CloudAuthAdapter {
  verifyIdToken: (
    idToken: string,
    checkRevoked?: boolean
  ) => Promise<{ uid: string; email?: string; email_verified?: boolean }>;
  verifySessionCookie: (
    sessionCookie: string,
    checkRevoked?: boolean
  ) => Promise<{ uid: string; email?: string; email_verified?: boolean }>;
  deleteUser: (uid: string) => Promise<void>;
}

type CollectionStore = Record<string, Record<string, Record<string, unknown>>>;

let cachedFirebaseIdToken: string | null = null;
let inMemoryStore: CollectionStore | null = null;
const collectionCacheTimestamps: Record<string, number> = {};

function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = CLOUD_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, {
    ...init,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

export function setServerFirebaseIdToken(idToken: string): void {
  if (!idToken) return;
  cachedFirebaseIdToken = idToken;
  try {
    fs.writeFileSync(TMP_TOKEN_PATH, idToken, 'utf8');
  } catch {
    // Ignore write error in serverless read-only environments
  }
}

export function getServerFirebaseIdToken(): string | null {
  if (cachedFirebaseIdToken) return cachedFirebaseIdToken;
  try {
    if (fs.existsSync(TMP_TOKEN_PATH)) {
      const token = fs.readFileSync(TMP_TOKEN_PATH, 'utf8').trim();
      if (token) {
        cachedFirebaseIdToken = token;
        return token;
      }
    }
  } catch {
    // Ignore read error
  }
  return null;
}

function readLocalMirror(): CollectionStore {
  if (inMemoryStore) {
    return inMemoryStore;
  }

  for (const filePath of [TMP_DB_PATH, PERSISTENT_DB_PATH]) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          inMemoryStore = parsed as CollectionStore;
          return inMemoryStore;
        }
      }
    } catch {
      // Continue to next path
    }
  }

  inMemoryStore = {};
  return inMemoryStore;
}

function writeLocalMirror(store: CollectionStore): void {
  inMemoryStore = store;
  const serialized = JSON.stringify(store, null, 2);
  // Write to /tmp first (supported in serverless functions), then local cwd if writable
  const isServerless = Boolean(process.env.NETLIFY || process.env.VERCEL);
  const pathsToWrite = isServerless
    ? [TMP_DB_PATH]
    : [TMP_DB_PATH, PERSISTENT_DB_PATH];

  for (const filePath of pathsToWrite) {
    try {
      fs.writeFileSync(filePath, serialized, 'utf8');
    } catch {
      // Ignore write errors on read-only mounts
    }
  }
}

/**
 * Firestore REST Value serialization & deserialization for project `soufshopstore`
 */
interface FirestoreRestValue {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  stringValue?: string;
  arrayValue?: { values?: FirestoreRestValue[] };
  mapValue?: { fields?: Record<string, FirestoreRestValue> };
}

function toFirestoreValue(val: unknown): FirestoreRestValue {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { nullValue: null };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map((item) => toFirestoreValue(item)),
      },
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, FirestoreRestValue> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(val: FirestoreRestValue | undefined): unknown {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if (typeof val.booleanValue === 'boolean') return val.booleanValue;
  if (typeof val.integerValue === 'string') return Number(val.integerValue);
  if (typeof val.doubleValue === 'number') return val.doubleValue;
  if (typeof val.stringValue === 'string') return val.stringValue;
  if (val.arrayValue) {
    return (val.arrayValue.values || []).map((v) => fromFirestoreValue(v));
  }
  if (val.mapValue) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  return null;
}

function toFirestoreDocument(record: Record<string, unknown>): {
  fields: Record<string, FirestoreRestValue>;
} {
  const fields: Record<string, FirestoreRestValue> = {};
  for (const [k, v] of Object.entries(record)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return { fields };
}

function fromFirestoreDocument(doc: {
  name?: string;
  fields?: Record<string, FirestoreRestValue>;
}): { id: string; data: Record<string, unknown> } | null {
  if (!doc || !doc.fields) return null;
  const parts = (doc.name || '').split('/');
  const id = parts[parts.length - 1] || '';
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    data[k] = fromFirestoreValue(v);
  }
  return { id, data };
}

/**
 * Cloud sync helpers for `soufshopstore` (Realtime Database + Cloud Firestore REST)
 */
async function writeDocToSoufshopCloud(
  collectionName: string,
  docId: string,
  record: Record<string, unknown>
): Promise<void> {
  const token = getServerFirebaseIdToken();
  const env = loadServerEnv();
  collectionCacheTimestamps[collectionName] = 0;

  // 1. Write to Firebase Realtime Database (`soufshopstore-default-rtdb.firebaseio.com`)
  const rtdbBase = `${SOUFSHOP_RTDB_URL}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}.json`;
  const rtdbUrls = token
    ? [`${rtdbBase}?auth=${encodeURIComponent(token)}`, rtdbBase]
    : [rtdbBase];

  for (const url of rtdbUrls) {
    try {
      const res = await fetchWithTimeout(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
        cache: 'no-store',
      });
      if (res.ok) break;
    } catch {
      // Try next endpoint
    }
  }

  // 2. Write to Cloud Firestore REST (`soufshopstore`)
  const firestoreUrl = `${SOUFSHOP_FIRESTORE_BASE_URL}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}?key=${encodeURIComponent(env.firebaseClientApiKey)}`;
  const firestoreBody = JSON.stringify(toFirestoreDocument(record));

  const headerAttempts: Array<Record<string, string>> = token
    ? [
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        { 'Content-Type': 'application/json' },
      ]
    : [{ 'Content-Type': 'application/json' }];

  for (const hdrs of headerAttempts) {
    try {
      const res = await fetchWithTimeout(firestoreUrl, {
        method: 'PATCH',
        headers: hdrs,
        body: firestoreBody,
        cache: 'no-store',
      });
      if (res.ok) break;
    } catch {
      // Try next header set
    }
  }
}

async function deleteDocFromSoufshopCloud(
  collectionName: string,
  docId: string
): Promise<void> {
  const token = getServerFirebaseIdToken();
  const env = loadServerEnv();
  collectionCacheTimestamps[collectionName] = 0;

  // 1. Delete from Realtime Database
  const rtdbBase = `${SOUFSHOP_RTDB_URL}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}.json`;
  const rtdbUrls = token
    ? [`${rtdbBase}?auth=${encodeURIComponent(token)}`, rtdbBase]
    : [rtdbBase];

  for (const url of rtdbUrls) {
    try {
      const res = await fetchWithTimeout(url, { method: 'DELETE', cache: 'no-store' });
      if (res.ok) break;
    } catch {
      // Ignore
    }
  }

  // 2. Delete from Cloud Firestore REST
  const firestoreUrl = `${SOUFSHOP_FIRESTORE_BASE_URL}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}?key=${encodeURIComponent(env.firebaseClientApiKey)}`;
  const headerAttempts: Array<Record<string, string>> = token
    ? [{ Authorization: `Bearer ${token}` }, {}]
    : [{}];

  for (const hdrs of headerAttempts) {
    try {
      const res = await fetchWithTimeout(firestoreUrl, {
        method: 'DELETE',
        headers: hdrs,
        cache: 'no-store',
      });
      if (res.ok) break;
    } catch {
      // Ignore
    }
  }
}

async function fetchCollectionFromSoufshopCloud(
  collectionName: string
): Promise<Record<string, Record<string, unknown>> | null> {
  const now = Date.now();
  const lastFetched = collectionCacheTimestamps[collectionName] || 0;
  const store = readLocalMirror();

  if (
    COLLECTION_CACHE_TTL_MS > 0 &&
    now - lastFetched < COLLECTION_CACHE_TTL_MS &&
    store[collectionName]
  ) {
    return store[collectionName];
  }

  const token = getServerFirebaseIdToken();
  const env = loadServerEnv();

  // 1. Primary Source of Truth: Cloud Firestore REST API
  const firestoreUrl = `${SOUFSHOP_FIRESTORE_BASE_URL}/${encodeURIComponent(collectionName)}?pageSize=200&key=${encodeURIComponent(env.firebaseClientApiKey)}`;
  const headerAttempts: Array<Record<string, string>> = token
    ? [{ Authorization: `Bearer ${token}` }, {}]
    : [{}];

  for (const hdrs of headerAttempts) {
    try {
      const res = await fetchWithTimeout(firestoreUrl, {
        method: 'GET',
        headers: hdrs,
        cache: 'no-store',
      });
      if (res.ok) {
        const payload = (await res.json()) as {
          documents?: Array<{
            name?: string;
            fields?: Record<string, FirestoreRestValue>;
          }>;
        };
        const map: Record<string, Record<string, unknown>> = {};
        if (Array.isArray(payload.documents)) {
          for (const rawDoc of payload.documents) {
            const parsed = fromFirestoreDocument(rawDoc);
            if (parsed && parsed.id) {
              map[parsed.id] = parsed.data;
            }
          }
        }
        collectionCacheTimestamps[collectionName] = Date.now();
        return map;
      }
    } catch {
      // Try next header or fallback
    }
  }

  // 2. Fallback: Firebase Realtime Database
  const rtdbBase = `${SOUFSHOP_RTDB_URL}/${encodeURIComponent(collectionName)}.json`;
  const rtdbUrls = token
    ? [`${rtdbBase}?auth=${encodeURIComponent(token)}`, rtdbBase]
    : [rtdbBase];

  for (const url of rtdbUrls) {
    try {
      const res = await fetchWithTimeout(url, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data === null) {
          collectionCacheTimestamps[collectionName] = Date.now();
          return {};
        }
        if (data && typeof data === 'object' && !('error' in data)) {
          collectionCacheTimestamps[collectionName] = Date.now();
          return data as Record<string, Record<string, unknown>>;
        }
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

export class CloudSyncedDocRef {
  public readonly id: string;
  private readonly collectionName: string;

  constructor(collectionName: string, docId?: string) {
    this.collectionName = collectionName;
    this.id = docId || randomBytes(10).toString('hex');
  }

  async get(): Promise<CloudDocSnapshot> {
    const store = readLocalMirror();
    const cloudCol = await fetchCollectionFromSoufshopCloud(this.collectionName);
    if (cloudCol !== null && Object.keys(cloudCol).length > 0) {
      store[this.collectionName] = {
        ...(store[this.collectionName] || {}),
        ...cloudCol,
      };
      writeLocalMirror(store);
    }

    const col = store[this.collectionName] || {};
    const record = col[this.id];
    return {
      id: this.id,
      exists: Boolean(record),
      data: () => (record ? { ...record } : undefined),
    };
  }

  async set(data: object, options?: { merge?: boolean }) {
    const record = data as Record<string, unknown>;
    const store = readLocalMirror();
    if (!store[this.collectionName]) {
      store[this.collectionName] = {};
    }
    const existing = store[this.collectionName][this.id] || {};
    const merged = options?.merge ? { ...existing, ...record } : { ...record };
    store[this.collectionName][this.id] = merged;
    writeLocalMirror(store);
    await writeDocToSoufshopCloud(this.collectionName, this.id, merged);
  }

  async update(data: object) {
    const record = data as Record<string, unknown>;
    const store = readLocalMirror();
    if (!store[this.collectionName]) {
      store[this.collectionName] = {};
    }
    const existing = store[this.collectionName][this.id] || {};
    const merged = { ...existing, ...record };
    store[this.collectionName][this.id] = merged;
    writeLocalMirror(store);
    await writeDocToSoufshopCloud(this.collectionName, this.id, merged);
  }

  async delete() {
    const store = readLocalMirror();
    if (store[this.collectionName] && store[this.collectionName][this.id]) {
      delete store[this.collectionName][this.id];
      writeLocalMirror(store);
    }
    await deleteDocFromSoufshopCloud(this.collectionName, this.id);
  }
}

interface FilterClause {
  field: string;
  op: string;
  value: unknown;
}

export class CloudSyncedCollectionQuery {
  private readonly collectionName: string;
  private readonly filters: FilterClause[];
  private orderField: string | null;
  private orderDir: 'asc' | 'desc';
  private maxLimit: number | null;

  constructor(
    collectionName: string,
    filters: FilterClause[] = [],
    orderField: string | null = null,
    orderDir: 'asc' | 'desc' = 'asc',
    maxLimit: number | null = null
  ) {
    this.collectionName = collectionName;
    this.filters = filters;
    this.orderField = orderField;
    this.orderDir = orderDir;
    this.maxLimit = maxLimit;
  }

  doc(docId?: string) {
    return new CloudSyncedDocRef(this.collectionName, docId);
  }

  async add(data: object) {
    const ref = new CloudSyncedDocRef(this.collectionName);
    await ref.set(data);
    return ref;
  }

  where(field: string, op: string, value: unknown) {
    return new CloudSyncedCollectionQuery(
      this.collectionName,
      [...this.filters, { field, op, value }],
      this.orderField,
      this.orderDir,
      this.maxLimit
    );
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
    return new CloudSyncedCollectionQuery(
      this.collectionName,
      this.filters,
      field,
      dir,
      this.maxLimit
    );
  }

  limit(n: number) {
    return new CloudSyncedCollectionQuery(
      this.collectionName,
      this.filters,
      this.orderField,
      this.orderDir,
      n
    );
  }

  async get(): Promise<CloudQuerySnapshot> {
    const store = readLocalMirror();
    const cloudCol = await fetchCollectionFromSoufshopCloud(this.collectionName);
    if (cloudCol !== null && Object.keys(cloudCol).length > 0) {
      store[this.collectionName] = {
        ...(store[this.collectionName] || {}),
        ...cloudCol,
      };
      writeLocalMirror(store);
    }

    const col = store[this.collectionName] || {};
    let entries = Object.entries(col).map(([id, data]) => ({
      id,
      exists: true,
      data: () => ({ ...data }),
      _raw: data,
    }));

    for (const f of this.filters) {
      if (f.op === '==') {
        entries = entries.filter((item) => item._raw[f.field] === f.value);
      }
    }

    if (this.orderField) {
      const field = this.orderField;
      const dir = this.orderDir;
      entries.sort((a, b) => {
        const va = String(a._raw[field] ?? '');
        const vb = String(b._raw[field] ?? '');
        return dir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb);
      });
    }

    if (this.maxLimit !== null && this.maxLimit > 0) {
      entries = entries.slice(0, this.maxLimit);
    }

    return {
      empty: entries.length === 0,
      docs: entries,
    };
  }
}

const soufshopCloudAdapter: CloudFirestoreAdapter = {
  collection(name: string) {
    return new CloudSyncedCollectionQuery(name);
  },
  batch() {
    const ops: Array<() => Promise<void>> = [];
    return {
      set(
        ref: CloudSyncedDocRef,
        data: object,
        options?: { merge?: boolean }
      ) {
        ops.push(() => ref.set(data, options));
      },
      update(ref: CloudSyncedDocRef, data: object) {
        ops.push(() => ref.update(data));
      },
      delete(ref: CloudSyncedDocRef) {
        ops.push(() => ref.delete());
      },
      async commit() {
        for (const op of ops) {
          await op();
        }
      },
    };
  },
};

export function getCloudFallbackDb(): CloudFirestoreAdapter {
  return soufshopCloudAdapter;
}

export function getAdminDb(): CloudFirestoreAdapter {
  return soufshopCloudAdapter;
}

export function getAdminAuth(): CloudAuthAdapter | null {
  return null;
}

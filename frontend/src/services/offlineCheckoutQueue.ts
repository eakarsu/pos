export type OfflineCheckoutEnvelope = {
  locationId: string;
  shiftId: string;
  workstationDeviceId: string;
  idempotencyKey: string;
  source: 'OFFLINE';
  offlineSequence: number;
  capturedAt: string;
  expectedTotalCents: number;
  expectedTaxProfileVersion: number;
  items: Array<{ productId: string; quantityMilliunits: number }>;
  tenders: Array<{ method: 'CASH'; amountCents: number }>;
};

type EncryptedRecord = { id: string; iv: ArrayBuffer; ciphertext: ArrayBuffer; createdAt: string };

const DB_NAME = 'elitepos-controlled-offline-v1';
const RECORDS = 'records';
const KEYS = 'keys';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function database(): Promise<IDBDatabase> {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    request.result.createObjectStore(RECORDS, { keyPath: 'id' });
    request.result.createObjectStore(KEYS);
  };
  return requestResult(request);
}

async function localKey(db: IDBDatabase): Promise<CryptoKey> {
  const transaction = db.transaction(KEYS, 'readwrite');
  const store = transaction.objectStore(KEYS);
  const existing = await requestResult(store.get('device-local-aes')) as CryptoKey | undefined;
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await requestResult(store.put(key, 'device-local-aes'));
  return key;
}

export async function enqueueOfflineCheckout(envelope: OfflineCheckoutEnvelope): Promise<void> {
  if (envelope.tenders.some((tender) => tender.method !== 'CASH')) throw new Error('Offline queue accepts cash only');
  const db = await database();
  const key = await localKey(db);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(envelope));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(envelope.workstationDeviceId) }, key, plaintext);
  const transaction = db.transaction(RECORDS, 'readwrite');
  await requestResult(transaction.objectStore(RECORDS).put({ id: envelope.idempotencyKey, iv: iv.buffer, ciphertext, createdAt: envelope.capturedAt } satisfies EncryptedRecord));
  db.close();
}

export async function pendingOfflineCheckouts(workstationDeviceId: string): Promise<OfflineCheckoutEnvelope[]> {
  const db = await database();
  const key = await localKey(db);
  const records = await requestResult(db.transaction(RECORDS).objectStore(RECORDS).getAll()) as EncryptedRecord[];
  const values: OfflineCheckoutEnvelope[] = [];
  for (const record of records) {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: record.iv, additionalData: new TextEncoder().encode(workstationDeviceId) }, key, record.ciphertext);
    values.push(JSON.parse(new TextDecoder().decode(plaintext)) as OfflineCheckoutEnvelope);
  }
  db.close();
  return values.sort((a, b) => a.offlineSequence - b.offlineSequence);
}

export async function removeOfflineCheckout(idempotencyKey: string): Promise<void> {
  const db = await database();
  await requestResult(db.transaction(RECORDS, 'readwrite').objectStore(RECORDS).delete(idempotencyKey));
  db.close();
}

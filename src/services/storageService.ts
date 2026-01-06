
const DB_NAME = 'ilovpdf_storage';
const DB_VERSION = 1;
const STORE_NAME = 'backgrounds';

export interface StoredBackground {
  id: string;
  blob: Blob;
  name: string;
  timestamp: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveBackground = async (file: File | Blob, name: string): Promise<string> => {
  const db = await openDB();
  const id = Math.random().toString(36).substring(2, 11);
  const item: StoredBackground = {
    id,
    blob: file instanceof File ? file : new Blob([file], { type: 'image/jpeg' }),
    name,
    timestamp: Date.now()
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(item);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

export const getBackgrounds = async (): Promise<StoredBackground[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteBackground = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};


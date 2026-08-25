const DB_NAME = "higiatrade-invoice-import";
const DB_VERSION = 1;
const STORE_NAME = "pendingInvoices";

export type StoredInvoiceFile = {
  key: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  blob: Blob;
};

export const invoiceFileKey = (file: File) => `${file.name}|${file.size}|${file.lastModified}`;

const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "key" });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const loadPendingInvoiceFiles = async (): Promise<File[]> => {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  try {
    const records = await new Promise<StoredInvoiceFile[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error);
    });
    return records
      .sort((a, b) => a.lastModified - b.lastModified)
      .map((record) => new File([record.blob], record.name, { type: record.type, lastModified: record.lastModified }));
  } finally {
    db.close();
  }
};

export const persistPendingInvoiceFiles = async (files: File[]) => {
  if (typeof indexedDB === "undefined" || !files.length) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      files.forEach((file) => store.put({
        key: invoiceFileKey(file),
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        blob: file,
      } satisfies StoredInvoiceFile));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

export const removePendingInvoiceFile = async (file: File) => {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(invoiceFileKey(file));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

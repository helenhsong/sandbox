/*
 * Slide images cut from Figma live here: in memory for this visit, and in IndexedDB so
 * a draft survives a reload (they're far too big for localStorage). Slides refer to
 * them as "idb:<key>".
 */

export const IMAGE_PREFIX = "idb:";

const DB_NAME = "deck-builder";
const STORE = "slide-images";
const memory = new Map<string, Blob>();

function openDb() {
  return new Promise<IDBDatabase>((done, fail) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => done(request.result);
    request.onerror = () => fail(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void) {
  const db = await openDb();
  return new Promise<T | undefined>((done, fail) => {
    const transaction = db.transaction(STORE, mode);
    const request = run(transaction.objectStore(STORE));
    transaction.oncomplete = () => {
      db.close();
      done(request ? request.result : undefined);
    };
    transaction.onerror = () => {
      db.close();
      fail(transaction.error);
    };
  });
}

export async function putImages(entries: Array<[string, Blob]>) {
  for (const [key, blob] of entries) memory.set(key, blob);
  try {
    await withStore("readwrite", (store) => {
      for (const [key, blob] of entries) store.put(blob, key);
    });
  } catch {
    // No IndexedDB (private window): images last until the tab closes.
  }
}

export async function getImages(keys: string[]) {
  const found = new Map<string, Blob>();
  const missing: string[] = [];
  for (const key of keys) {
    const blob = memory.get(key);
    if (blob) found.set(key, blob);
    else missing.push(key);
  }
  for (const key of missing) {
    try {
      const blob = await withStore<Blob>("readonly", (store) => store.get(key));
      if (blob) {
        memory.set(key, blob);
        found.set(key, blob);
      }
    } catch {
      break;
    }
  }
  return found;
}

/** Drops stored images no slide uses any more. */
export async function pruneImages(keep: string[]) {
  const keepSet = new Set(keep);
  for (const key of [...memory.keys()]) if (!keepSet.has(key)) memory.delete(key);
  try {
    const keys = ((await withStore<IDBValidKey[]>("readonly", (store) => store.getAllKeys())) ?? []) as string[];
    const stale = keys.filter((key) => !keepSet.has(key));
    if (stale.length) await withStore("readwrite", (store) => stale.forEach((key) => store.delete(key)));
  } catch {
    // Nothing to clean up.
  }
}

/** Keys of the stored images a list of slides refers to. */
export function imageKeys(slides: Array<{ kind: string; image?: string }>) {
  return slides.flatMap((slide) => (slide.kind === "figma" && slide.image?.startsWith(IMAGE_PREFIX) ? [slide.image.slice(IMAGE_PREFIX.length)] : []));
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((done, fail) => {
    const reader = new FileReader();
    reader.onload = () => done(reader.result as string);
    reader.onerror = () => fail(reader.error);
    reader.readAsDataURL(blob);
  });
}

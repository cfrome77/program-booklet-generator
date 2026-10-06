const DB_NAME = 'BookletAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'autosaveStore';
const AUTOSAVE_KEY = 'current_session';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Saves autosave session to IndexedDB with localStorage fallback.
 * @param {Object} data - { booklet, activePresetKey, timestamp }
 */
export async function saveAutosaveSession(data) {
  const record = {
    id: AUTOSAVE_KEY,
    booklet: data.booklet,
    activePresetKey: data.activePresetKey || 'custom',
    timestamp: data.timestamp || Date.now()
  };

  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
    return record;
  } catch (err) {
    // Fallback to localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`booklet_autosave_${AUTOSAVE_KEY}`, JSON.stringify(record));
        return record;
      }
    } catch (localErr) {
      console.warn('LocalStorage fallback failed:', localErr);
    }
    throw err;
  }
}

/**
 * Retrieves autosave session from IndexedDB with localStorage fallback.
 * @returns {Promise<Object|null>}
 */
export async function getAutosaveSession() {
  try {
    const db = await openDatabase();
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(AUTOSAVE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject(e.target.error);
    });

    if (result) return result;
  } catch (err) {
    // IndexedDB failed or unavailable, check fallback
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`booklet_autosave_${AUTOSAVE_KEY}`);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (localErr) {
    console.warn('LocalStorage fallback read failed:', localErr);
  }

  return null;
}

/**
 * Clears autosave session from IndexedDB and localStorage.
 */
export async function clearAutosaveSession() {
  let cleared = false;
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(AUTOSAVE_KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
    cleared = true;
  } catch (err) {
    // IndexedDB failed or unavailable
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`booklet_autosave_${AUTOSAVE_KEY}`);
      cleared = true;
    }
  } catch (localErr) {
    console.warn('LocalStorage remove failed:', localErr);
  }

  return cleared;
}

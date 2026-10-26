import { useSyncExternalStore } from "react";

/* Course progress, stored in localStorage under the same key the legacy
   static site used — so existing progress carries over. */

const KEY = "serverpath.progress.v1";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch (err) {
    return new Set();
  }
}

let snapshot = read();
const listeners = new Set();

function emit() {
  listeners.forEach(function (listener) { listener(); });
}

function write(next) {
  snapshot = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(next)));
  } catch (err) {
    /* private mode / storage blocked: progress just won't persist */
  }
  emit();
}

export const progressStore = {
  subscribe(listener) {
    listeners.add(listener);
    return function unsubscribe() { listeners.delete(listener); };
  },
  getSnapshot() {
    return snapshot;
  },
  getServerSnapshot() {
    return snapshot;
  },
  has(key) {
    return snapshot.has(key);
  },
  toggle(key) {
    const next = new Set(snapshot);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    write(next);
  },
  reset() {
    write(new Set());
  }
};

export function useProgress() {
  return useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot, progressStore.getServerSnapshot);
}

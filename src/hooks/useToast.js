import { useCallback, useState, useEffect } from "react";

let toastId = 0;
const listeners = new Set();

const toastManager = {
  toasts: [],
  maxToasts: 2,

  show(message) {
    const id = ++toastId;
    if (this.toasts.length >= this.maxToasts) {
      this.toasts.shift();
    }
    this.toasts.push({ id, message });
    this.notify();
    return id;
  },

  dismiss(id) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  },

  notify() {
    listeners.forEach(listener => listener([...this.toasts]));
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useToast() {
  return useCallback((message) => {
    toastManager.show(message);
  }, []);
}

export function useToastManager() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return {
    toasts,
    dismiss: (id) => toastManager.dismiss(id),
  };
}
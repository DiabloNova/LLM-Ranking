export const storageService = {
  getItem<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },

  setItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  }
};

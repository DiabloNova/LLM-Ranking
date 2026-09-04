export interface IDeduplicationStore {
  /**
   * Dedupes in-flight promises. Concurrent calls with the same key will wait and reuse the same active promise.
   */
  deduplicate<T>(key: string, action: () => Promise<T>): Promise<T>;
  hasInFlight(key: string): boolean;
  clearInFlight(): void;
}

export class InMemoryDeduplicationStore implements IDeduplicationStore {
  private inFlight = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, action: () => Promise<T>): Promise<T> {
    const activePromise = this.inFlight.get(key);
    if (activePromise) {
      return activePromise as Promise<T>;
    }

    const promise = action()
      .then((res) => {
        this.inFlight.delete(key);
        return res;
      })
      .catch((err) => {
        this.inFlight.delete(key); // Cleanup in-flight on failure so subsequent requests can retry
        throw err;
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  hasInFlight(key: string): boolean {
    return this.inFlight.has(key);
  }

  clearInFlight(): void {
    this.inFlight.clear();
  }
}

export class SafeLocalStorage {
  private _storage: Object;

  constructor() {
    this._storage = {};
  }

  public get length(): number {
    return Object.keys(this._storage).length;
  }

  public clear(): void {
    this._storage = {};
  }

  public getItem(key: string): string | null {
    return this._storage[key];
  }

  public key(index: number): string | null {
    return Object.keys(this._storage)[index];
  }

  public removeItem(key: string): void {
    delete this._storage[key];
  }

  public setItem(key: string, data: string): void {
    console.warn("Oops! Since localStorage isn't available in your browser, this data will not be persisted.");
    this._storage[key] = data;
  }
}
const safeStorage = new SafeLocalStorage();

export type LocalStorage = Storage | SafeLocalStorage;
export const safeLocalStorage: LocalStorage = (() => {
  try {
    const localStorage: Storage = window.localStorage;
    localStorage.setItem("mcTest", "mc");
    localStorage.getItem("mcTest");
    localStorage.removeItem("mcTest");
    return localStorage;
  } catch (e) {
    console.warn(
      "Oops! Looks like localStorage isn't available in your browser. Please update your browser settings to turn on localStorage."
    );
    return safeStorage;
  }
})();

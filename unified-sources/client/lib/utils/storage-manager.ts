import { safeLocalStorage } from "./safe-local-storage";

/**
 * A wrapper around `localStorage` that manages a common context object
 * for a given beacon.
 */
export class StorageManager {
  private _storageKey: string;

  constructor(userId: string | undefined, beaconName: string) {
    this._storageKey = !!userId ? `ac/${userId}/${beaconName}` : `ac/${beaconName}`;
  }

  /**
   * Get an object from a given key.
   */
  public getObject(key: string): any {
    return this._getContext()[key];
  }

  /**
   * Save object at the given key.
   */
  public saveObject(key: string, value: any) {
    const context = this._getContext();
    context[key] = value;
    this._saveContext(context);
  }

  /**
   * Get global context object from local storage.
   */
  private _getContext(): any {
    const context = safeLocalStorage.getItem(this._storageKey);
    return context ? JSON.parse(context) : {};
  }

  /**
   * Save the given context object to local storage.
   */
  private _saveContext(context: any) {
    safeLocalStorage.setItem(this._storageKey, JSON.stringify(context));
  }
}

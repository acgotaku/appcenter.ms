import { action } from "mobx";
import { difference, uniqueId } from "lodash";

/**
 * A class that represents a resource that can be fetched from an API.
 */
export abstract class Model<DeserializedT extends {}> {
  public clientId = uniqueId(this.constructor.name);
  /**
   * Instantiates a model, optionally with initial values.
   * @param initialValues A map of initial values to assign to the model upon creation.
   */
  constructor(initialValues?: Partial<DeserializedT>) {
    if (initialValues) {
      this.applyChanges(initialValues);
    }
  }

  /**
   * Called by `Store.update()` to apply client-side the same changes that
   * will be sent to the server to patch the resource. Override this method to add custom behavior.
   * @param changes The set of changes to apply to the resource.
   */
  @action
  public applyChanges(changes: Partial<DeserializedT>) {
    for (const key in changes) {
      ((this as any) as Partial<DeserializedT>)[key] = changes[key];
    }
  }

  /**
   * Called by `Store.update()` to undo an optimistic `applyChanges()` call
   * when the network request fails.
   * @param resourceCopy A shallow copy of the resource’s properties before changes were applied.
   * @param appliedChanges The set of changes that were applied that need to be reverted.
   */
  @action
  public revertChanges(resourceCopy: DeserializedT, appliedChanges: Partial<DeserializedT>) {
    const extraKeys = difference(Object.keys(appliedChanges), Object.keys(this));
    for (const key in resourceCopy) {
      ((this as any) as DeserializedT)[key] = resourceCopy[key];
    }
    extraKeys.forEach((key) => (this[key] = undefined));
  }
}

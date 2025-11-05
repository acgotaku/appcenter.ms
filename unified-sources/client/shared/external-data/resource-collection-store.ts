import { ObservableMap, computed, set, action, toJS } from "mobx";
import { identity, difference } from "lodash";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/lib/utils/external-data";

export enum UpdateMode {
  /**
   * Clears all the existing data and inserts the new resources from the server.
   * This is the fastest to process, but may result in unnecessary rerenders,
   * since MobX will treat all the data as new resources even if they haven’t changed.
   */
  Replace,
  /**
   * Like `Replace`, except that existing client resources are not removed. Resources
   * from the server will replace client resources with the same ids, or be inserted
   * if they do not yet exist on the client. This option is most useful for
   * fetching and appending an additional page of data where you know the incoming
   * resources are not yet present on the client.
   */
  Append,
  /**
   * Existing client resources will be updated with changes from the server, then
   * any new server resources will be inserted, and finally any client resources that
   * were not present in the server response will be deleted. This mode takes the
   * most iterations and operations to process, but ensures that nothing rerenders
   * unnecessarily by preserving referential equality of existing resources by id.
   * For example, if the dataset fetched from the server is deep-equal to the data
   * already on the client, no mutations will occur, so MobX will not trigger any
   * rerenders.
   */
  PreserveReplace,
  /**
   * Like `PreserveReplace`, except that the final step of deleting client resources
   * is skipped. This option will probably be rarely used; it’s useful only if
   * you want to append resources from the server to your existing client resources,
   * but you expect the incoming server resources to have some overlap with the
   * client resources. If you expect all the incoming resources to be new additions
   * to the client resources, use `Append` instead to save some array iterations.
   */
  PreserveAppend,
}

export interface LoadOptions<T> {
  /**
   * A transform function to run on each resource before storing.
   */
  transformEach?: (resource: T) => T;
  /**
   * The mode of reconciliation between the incoming server resources any existing
   * client resources.
   */
  updateMode?: UpdateMode;
}

export abstract class ResourceCollectionStore<T extends Object> extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<T[]> {
  protected abstract getResourceId(resource: T): string;
  public resources: ObservableMap<string, T> = new ObservableMap<string, T>();

  protected loadArray(
    dataPromise: Promise<T[]>,
    { transformEach = identity, updateMode = UpdateMode.PreserveReplace }: LoadOptions<T> = {}
  ) {
    dataPromise = dataPromise.then(
      action((resources: T[]) => {
        const serverResources = new ObservableMap<string, T>(
          resources.map<[string, T]>((r) => [this.getResourceId(r), transformEach(r)])
        );
        switch (updateMode) {
          case UpdateMode.Replace:
            this.resources.clear();
          case UpdateMode.Append:
            this.resources.merge(serverResources);
            break;

          case UpdateMode.PreserveReplace:
            const resourceIdsToDelete: string[] | undefined = difference(
              Array.from(this.resources.keys()),
              Array.from(serverResources.keys())
            );
          case UpdateMode.PreserveAppend:
            serverResources.forEach((resource, id) => {
              const clientResource = this.resources.get(id);
              if (clientResource) {
                set(clientResource, toJS(resource));
              } else {
                this.resources.set(this.getResourceId(resource), resource);
              }
            });

            if (resourceIdsToDelete) {
              resourceIdsToDelete.forEach((id) => this.resources.delete(id));
            }
        }

        return resources;
      })
    );
    this.data ? super.loadInBackgroundVoid(dataPromise) : super.loadVoid(dataPromise);
  }

  public get(id: string) {
    return this.resources.get(id);
  }

  @action
  public add(resource: T) {
    this.resources.set(this.getResourceId(resource), resource);
  }

  public update(id: string, changes: Partial<T>): void;
  public update(resource: T, changes: Partial<T>): void;
  @action
  public update(oldResourceorId: string | T, changes: Partial<T>) {
    let oldValue;
    if (typeof oldResourceorId === "string") {
      oldValue = this.resources.get(oldResourceorId);
    } else {
      oldValue = oldResourceorId;
    }
    set(oldValue, toJS(changes) as any); // toJS to make TS happy.
  }

  public remove(id: string): void;
  public remove(resource: T): void;
  @action
  public remove(resourceOrId: string | T) {
    if (typeof resourceOrId === "string") {
      this.resources.delete(resourceOrId);
    } else {
      this.resources.delete(this.getResourceId(resourceOrId));
    }
  }

  @computed
  public get resourceArray() {
    return Array.from(this.resources.values());
  }
}

import { IObservableValue, ObservableMap, observable, computed, action, reaction, intercept } from "mobx";
import { get, noop } from "lodash";
import { Model } from "./model";
import { AssociationStore, Association } from "./association-store";
import { ResourceRequest } from "./resource-request";

type KeysWhereValueExtends<T extends {}, ValueT> = {
  [K in keyof T]: T[K] extends ValueT ? K : never;
}[keyof T];

const PRODUCTION = process.env.NODE_ENV === "production";

/**
 * How to handle conflicts with existing resources in the cache. See each enumeration member for details.
 */
export enum FetchMode {
  /**
   * Clears all the existing data (or all the data in the specified segment) and
   * inserts the new resources from the server. This is the fastest to process, but
   * may result in unnecessary rerenders, since MobX will treat all the data as new
   * resources even if they haven’t changed.
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
   * any new server resources will be inserted, and finally any client resources
   * within the specified segment that were not present in the server response will
   * be deleted. This mode takes the most iterations and operations to process, but
   * ensures that nothing rerenders unnecessarily by preserving referential
   * equality of existing resources by id. For example, if the dataset fetched from
   * the server is deep-equal to the data already on the client, no mutations will
   * occur, so MobX will not trigger any rerenders.
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

export type ProxiedModel<DeserializedT extends {}> = DeserializedT extends unknown ? Model<DeserializedT> & DeserializedT : never;

export interface LoadOptions<DeserializedT extends {}, ModelT extends ProxiedModel<DeserializedT> = ProxiedModel<DeserializedT>> {
  /** The mode of reconciliation between the incoming server resources any existing client resources. */
  fetchMode?: FetchMode;
  /**
   * A filter function that specifies the segment of resources represented by the current query.
   * Used by `FetchMode.Replace` and `FetchMode.PreserveReplace` to know which resources should be deleted.
   */
  segmentFilter?: (model: ModelT) => boolean;
}

export interface ModelConstructor<DeserializedT extends {}, ModelT extends ProxiedModel<DeserializedT> = ProxiedModel<DeserializedT>> {
  new (initialValues?: Partial<DeserializedT>): ModelT;
}

/**
 * A store that manages CRUD operations and maintains a local collection for a single model type.
 */
export abstract class Store<
  DeserializedT extends {},
  SerializedT extends {} = DeserializedT,
  ModelT extends ProxiedModel<DeserializedT> = ProxiedModel<DeserializedT>,
  QueryT = any
> {
  private clientIdsById = new ObservableMap<string, string>();
  private data = new ObservableMap<string, ModelT>();

  private requests = {
    fetchCollection: observable.box(undefined) as IObservableValue<ResourceRequest<ModelT[], SerializedT[]> | undefined>,
    fetchOne: new ObservableMap<string, ResourceRequest<ModelT, SerializedT>>(),
    fetchRelationship: new ObservableMap<string, ResourceRequest<ModelT[], SerializedT[]>>(),
    create: new ObservableMap<string, ResourceRequest<ModelT, void | SerializedT>>(),
    update: new ObservableMap<string, ResourceRequest<ModelT, any>>(),
    delete: new ObservableMap<string, ResourceRequest<ModelT, any>>(),
  };

  /** The subclass of Model<T> to be used for the resource type. */
  protected abstract ModelClass: ModelConstructor<DeserializedT, ModelT>;
  /** Specifies what to use as a unique identifier for a serialized resource. The query from the API call is passed as the second argument. */
  protected abstract generateIdFromResponse(resource: SerializedT, query?: QueryT);
  /** Specifies how to get the unique identifier for a model. */
  protected abstract getModelId(model: ModelT): string | undefined;
  /** Specifies how to make an API call that will fetch a single resource by id. Called by `fetchOne()`, which passes its `id` and `query` arguments unchanged. */
  protected getResource(id: string, query?: QueryT): Promise<SerializedT> {
    throw new Error("Method not implemented");
  }
  /** Specifies how to make an API call that will fetch a single resource related to another model. Called by `fetchOneForRelationship()`, which passes its `foreignModel`, `foreignKey`, `foreignKeyValue`, and `query` arguments. */
  protected getResourceForRelationship<T extends {}>(
    foreignModel?: T,
    foreignKey?: keyof T,
    query?: QueryT
  ): Promise<SerializedT | null> {
    throw new Error("Method not implemented");
  }
  /** Specifies how to make an API call that will fetch multiple resources at once. Called by `fetchCollection()`, which passes its `query` argument unchanged. */
  protected getCollection<K extends keyof DeserializedT>(
    query?: QueryT,
    foreignKey?: K,
    foreignKeyValue?: DeserializedT[K]
  ): Promise<SerializedT[]> {
    throw new Error("Method not implemented");
  }
  /** Specifies how to make an API call that will create a resource. Called by `create()`, which passes its `resource` and `options` arguments unchanged. */
  protected postResource(resource: ModelT, options?: QueryT): Promise<SerializedT | void> {
    throw new Error("Method not implemented");
  }
  /** Specifies how to make an API call that will create multiple resources at once. Called by `createMany()`, which passes its `resources` and `options` arguments unchanged. */
  protected postResources(resources: ModelT[], options?: QueryT): Promise<SerializedT[] | void> {
    throw new Error("Method not implemented.");
  }
  /** Specifies how to make an API call that will update a resource. Called by `update()`, which passes its `resource` and `options` arguments unchanged. */
  protected patchResource(resource: ModelT, changes: Partial<DeserializedT>, options?: QueryT): Promise<any> {
    throw new Error("Method not implemented");
  }
  /** Specifies how to make an API call that will update multiple resources at once, after applying `changes` to each resource. Called by `updateMany()`, which passes its `resources`, `changes` and `options` arguments unchanged. */
  protected patchResources(resources: ModelT[], changes: Partial<DeserializedT>, options?: QueryT): Promise<any> {
    throw new Error("Method not implemented.");
  }
  /** Specifies how to make an API call that will update multiple resources at once, when `resources` includes changes. Called by `updateMany()`, which passes its `resources` and `options` arguments unchanged. */
  protected patchModifiedResources(resources: ModelT[], options?: QueryT): Promise<any> {
    throw new Error("Method not implemented.");
  }
  /** Specifies how to make an API call that will delete a resource. Called by `delete()`, which passes its `resource` and `options` arguments unchanged. */
  protected deleteResource(resource: ModelT, options?: QueryT): Promise<any> {
    throw new Error("Method not implemented");
  }
  /** Specifies how to make an API call that will delete multiple resources at once. Called by `deleteMany()`, which passes its `resources` and `options` arguments unchanged. */
  protected deleteResources(resources: ModelT[], options?: QueryT): Promise<any> {
    throw new Error("Method not implemented.");
  }
  /** Specifies how to transform a serialized resource (straight from the API) to the interface your model conforms to. Also passes the `query` or `options` parameter from the method that initiated the request. */
  protected abstract deserialize<K extends keyof DeserializedT>(
    serialized: SerializedT,
    queryOrOptions?: QueryT,
    foreignKey?: K,
    foreignKeyValue?: DeserializedT[K]
  ): DeserializedT | undefined;

  constructor() {
    reaction(() => this.getGlobalCacheKey(), this.clearCache);
  }

  /** Specifies an observable which, when changed, will clear all cached data and requests. */
  public getGlobalCacheKey(): any {
    return undefined;
  }

  /** Gets a single cached resource by id. */
  public get(id: string): ModelT | undefined;
  /** Gets a single cached resource by pieces of a compound key. */
  public get(...keyPieces: string[]): ModelT | undefined;
  public get(...keyPieces: string[]): ModelT | undefined {
    const clientId = this.clientIdsById.get(this.compoundKey(...keyPieces));
    return clientId ? this.data.get(clientId) : undefined;
  }

  /** Whether a resource by the given id exists in the store. */
  public has(id: string | undefined): boolean;
  /** Whether a resource by the given compound key exists in the store. */
  public has(...keyPieces: string[]): boolean;
  public has(...keyPieces: string[]): boolean {
    const clientId = this.clientIdsById.get(this.compoundKey(...keyPieces));
    return (clientId && this.data.has(clientId)) || false;
  }

  /** Gets all cached resources in the store with an association (in the given AssociationStore) to another resource, identified by `foreignKeyValue`. */
  public relatedTo<AssociationT extends Association>(
    foreignKeyValue: string,
    associationStore: AssociationStore<AssociationT>,
    additionalFilter: (assn: AssociationT) => boolean = () => true
  ) {
    return this.resources.filter((r) => {
      const association = associationStore.get(foreignKeyValue, this.getModelIdSafe(r));
      return association && additionalFilter(association);
    });
  }

  /** Concats individual string components of a compound key to form a single string key. */
  public compoundKey(...pieces: (string | undefined)[]): string {
    return pieces.join("/");
  }

  /** Splits a compound key into its individual pieces. */
  public splitKey(compoundKey: string): string[] {
    return compoundKey.split("/");
  }

  /** All cached resources as an array. Will never be null; no data results in an empty array. */
  @computed
  public get resources() {
    return Array.from(this.data.values());
  }

  /** Whether the resource cache is empty. */
  @computed
  public get isEmpty() {
    return this.data.size === 0;
  }

  /** Whether there is a pending request to fetch multiple resources by `fetchCollection()`. */
  @computed
  public get isFetchingCollection() {
    return (this.requests.fetchCollection.get() && this.requests.fetchCollection.get()!.isPending) || false;
  }

  /** Whether there is a pending request to fetch multiple resources by `fetchCollection()`. */
  @computed
  public get isCollectionFetchSucceeded() {
    return this.requests.fetchCollection.get()?.isLoaded || false;
  }

  /** The error object rejected by the last request made by `fetchCollection()`, if it exists. */
  @computed
  public get collectionFetchError() {
    return (this.requests.fetchCollection.get() && this.requests.fetchCollection.get()!.error) || null;
  }

  /** Whether the last request made by `fetchCollection()` resulted in an error. */
  @computed
  public get collectionFetchFailed() {
    return (this.requests.fetchCollection.get() && this.requests.fetchCollection.get()!.isFailed) || false;
  }

  // TODO: Make these helpers accept association store/foreignKey-value.
  /** Whether there is a pending request to fetch multiple resources by `fetchForRelationship()`. */
  public isFetchingRelationship(id: string): boolean;
  /** Whether there is a pending request to fetch multiple resources by `fetchForRelationship()`. */
  public isFetchingRelationship(...keyPieces: string[]): boolean;
  public isFetchingRelationship(...keyPieces: string[]): boolean {
    return this.requestIs(this.compoundKey(...keyPieces), "fetchRelationship", "isPending");
  }

  /** The error object rejected by the last request made by `fetchForRelationship()`, if it exists. */
  public relationshipsFetchError<ErrorT = Error>(id: string): ErrorT;
  /** The error object rejected by the last request made by `fetchForRelationship()`, if it exists. */
  public relationshipsFetchError<ErrorT = Error>(...keyPieces: string[]): ErrorT;
  public relationshipsFetchError<ErrorT = Error>(...keyPieces: string[]): ErrorT {
    return this.errorFor(this.compoundKey(...keyPieces), "fetchRelationship");
  }

  /** Whether the last request made by `fetchForRelationship()` resulted in an error. */
  public relationshipsFetchFailed(id: string): boolean;
  /** Whether the last request made by `fetchForRelationship()` resulted in an error. */
  public relationshipsFetchFailed(...keyPieces: string[]): boolean;
  public relationshipsFetchFailed(...keyPieces: string[]): boolean {
    return this.requestIs(this.compoundKey(...keyPieces), "fetchRelationship", "isFailed");
  }

  private requestIs(
    resourceOrId: ModelT | string,
    requestMap: "fetchOne" | "create" | "update" | "delete" | "fetchRelationship",
    property: "isPending" | "isFailed" | "isLoaded"
  ) {
    if (!resourceOrId) {
      return false;
    }
    const id = typeof resourceOrId === "string" ? resourceOrId : this.getModelIdSafe(resourceOrId);
    return get(this.requests[requestMap].get(id)!, property, false);
  }

  /** Whether a fetch request for a single resource made by `fetchOne()` is currently pending. */
  public isFetching(id: string): boolean;
  /** Whether a fetch request for a single resource made by `fetchOne()` is currently pending. */
  public isFetching(...keyPieces: string[]): boolean;
  /** Whether a fetch request for a single resource made by `fetchOne()` is currently pending. */
  public isFetching(resource: ModelT): boolean;
  public isFetching(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(resourceOrId, "fetchOne", "isPending");
  }

  /** Whether a creation request made by `create()` for the given resource or id is currently pending. */
  public isCreating(id: string): boolean;
  /** Whether a creation request made by `create()` for the given resource or id is currently pending. */
  public isCreating(...keyPieces: string[]): boolean;
  /** Whether a creation request made by `create()` for the given resource or id is currently pending. */
  public isCreating(resource: ModelT): boolean;
  public isCreating(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    if (!resourceOrIdOrKeyPieces[0]) {
      return false;
    }
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(this.getClientId(resourceOrId)!, "create", "isPending");
  }

  /** Whether an update request made by `update()` for the given resource or id is currently pending. */
  public isUpdating(id: string): boolean;
  /** Whether an update request made by `update()` for the given resource or id is currently pending. */
  public isUpdating(...keyPieces: string[]): boolean;
  /** Whether an update request made by `update()` for the given resource or id is currently pending. */
  public isUpdating(resource: ModelT): boolean;
  public isUpdating(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(resourceOrId, "update", "isPending");
  }

  /** Whether a deletion request made by `delete()` for the given resource or id is currently pending. */
  public isDeleting(id: string): boolean;
  /** Whether a deletion request made by `delete()` for the given resource or id is currently pending. */
  public isDeleting(...keyPieces: string[]): boolean;
  /** Whether a deletion request made by `delete()` for the given resource or id is currently pending. */
  public isDeleting(resource: ModelT): boolean;
  public isDeleting(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(resourceOrId, "delete", "isPending");
  }

  /** Whether the last fetch request for a single resource made by `fetchOne()` resulted in an error. */
  public fetchFailed(id: string): boolean;
  /** Whether the last fetch request for a single resource made by `fetchOne()` resulted in an error. */
  public fetchFailed(...keyPieces: string[]): boolean;
  /** Whether the last fetch request for a single resource made by `fetchOne()` resulted in an error. */
  public fetchFailed(resource: ModelT): boolean;
  public fetchFailed(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(resourceOrId, "fetchOne", "isFailed");
  }

  /** Whether the last update request made by `update()` resulted in an error. */
  public updateFailed(id: string): boolean;
  /** Whether the last update request made by `update()` resulted in an error. */
  public updateFailed(...keyPieces: string[]): boolean;
  /** Whether the last update request made by `update()` resulted in an error. */
  public updateFailed(resource: ModelT): boolean;
  public updateFailed(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(resourceOrId, "update", "isFailed");
  }

  /** Whether the last creation request made by `create()` resulted in an error. */
  public creationFailed(id: string): boolean;
  /** Whether the last creation request made by `create()` resulted in an error. */
  public creationFailed(...keyPieces: string[]): boolean;
  /** Whether the last creation request made by `create()` resulted in an error. */
  public creationFailed(resource: ModelT): boolean;
  public creationFailed(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    if (!resourceOrIdOrKeyPieces[0]) {
      return false;
    }
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(this.getClientId(resourceOrId)!, "create", "isFailed");
  }

  /** Whether the last deletion request made by `delete()` resulted in an error. */
  public deletionFailed(id: string): boolean;
  /** Whether the last deletion request made by `delete()` resulted in an error. */
  public deletionFailed(...keyPieces: string[]): boolean;
  /** Whether the last deletion request made by `delete()` resulted in an error. */
  public deletionFailed(resource: ModelT): boolean;
  public deletionFailed(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(resourceOrId, "delete", "isFailed");
  }

  /** Whether the last fetch request for a single resource made by `fetchOne()` succeeded.  */
  public fetchSucceeded(id: string): boolean;
  /** Whether the last fetch request for a single resource made by `fetchOne()` succeeded.  */
  public fetchSucceeded(...keyPieces: string[]): boolean;
  /** Whether the last fetch request for a single resource made by `fetchOne()` succeeded.  */
  public fetchSucceeded(resource: ModelT): boolean;
  public fetchSucceeded(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(resourceOrId, "fetchOne", "isLoaded");
  }

  /** Whether the last update request made by `update()` succeeded. */
  public updateSucceeded(id: string): boolean;
  /** Whether the last update request made by `update()` succeeded. */
  public updateSucceeded(...keyPieces: string[]): boolean;
  /** Whether the last update request made by `update()` succeeded. */
  public updateSucceeded(resource: ModelT): boolean;
  public updateSucceeded(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(resourceOrId, "update", "isLoaded");
  }

  /** Whether the last creation request made by `create()` succeeded. */
  public creationSucceeded(id: string): boolean;
  /** Whether the last creation request made by `create()` succeeded. */
  public creationSucceeded(...keyPieces: string[]): boolean;
  /** Whether the last creation request made by `create()` succeeded. */
  public creationSucceeded(resource: ModelT): boolean;
  public creationSucceeded(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    if (!resourceOrIdOrKeyPieces[0]) {
      return false;
    }
    const resourceOrId =
      typeof resourceOrIdOrKeyPieces[0] === "string"
        ? this.compoundKey(...(resourceOrIdOrKeyPieces as string[]))
        : (resourceOrIdOrKeyPieces[0] as ModelT);
    return this.requestIs(this.getClientId(resourceOrId)!, "create", "isLoaded");
  }

  /** Whether the last deletion request made by `delete()` succeeded. */
  public deletionSucceeded(id: string): boolean;
  /** Whether the last deletion request made by `delete()` succeeded. */
  public deletionSucceeded(...keyPieces: string[]): boolean;
  /** Whether the last deletion request made by `delete()` succeeded. */
  public deletionSucceeded(resource: ModelT): boolean;
  public deletionSucceeded(...resourceOrIdOrKeyPieces: (ModelT | string)[]) {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.requestIs(resourceOrId, "delete", "isLoaded");
  }

  private errorFor<ErrorT = Error>(
    resourceOrId: ModelT | string,
    requestMap: "fetchOne" | "create" | "update" | "delete" | "fetchRelationship"
  ): ErrorT {
    if (!resourceOrId) {
      return null as any;
    }
    const id = typeof resourceOrId === "string" ? resourceOrId : this.getModelIdSafe(resourceOrId);
    return get(this.requests[requestMap].get(id)!, "error", null) as any;
  }

  /** Gets the error object rejected by the last fetch request for a single resource made by `fetchOne()`, if it exists. */
  public fetchError<ErrorT = Error>(id: string): ErrorT;
  /** Gets the error object rejected by the last fetch request for a single resource made by `fetchOne()`, if it exists. */
  public fetchError<ErrorT = Error>(...keyPieces: string[]): ErrorT;
  /** Gets the error object rejected by the last fetch request for a single resource made by `fetchOne()`, if it exists. */
  public fetchError<ErrorT = Error>(resource: ModelT): ErrorT;
  public fetchError<ErrorT = Error>(...resourceOrIdOrKeyPieces: (ModelT | string)[]): ErrorT {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.errorFor(resourceOrId, "fetchOne");
  }

  /** Gets the error object rejected by the last creation request made by `create()`, if it exists. */
  public creationError<ErrorT = Error>(id: string): ErrorT;
  /** Gets the error object rejected by the last creation request made by `create()`, if it exists. */
  public creationError<ErrorT = Error>(...keyPieces: string[]): ErrorT;
  /** Gets the error object rejected by the last creation request made by `create()`, if it exists. */
  public creationError<ErrorT = Error>(resource: ModelT): ErrorT;
  public creationError<ErrorT = Error>(...resourceOrIdOrKeyPieces: (ModelT | string)[]): ErrorT {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    if (!resourceOrId) {
      return null as any;
    }
    return this.errorFor(this.getClientId(resourceOrId) as any, "create");
  }

  /** Gets the error object rejected by the last update request made by `update()`, if it exists. */
  public updateError<ErrorT = Error>(id: string): ErrorT;
  /** Gets the error object rejected by the last update request made by `update()`, if it exists. */
  public updateError<ErrorT = Error>(...keyPieces: string[]): ErrorT;
  /** Gets the error object rejected by the last update request made by `update()`, if it exists. */
  public updateError<ErrorT = Error>(resource: ModelT): ErrorT;
  public updateError<ErrorT = Error>(...resourceOrIdOrKeyPieces: (ModelT | string)[]): ErrorT {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.errorFor(resourceOrId, "update");
  }

  /** Gets the error object rejected by the last deletion request made by `delete()`, if it exists. */
  public deletionError<ErrorT = Error>(id: string): ErrorT;
  /** Gets the error object rejected by the last deletion request made by `delete()`, if it exists. */
  public deletionError<ErrorT = Error>(...keyPieces: string[]): ErrorT;
  /** Gets the error object rejected by the last deletion request made by `delete()`, if it exists. */
  public deletionError<ErrorT = Error>(resource: ModelT): ErrorT;
  public deletionError<ErrorT = Error>(...resourceOrIdOrKeyPieces: (ModelT | string)[]): ErrorT {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    return this.errorFor(resourceOrId, "delete");
  }

  /** Adds an existing resource to the cache collection without making an API call to create it on the server. */
  @action
  public add(resource: ModelT) {
    const clientId = resource.clientId;
    const id = this.getModelId(resource);
    // An existing resource by the same id should be removed first,
    // as resources are stored by clientId, it’s possible to accidentally
    // store two models by the same id.
    this.remove(id as any);
    if (id) {
      this.clientIdsById.set(id, clientId);
    }
    this.data.set(clientId, resource);
  }

  /** Removes an existing resource from the cache collection without making an API call to delete it from the server. Returns whether the resource actually in the store. */
  public remove(id: string): boolean;
  /** Removes an existing resource from the cache collection without making an API call to delete it from the server. Returns whether the resource actually in the store. */
  public remove(...keyPieces: string[]): boolean;
  /** Removes an existing resource from the cache collection without making an API call to delete it from the server. Returns whether the resource actually in the store. */
  public remove(resource: ModelT): boolean;
  @action
  public remove(...resourceOrIdOrKeyPieces: (ModelT | string)[]): boolean {
    const resourceOrId = this.getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces);
    const resource = typeof resourceOrId === "string" ? this.get(resourceOrId) : resourceOrId;
    if (resource) {
      this.clientIdsById.delete(resource.clientId);
      return this.data.delete(resource.clientId);
    }
    return false;
  }

  /**
   * Fetches a single resource using the provided definition for `getResource()`, then
   * stores it in the resource cache, or if one already exists in the cache, updates
   * the existing resource with any changes retrieved by the `getResource()` call.
   */
  @action
  public fetchOne(id: string, query?: QueryT) {
    const request = new ResourceRequest(
      this.getResource(id, query),
      () => this.get(id),
      (error, resource) => {
        if (error) {
          return;
        }

        const deserializedResource = this.deserialize(resource as any, query);
        if (!deserializedResource) {
          return;
        }

        const oldResource = this.get(id);
        if (oldResource) {
          oldResource.applyChanges(deserializedResource);
        } else {
          this.add(new this.ModelClass(deserializedResource));
        }
      }
    );

    this.requests.fetchOne.set(id, request as any);
    return request;
  }

  @action
  /**
   * Ensures that the collection of the resources is fetched
   */
  public ensureCollectionIsFetched() {
    const request = this.requests.fetchCollection.get();
    if (!request) return this.fetchCollection();
    return request;
  }

  /**
   * Fetches a collection of resources by calling `getCollection()`, then stores them
   * in the resource cache. How to handle conflicts with existing resources in the cache
   * can be customized with the `options` argument.
   * @param query An optional arbitrary query to pass to `getCollection()`.
   * @param options Allows for additional processing of each resource and specifying how to handle conflicts with existing resources. See each object member for additional JSDoc documentation.
   */
  @action
  public fetchCollection(
    query?: QueryT,
    { fetchMode = FetchMode.PreserveReplace, segmentFilter }: LoadOptions<DeserializedT, ModelT> = {}
  ) {
    const request = new ResourceRequest(
      this.getCollection(query),
      () => this.resources,
      (error, resources) => {
        if (error) {
          return;
        }

        if (fetchMode === FetchMode.Replace) {
          if (!segmentFilter) {
            this.data.clear();
          } else {
            const clientIdsToRemove: any[] = [];
            this.data.forEach((model, clientId) => {
              if (!segmentFilter(model)) {
                clientIdsToRemove.push(clientId);
              }
            });
            clientIdsToRemove.forEach((clientId) => this.data.delete(clientId));
          }
        }

        if (fetchMode === FetchMode.Replace || fetchMode === FetchMode.Append) {
          resources!.forEach((r) => {
            const deserializedResource = this.deserialize(r, query);
            if (!deserializedResource) {
              return;
            }
            this.add(new this.ModelClass(deserializedResource));
          });
        }

        if (fetchMode === FetchMode.PreserveReplace || fetchMode === FetchMode.PreserveAppend) {
          const idsToKeep: any[] = [];
          resources!.forEach((serializedResource) => {
            const deserializedResource = this.deserialize(serializedResource, query);
            if (!deserializedResource) {
              return;
            }
            const id = this.getId(serializedResource, query!);
            const existingModel = this.get(id!);
            idsToKeep.push(id);
            if (existingModel) {
              existingModel.applyChanges(deserializedResource);
            } else {
              this.add(new this.ModelClass(deserializedResource));
            }
          });

          if (fetchMode === FetchMode.PreserveReplace) {
            const modelsToRemove: any[] = [];
            this.data.forEach((model) => {
              const filter = segmentFilter || (() => true);
              if (!idsToKeep.includes(this.getModelId(model)) && filter(model)) {
                modelsToRemove.push(model);
              }
            });
            modelsToRemove.forEach((model) => this.remove(model));
          }
        }
      }
    );

    this.requests.fetchCollection.set(request);
    return request;
  }

  // TODO: After TS 2.8, restrict K to keys of DeserializedT which correspond to a string value.
  @action
  public fetchForRelationship<K extends keyof DeserializedT>(foreignKey: K, foreignKeyValue: DeserializedT[K], query?: QueryT) {
    const request = new ResourceRequest(
      this.getCollection(query, foreignKey, foreignKeyValue),
      // @ts-ignore
      () => this.resources.filter((r) => r[foreignKey] === foreignKeyValue),
      (error, resources) => {
        if (error) {
          return;
        }

        // TODO: dedupe this logic with fetchCollection
        const idsToKeep: any[] = [];
        resources!.forEach((serializedResource) => {
          const deserializedResource = this.deserialize(serializedResource, query, foreignKey, foreignKeyValue);
          if (!deserializedResource) {
            return;
          }
          const id = this.getId(serializedResource, query!);
          const existingModel = this.get(id!);
          idsToKeep.push(id!);
          deserializedResource[foreignKey] = foreignKeyValue; // Make the association
          if (existingModel) {
            existingModel.applyChanges(deserializedResource);
          } else {
            this.add(new this.ModelClass(deserializedResource));
          }
        });

        this.data.forEach((model) => {
          if (!idsToKeep.includes(this.getModelId(model))) {
            // Delete the association
            model[foreignKey] = null as any;
          }
        });
      }
    );

    this.requests.fetchRelationship.set(`${foreignKey.toString()}-${foreignKeyValue}`, request);
    return request;
  }

  @action
  public fetchOneForRelationship<T extends {}>(foreignModel: T, foreignKey: KeysWhereValueExtends<T, string | null>, query?: QueryT) {
    const request = new ResourceRequest(
      this.getResourceForRelationship(foreignModel, foreignKey, query),
      () => this.get((foreignModel[foreignKey] as any) as string),
      (error, data) => {
        if (error) {
          return;
        }

        if (data) {
          const id = this.generateIdFromResponse(data);
          const deserializedResource = this.deserialize(data, query);
          if (!deserializedResource) {
            foreignModel[foreignKey] = null as any;
            return;
          }
          const existingModel = this.get(id);
          if (existingModel) {
            existingModel.applyChanges(deserializedResource);
          } else {
            this.add(new this.ModelClass(deserializedResource));
          }
          foreignModel[foreignKey] = id;
        } else {
          foreignModel[foreignKey] = null as any;
        }
      }
    );

    return request;
  }

  @action
  public fetchForManyToMany<T extends Association>(associationStore: AssociationStore<T>, foreignKeyValue: string, query?: QueryT) {
    const request = new ResourceRequest(
      this.getCollection(query),
      () => this.resources.filter((r) => associationStore.contains(foreignKeyValue, this.getModelIdSafe(r))),
      (error, resources) => {
        if (error) {
          return;
        }

        const idsToKeep: any[] = [];
        resources!.forEach((serializedResource) => {
          const deserializedResource = this.deserialize(serializedResource, query);
          if (!deserializedResource) {
            return;
          }
          const id = this.getId(serializedResource, query!);
          const existingModel = this.get(id!);
          idsToKeep.push(id);
          const isLeft = this.ModelClass === associationStore.LeftClass;
          if (existingModel) {
            existingModel.applyChanges(deserializedResource);
            // Make the association
            associationStore.add(
              isLeft ? this.getModelIdSafe(existingModel) : foreignKeyValue,
              isLeft ? foreignKeyValue : this.getModelIdSafe(existingModel),
              serializedResource,
              query
            );
          } else {
            const newResource = new this.ModelClass(deserializedResource);
            this.add(newResource);
            // Make the association
            associationStore.add(
              isLeft ? this.getModelIdSafe(newResource) : foreignKeyValue,
              isLeft ? foreignKeyValue : this.getModelIdSafe(newResource),
              serializedResource,
              query
            );
          }
        });

        this.data.forEach((model) => {
          if (!idsToKeep.includes(this.getModelId(model))) {
            // Delete the association
            associationStore.remove(foreignKeyValue, this.getModelIdSafe(model));
          }
        });
      }
    );

    this.requests.fetchRelationship.set(`${associationStore.id}-${foreignKeyValue}`, request);
    return request;
  }

  /**
   * Creates a new resource by calling `postResource()`, then stores it in the cache.
   * @param resource The resource to make the creation request for and add to the cache.
   * @param optimistic Whether to add the resource optimistically to the cache before the request succeeds (removing it upon failure), or to wait until getting a successful response to add the resource.
   * @param options An optional arbitrary set of options to pass to `postResource()`.
   */
  @action
  public create(resource: ModelT, optimistic = true, options?: QueryT) {
    const clientId = this.getClientId(resource);
    if (optimistic) {
      this.add(resource);
    } else {
      const id = this.getModelId(resource);
      if (id) {
        this.clientIdsById.set(id, clientId!);
      }
    }

    const request = new ResourceRequest(
      this.postResource(resource, options),
      () => this.data.get(clientId!),
      (error, serialized) => {
        if (serialized) {
          const deserializedResource = this.deserialize(serialized, options);
          if (!deserializedResource && optimistic) {
            this.remove(resource);
            return;
          } else if (!deserializedResource && !optimistic) {
            return;
          }
          resource.applyChanges(deserializedResource!);
        }

        if (optimistic && error) {
          this.remove(resource);
        } else if (!optimistic && !error) {
          this.add(resource);
        }
      }
    );

    this.requests.create.set(clientId!, request as any);
    return request;
  }

  /**
   * Creates multiple resources by calling `postResources()`, then stores them in the cache.
   * @param resources The resources to make the creation request for and add to the cache.
   * @param optimistic Whether to add the resources optimistically to the cache before the request succeeds (removing them upon failure), or to wait until getting a successful response to add the resources.
   * @param options An optional arbitrary set of options to pass to `postResources()`.
   */
  @action
  public createMany(resources: ModelT[], optimistic = true, options?: QueryT) {
    if (optimistic) {
      resources.forEach((resource) => this.add(resource));
    }

    const request = new ResourceRequest(this.postResources(resources, options), noop, (error, serializedResources) => {
      if (serializedResources) {
        // We associate the resources we get from the server with resources in the store, but this association assumes the order of resources is the same in the server response and in the store. This assumption will not hold in all cases. Use at your own risk.
        serializedResources.forEach((serializedResource, index) => {
          const deserializedResource = this.deserialize(serializedResource, options);
          if (!deserializedResource && optimistic) {
            resources.forEach((resource) => this.remove(resource));
            return;
          } else if (!deserializedResource && !optimistic) {
            return;
          }
          resources[index].applyChanges(deserializedResource!);
          if (!optimistic && !error) {
            this.add(resources[index]);
          }
        });
      }

      if (optimistic && error) {
        resources.forEach((resource) => this.remove(resource));
      }
    });

    resources.forEach((resource) => {
      const clientId = this.getClientId(resource);
      // 'this.requests.create.set' expects a ResourceRequest whose getter returns an object of type 'ModelT'. The above ResourceRequest’s getter returns an object of type 'void', but otherwise has the correct properties (e.g. 'isPending') for all resources.
      const singleRequest = new ResourceRequest(request.promise, () => this.data.get(clientId!), noop);
      this.requests.create.set(clientId!, singleRequest as any);
    });
    return request;
  }

  /**
   * Updates a resource with a set of changes by calling `patchResource()`, then applies the changes to the cached resource.
   * @param resource The resource to update.
   * @param changes The set of changes to apply to the resource.
   * @param optimistic Whether to apply the changes optimistically before the request succeeds (unapplying them upon failure), or to wait until getting a successful response to update the resource.
   * @param options An optional arbitrary set of options to pass to `patchResource()`.
   */
  @action
  public update(resource: ModelT, changes: Partial<DeserializedT>, optimistic = true, options?: QueryT) {
    const id = this.getModelIdSafe(resource);
    if (!PRODUCTION && !this.has(id)) {
      throw new Error(
        "Invariant violation: Tried to update a resource that isn’t yet tracked by the store. " +
          "This is unsupported behavior; use `store.add()` to track a resource that wasn’t fetched " +
          "or created by the store."
      );
    }

    const resourceCopy = optimistic ? Object.assign({}, resource) : null;
    if (optimistic) {
      resource.applyChanges(changes);
    }

    const unsubscribe = PRODUCTION
      ? noop
      : intercept(resource, () => {
          throw new Error(
            "Invariant violation: Tried to mutate a resource in `patchResource()`. " +
              "`update()` will call `applyChanges()` on your model for you; don’t " +
              "mutate the resource or call `applyChanges()` manually."
          );
        });

    const request = new ResourceRequest(
      this.patchResource(resource, changes, options),
      () => this.get(id),
      (error) => {
        if (optimistic && error) {
          resource.revertChanges(resourceCopy!, changes);
        } else if (!optimistic && !error) {
          resource.applyChanges(changes);
        }
      }
    );

    unsubscribe();
    this.requests.update.set(id, request as any);
    return request;
  }

  /**
   * Updates multiple resources with a set of changes by calling `patchResources()`, then applies the changes to the cached resources.
   * @param resources The resources to update.
   * @param config A set of options to modify the behavior of `updateMany()`:
   * - `changes` The set of changes to apply to each of the resources.
   * - `optimistic` Whether to apply the changes optimistically before the request succeeds (unapplying them upon failure), or to wait until getting a successful response to update the resources.
   * - `options` An optional arbitrary set of options to pass to `patchResources()`.
   */
  @action
  public updateMany(
    resources: ModelT[],
    config?: { changes: Partial<DeserializedT>; optimistic?: boolean; options?: QueryT } | { options?: QueryT }
  ): ResourceRequest<void> {
    // @ts-ignore. [Should fix it in the future] Strict error.
    const { changes, optimistic = true, options } = "changes" in config ? config : { changes: null, options: config.options };
    const resourceCopies = optimistic ? resources.map((resource) => Object.assign({}, resource)) : null;
    if (optimistic) {
      resources.forEach((resource) => resource.applyChanges(changes!));
    }

    const promise = changes ? this.patchResources(resources, changes, options) : this.patchModifiedResources(resources, options);
    const request = new ResourceRequest(promise, noop, (error) => {
      if (optimistic && error) {
        resources.forEach((resource, index) => resource.revertChanges(resourceCopies![index], changes!));
      } else if (!optimistic && !error && changes) {
        resources.forEach((resource) => resource.applyChanges(changes));
      }
    });

    resources.forEach((resource) => {
      const clientId = this.getModelIdSafe(resource);
      const singleRequest = new ResourceRequest(request.promise, () => this.data.get(clientId), noop);
      this.requests.update.set(clientId, singleRequest as any);
    });
    return request;
  }

  /**
   * Deletes a resource by calling `deleteResource()`, then removes it from the cache.
   * @param id The id of the resource to make the deletion request for and remove from the cache.
   * @param resource The resource to make the deletion request for and remove from the cache.
   * @param optimistic Whether to remove the resource optimistically from the cache before the request succeeds (adding it back upon failure), or to wait until getting a successful response to remove the resource.
   * @param options An optional arbitrary set of options to pass to `deleteResource()`.
   */
  public delete(id: string, optimistic?: boolean, options?: QueryT): ResourceRequest<void>;
  public delete(resource: ModelT, optimistic?: boolean, options?: QueryT): ResourceRequest<void>;
  @action
  public delete(resourceOrId: ModelT | string, optimistic = true, options?: QueryT): ResourceRequest<void> {
    const [resource, id] =
      typeof resourceOrId === "string" ? [this.get(resourceOrId), resourceOrId] : [resourceOrId, this.getModelIdSafe(resourceOrId)];

    if (!PRODUCTION && !this.has(id)) {
      throw new Error(
        "Invariant violation: Tried to delete a resource that isn’t yet tracked by the store. " +
          "This is unsupported behavior; use `store.add()` to track a resource that wasn’t fetched " +
          "or created by the store."
      );
    }

    if (optimistic) {
      this.remove(id);
    }

    const request = new ResourceRequest(
      this.deleteResource(resource as any, options),
      () => null,
      (error) => {
        if (optimistic && error) {
          this.add(resource as any);
        } else if (!optimistic && !error) {
          this.remove(id);
        }
      }
    );

    this.requests.delete.set(id, request as any);
    return request as any;
  }

  /**
   * Deletes multiple resources by calling `deleteResources()`, then removes them from the cache.
   * @param ids A collection of ids of resources to make the deletion request for and remove from the cache.
   * @param resources The resources to make the deletion request for and remove from the cache.
   * @param optimistic Whether to remove the resources optimistically from the cache before the request succeeds (adding it back upon failure), or to wait until getting a successful response to remove the resources.
   * @param options An optional arbitrary set of options to pass to `deleteResources()`.
   */
  public deleteMany(ids: string[], optimistic?: boolean, options?: QueryT): ResourceRequest<void>;
  public deleteMany(resources: ModelT[], optimistic?: boolean, options?: QueryT): ResourceRequest<void>;
  @action
  public deleteMany(resourcesOrIds: string[] | ModelT[], optimistic = true, options?: QueryT): ResourceRequest<void> {
    const resources = (typeof resourcesOrIds[0] === "string"
      ? (resourcesOrIds as string[]).map((id) => this.get(id))
      : resourcesOrIds) as ModelT[];

    if (optimistic) {
      resources.forEach((resource) => this.remove(resource));
    }

    const request = new ResourceRequest(
      this.deleteResources(resources, options),
      () => null,
      (error) => {
        if (optimistic && error) {
          resources.forEach((resource) => this.add(resource));
        } else if (!optimistic && !error) {
          resources.forEach((resource) => this.remove(resource));
        }
      }
    );

    resources.forEach((resource) => {
      const clientId = this.getModelIdSafe(resource);
      this.requests.delete.set(clientId, request as any);
    });
    return request as any;
  }

  @action
  public deleteRelationship(resourceOrId: ModelT | string, foreignKey: keyof DeserializedT, optimistic?: boolean, options?: QueryT) {
    const [resource, id] =
      typeof resourceOrId === "string" ? [this.get(resourceOrId), resourceOrId] : [resourceOrId, this.getModelIdSafe(resourceOrId)];
    const foreignKeyValue = resource![foreignKey];

    if (!PRODUCTION && !this.has(id)) {
      throw new Error(
        "Invariant violation: Tried to delete a resource that isn’t yet tracked by the store. " +
          "This is unsupported behavior; use `store.add()` to track a resource that wasn’t fetched " +
          "or created by the store."
      );
    }

    if (optimistic) {
      resource![foreignKey] = null as any;
    }

    const request = new ResourceRequest(
      this.deleteResource(resource!, options),
      () => null,
      (error) => {
        if (optimistic && error) {
          resource![foreignKey] = foreignKeyValue;
        } else if (!optimistic && !error) {
          resource![foreignKey] = null as any;
        }
      }
    );

    this.requests.delete.set(id, request as any);
    return request;
  }

  @action
  private clearCache = () => {
    this.data.clear();
    this.clientIdsById.clear();
    this.requests.fetchCollection.set(null as any);
    this.requests.fetchOne.clear();
    this.requests.create.clear();
    this.requests.update.clear();
    this.requests.delete.clear();
  };

  private getId(resourceOrModel: SerializedT | ModelT, query: QueryT): string | undefined {
    if (resourceOrModel instanceof this.ModelClass) {
      return this.getModelIdSafe(resourceOrModel as ModelT);
    }

    return this.verifyStringId(this.generateIdFromResponse(resourceOrModel as SerializedT, query));
  }

  private getClientId(modelOrId: string | ModelT): string | undefined {
    const model = typeof modelOrId === "string" ? this.get(modelOrId) : modelOrId;
    if (model) {
      return model.clientId;
    } else if (typeof modelOrId === "string") {
      return this.clientIdsById.get(modelOrId);
    }
  }

  private verifyStringId(id: string | undefined): string | undefined {
    if (!PRODUCTION && id !== undefined && typeof id !== "string") {
      throw new Error(
        `Model of type \`${this.ModelClass.name}\` with id \`${id}\` had id of type ` +
          `${typeof id} rather than string. Only string ids are supported. Check your ` +
          `\`deserialize()\` and \`getModelId()\` methods, type definitions for serilized ` +
          `and deserialized model interfaces, and API responses to ensure ids are saved as strings.`
      );
    }

    return id;
  }

  private getModelIdSafe(model: ModelT): string {
    return this.verifyStringId(this.getModelId(model)) as any;
  }

  private getResourceOrIdFromRestParams(resourceOrIdOrKeyPieces: (ModelT | string)[]): ModelT | string {
    return typeof resourceOrIdOrKeyPieces[0] === "string"
      ? this.compoundKey(...(resourceOrIdOrKeyPieces as string[]))
      : (resourceOrIdOrKeyPieces[0] as ModelT);
  }
}

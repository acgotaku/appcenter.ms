import { observable, ObservableMap, action, intercept } from "mobx";
import { uniqueId, noop, get } from "lodash";
import { ResourceRequest } from "./resource-request";
import { Model } from "@root/data/lib/model";

export class Association<AssociationResponseT = any, QueryT = any> extends Model<any> {
  constructor(public leftKey: string, public rightKey: string) {
    super({});
  }
  public setMetaInfo(associationResponse?: AssociationResponseT, options?: QueryT) {
    return;
  }
}

export interface AssociationConstructor<T extends Association = Association, AssociationResponseT = any, QueryT = any> {
  new (leftKey: string, rightKey: string, associationResponse?: AssociationResponseT, options?: QueryT): T;
}

export abstract class AssociationStore<T extends Association = Association, AssociationResponseT = any, QueryT = any> {
  private readonly associations = observable.map<string, T>({}, { deep: false });
  private readonly requests = {
    update: new ObservableMap<string, ResourceRequest<T, AssociationResponseT>>(),
    associate: new ObservableMap<string, ResourceRequest<T, AssociationResponseT>>(),
    disassociate: new ObservableMap<string, ResourceRequest<void>>(),
  };

  public abstract LeftClass: { new (...args: any[]): Model<any> };
  protected abstract AssociationClass: AssociationConstructor<T, AssociationResponseT>;
  protected associateResources(leftKey: string, rightKey: string, options?: QueryT): Promise<AssociationResponseT> {
    throw new Error("Method not implemented");
  }
  protected associateManyResources(leftKey: string, rightKeys: string[], options?: QueryT): Promise<AssociationResponseT[]> {
    throw new Error("Method not implemented");
  }
  protected disassociateResources(leftKey: string, rightKey: string, options?: QueryT): Promise<void> {
    throw new Error("Method not implemented");
  }
  protected disassociateManyResources(leftKey: string, rightKeys: string[], options?: QueryT): Promise<void> {
    throw new Error("Method not implemented");
  }
  protected patchAssociation(association: T, changes: Partial<T>, boolean, options?: QueryT): Promise<AssociationResponseT> {
    throw new Error("Method not implemented");
  }

  public id = uniqueId(`AssociationStore-`);

  private associationKey(leftKey: string, rightKey: string) {
    return `${leftKey}-${rightKey}`;
  }

  public get(leftKey: string, rightKey: string) {
    return this.associations.get(this.associationKey(leftKey, rightKey));
  }

  public isDisassociating(leftKey: string, rightKey: string) {
    const request = this.requests.disassociate.get(this.associationKey(leftKey, rightKey))!;
    const isPendingKey: keyof typeof request = "isPending"; // Reasonably good type checking for magic string usage with `get`
    return get(request, isPendingKey, false);
  }

  public disassociationFailed(leftKey: string, rightKey: string) {
    const request = this.requests.disassociate.get(this.associationKey(leftKey, rightKey))!;
    const isFailedKey: keyof typeof request = "isFailed"; // Reasonably good type checking for magic string usage with `get`
    return get(request, isFailedKey, false);
  }

  public disassociationSucceeded(leftKey: string, rightKey: string) {
    const request = this.requests.disassociate.get(this.associationKey(leftKey, rightKey))!;
    const isLoadedKey: keyof typeof request = "isLoaded"; // Reasonably good type checking for magic string usage with `get`
    return get(request, isLoadedKey, false);
  }

  public disassociationError<ErrorT = Error>(leftKey: string, rightKey: string): ErrorT {
    const request = this.requests.disassociate.get(this.associationKey(leftKey, rightKey))!;
    const errorKey: keyof typeof request = "error"; // Reasonably good type checking for magic string usage with `get`
    return get(request, errorKey, null) as any;
  }

  public isAssociating(leftKey: string, rightKey: string) {
    const request = this.requests.associate.get(this.associationKey(leftKey, rightKey))!;
    const isPendingKey: keyof typeof request = "isPending"; // Reasonably good type checking for magic string usage with `get`
    return get(request, isPendingKey, false);
  }

  public associationFailed(leftKey: string, rightKey: string) {
    const request = this.requests.associate.get(this.associationKey(leftKey, rightKey))!;
    const isFailedKey: keyof typeof request = "isFailed"; // Reasonably good type checking for magic string usage with `get`
    return get(request, isFailedKey, false);
  }

  public associationSucceeded(leftKey: string, rightKey: string) {
    const request = this.requests.associate.get(this.associationKey(leftKey, rightKey))!;
    const isLoadedKey: keyof typeof request = "isLoaded"; // Reasonably good type checking for magic string usage with `get`
    return get(request, isLoadedKey, false);
  }

  public associationError<ErrorT = Error>(leftKey: string, rightKey: string): ErrorT {
    const request = this.requests.associate.get(this.associationKey(leftKey, rightKey))!;
    const errorKey: keyof typeof request = "error"; // Reasonably good type checking for magic string usage with `get`
    return get(request, errorKey, null) as any;
  }

  public isUpdating(leftKey: string, rightKey: string) {
    const request = this.requests.update.get(this.associationKey(leftKey, rightKey))!;
    const isPendingKey: keyof typeof request = "isPending"; // Reasonably good type checking for magic string usage with `get`
    return get(request, isPendingKey, false);
  }

  public updateFailed(leftKey: string, rightKey: string) {
    const request = this.requests.update.get(this.associationKey(leftKey, rightKey))!;
    const isFailedKey: keyof typeof request = "isFailed"; // Reasonably good type checking for magic string usage with `get`
    return get(request, isFailedKey, false);
  }

  public updateSucceeded(leftKey: string, rightKey: string) {
    const request = this.requests.update.get(this.associationKey(leftKey, rightKey))!;
    const isLoadedKey: keyof typeof request = "isLoaded"; // Reasonably good type checking for magic string usage with `get`
    return get(request, isLoadedKey, false);
  }

  public updateError<ErrorT = Error>(leftKey: string, rightKey: string): ErrorT {
    const request = this.requests.update.get(this.associationKey(leftKey, rightKey))!;
    const errorKey: keyof typeof request = "error"; // Reasonably good type checking for magic string usage with `get`
    return get(request, errorKey, null) as any;
  }

  @action
  public add(leftKey: string, rightKey: string, associationResponse?: AssociationResponseT, options?: QueryT) {
    const association = this.get(leftKey, rightKey) || new this.AssociationClass(leftKey, rightKey);
    if (associationResponse) {
      association.setMetaInfo(associationResponse, options);
    }
    this.associations.set(this.associationKey(leftKey, rightKey), association);
  }

  @action
  public remove(leftKey: string, rightKey: string) {
    this.associations.delete(this.associationKey(leftKey, rightKey));
  }

  public contains(leftKey: string, rightKey: string): boolean {
    return this.associations.has(this.associationKey(leftKey, rightKey));
  }

  @action
  public associate(leftKey: string, rightKey: string, optimistic = true, options?: QueryT) {
    if (optimistic) {
      this.add(leftKey, rightKey);
    }

    const request = new ResourceRequest(
      this.associateResources(leftKey, rightKey, options),
      () => this.get(leftKey, rightKey),
      (error, data) => {
        if (optimistic && error) {
          this.remove(leftKey, rightKey);
        } else if (optimistic && !error) {
          const association = this.get(leftKey, rightKey);
          if (association) {
            association.setMetaInfo(data, options);
          }
        } else if (!optimistic && !error) {
          this.add(leftKey, rightKey, data!, options);
        }
      }
    );

    this.requests.associate.set(this.associationKey(leftKey, rightKey), request as any);
    return request;
  }

  @action
  public associateMany(leftKey: string, rightKeys: string[], optimistic = true, options?: QueryT) {
    if (optimistic) {
      rightKeys.forEach((rightKey) => this.add(leftKey, rightKey));
    }

    const request = new ResourceRequest(this.associateManyResources(leftKey, rightKeys, options), noop, (error, response) => {
      if (optimistic && error) {
        rightKeys.forEach((rightKey) => this.remove(leftKey, rightKey));
      } else if (!optimistic && !error) {
        rightKeys.forEach((rightKey, index) => this.add(leftKey, rightKey, response![index], options));
      }
    });

    rightKeys.forEach((rightKey) => {
      // 'this.requests.associate.set' expects a ResourceRequest whose getter returns an object of type 'T'. The above ResourceRequest’s getter returns an object of type 'void', but otherwise has the correct properties (e.g. 'isPending') for all resources.
      const singleRequest = new ResourceRequest(request.promise, () => this.get(leftKey, rightKey), noop);
      this.requests.associate.set(this.associationKey(leftKey, rightKey), singleRequest as any);
    });
    return request;
  }

  @action
  public disassociate(leftKey: string, rightKey: string, optimistic = true, options?: QueryT) {
    if (optimistic) {
      this.remove(leftKey, rightKey);
    }

    const request = new ResourceRequest(this.disassociateResources(leftKey, rightKey, options), noop, (error) => {
      if (optimistic && error) {
        this.add(leftKey, rightKey);
      } else if (!optimistic && !error) {
        this.remove(leftKey, rightKey);
      }
    });

    this.requests.disassociate.set(this.associationKey(leftKey, rightKey), request);
    return request;
  }

  @action
  public disassociateMany(leftKey: string, rightKeys: string[], optimistic = true, options?: QueryT) {
    if (optimistic) {
      rightKeys.forEach((rightKey) => this.remove(leftKey, rightKey));
    }

    const request = new ResourceRequest(this.disassociateManyResources(leftKey, rightKeys, options), noop, (error) => {
      if (optimistic && error) {
        rightKeys.forEach((rightKey) => this.add(leftKey, rightKey));
      } else if (!optimistic && !error) {
        rightKeys.forEach((rightKey) => this.remove(leftKey, rightKey));
      }
    });

    rightKeys.forEach((rightKey) => this.requests.disassociate.set(this.associationKey(leftKey, rightKey), request));
    return request;
  }

  @action
  public updateAssociation(leftKey: string, rightKey: string, changes: Partial<T>, optimistic?: boolean, options?: QueryT) {
    const association = this.get(leftKey, rightKey);
    const associationCopy = optimistic ? Object.assign({}, association) : null;
    if (optimistic) {
      association!.applyChanges(changes);
    }

    const unsubscribe =
      process.env.NODE_ENV === "production"
        ? noop
        : intercept(association!, () => {
            throw new Error(
              "Invariant violation: Tried to mutate a resource in `patchResource()`. " +
                "`update()` will call `applyChanges()` on your model for you; don’t " +
                "mutate the resource or call `applyChanges()` manually."
            );
          });

    const request = new ResourceRequest(
      this.patchAssociation(association!, changes, options),
      () => this.get(leftKey, rightKey),
      (error) => {
        if (optimistic && error) {
          association!.revertChanges(associationCopy, changes);
        } else if (!optimistic && !error) {
          association!.applyChanges(changes);
        }
      }
    );

    unsubscribe();
    this.requests.update.set(this.associationKey(leftKey, rightKey), request as any);
    return request;
  }

  public getAllAssociationsForLeftKey(leftKey: string | undefined) {
    return Array.from(this.associations.entries()).reduce((values, entry) => {
      if (entry[0].startsWith(`${leftKey}-`)) {
        return [...values, entry[1]];
      }
      return values;
    }, [] as T[]);
  }
}

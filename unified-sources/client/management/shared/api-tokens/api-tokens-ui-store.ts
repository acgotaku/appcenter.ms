import { observable, action, computed, IObservableArray } from "mobx";
import { sortBy } from "lodash";
import { APIToken, UserAPITokenStore, AppAPITokenStore, SerializedAPIToken } from "@root/data/management";
import { locationStore, notificationStore } from "@root/stores";
import { FetchError } from "@root/lib/http/fetch-error";
import { NotificationType } from "@root/shared";

const deletionErrorMessages = {
  one: "Deleting API token failed. Please try again later.",
  some: "Some of the API tokens could not be deleted. Please try again later.",
  all: "None of the API tokens could be deleted. Please try again later.",
};

export class APITokensUIStore {
  private readonly deletingIds: IObservableArray<any> = observable.array([], { deep: false });
  @observable public isDialogVisible = false;
  @observable public newToken!: APIToken;

  private readonly store: UserAPITokenStore | AppAPITokenStore;
  public readonly creatableScopes: SerializedAPIToken["scope"];

  constructor(store: UserAPITokenStore | AppAPITokenStore, creatableScopes: SerializedAPIToken["scope"]) {
    this.store = store;
    this.creatableScopes = creatableScopes;
  }

  public get tokens() {
    return sortBy(this.store.resources, "createdAt");
  }

  public fetch() {
    this.store.fetchCollection();
  }

  @action
  public beginCreatingToken() {
    this.newToken = new APIToken();
  }

  @action
  public updateToken = (changes: Partial<APIToken>) => {
    this.newToken.applyChanges(changes);
  };

  @action dismissDialog = () => {
    this.isDialogVisible = false;
  };

  @computed
  get isEmpty() {
    return !this.store.isFetchingCollection && this.store.isEmpty;
  }

  @computed
  get isCreating() {
    return this.store.isCreating(this.newToken);
  }

  get isFetching() {
    return this.store.isFetchingCollection;
  }

  @computed
  public get notification(): { type: NotificationType.Error; message: string } | any {
    if (this.store.collectionFetchFailed) {
      return {
        type: NotificationType.Error,
        message: this.store.collectionFetchError!.message,
      };
    }

    const failedDeletionsCount = this.deletingIds.filter((id) => this.store.deletionFailed(id)).length;
    if (failedDeletionsCount) {
      const message = (() => {
        switch (true) {
          case failedDeletionsCount === 1:
            return deletionErrorMessages.one;
          case failedDeletionsCount === this.deletingIds.length:
            return deletionErrorMessages.all;
          default:
            return deletionErrorMessages.some;
        }
      })();

      return {
        type: NotificationType.Error,
        message,
      };
    }
  }

  @computed
  public get creationNotification(): { type: NotificationType.Error; message: string } | any {
    if (this.store.creationFailed(this.newToken)) {
      return {
        type: NotificationType.Error,
        message: (() => {
          switch (this.store.creationError<FetchError>(this.newToken).status) {
            case 400:
              return "Something isn’t right about the data used to create this API token.";
            case 409:
              return "An API token of this name already exists. Please select a different name.";
            default:
              return "Creating API token failed. Please try again later.";
          }
        })(),
      };
    }
  }

  @computed
  public get formValidationErrors() {
    const creationError = this.store.creationError<FetchError>(this.newToken);
    if (creationError && creationError.status) {
      return {
        name: this.creationNotification,
      };
    }
  }

  /**
   * Handles batch delete by mapping the tokenIds and calling deleteToken to delete individual API tokens.
   * Currently batch delete is not supported at API level and is handled on the client side.
   */
  @action
  public deleteTokens = (tokens: APIToken[]) => {
    this.deletingIds.clear();
    tokens.forEach((token) => {
      this.deletingIds.push(token.id);
      this.store.delete(token);
    });
  };

  @action
  public finishCreatingToken = () => {
    this.store
      .create(this.newToken, false)
      .onSuccess(() => {
        this.isDialogVisible = true;
        locationStore.goUp();
      })
      .onFailure((error) => {
        notificationStore.notify({
          persistent: false,
          message: error?.message ?? "Unhandled error",
        });
      });
  };
}

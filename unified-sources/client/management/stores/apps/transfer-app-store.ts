import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState, NotificationType } from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { observable, action, runInAction, computed } from "mobx";
import { FetchError } from "../../../lib/http/fetch-error";
import { appStore, locationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { notify } from "../../../stores/notification-store";
import { API } from "../../constants/api";
import { INotificationMessage, ERROR_CODES } from "../../constants/constants";
import * as memoize from "memoizee";
import { logger } from "@root/lib/telemetry/logger";
import { IAHBranchConfiguration } from "@root/data/build";
import { IAHBranchStatus } from "@root/data/build/models/types";
import { ciStore } from "../../../build/stores/ci-store";
import { ConfigureStore } from "@root/build/stores/configure-store";

export class TransferAppStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IApp> {
  @observable public isConfirmationDialogVisible: boolean = false;
  @observable public newOwnerName!: string;

  constructor(private app: IApp) {
    super(ExternalDataState.Idle);
  }

  @action
  public resetState(): void {
    this.setState(ExternalDataState.Idle);
  }

  @action
  public showTransferConfirmationDialog(): void {
    this.isConfirmationDialogVisible = true;
  }

  @action
  public hideTransferConfirmationDialog(): void {
    this.isConfirmationDialogVisible = false;
  }

  @action
  public setNewOwnerName(name: string): void {
    this.newOwnerName = name;
  }

  @computed
  get notification(): INotificationMessage {
    const error = this.error as FetchError;
    switch (this.state) {
      case ExternalDataState.Failed:
        return {
          type: NotificationType.Error,
          message: ((error) => {
            switch (error.status) {
              case 403:
                switch (error.code) {
                  case ERROR_CODES.MUST_BE_APP_OWNER_TO_TRANSFER:
                    return "Oops. You need to be the app owner to transfer this app.";
                  case ERROR_CODES.MUST_BE_ORG_ADMIN_TO_TRANSFER:
                    return "Oops. You need be an administrator of the destination Organization in order to transfer this app.";
                  default:
                    return "Oops. You're not allowed to transfer this app.";
                }
              case 404:
                return "Oops. We couldn't find this app.";
              case 400:
                return "Oops. Something seems to be wrong with the data used to transfer this app.";
              default:
                return "Oops. Something went wrong. Please try again.";
            }
          })(error),
        };
      default:
        return null as any;
    }
  }

  @computed
  get transferLimitNotification(): INotificationMessage | undefined {
    const error = this.error;
    if (error) {
      return {
        type: NotificationType.Error,
        message: error.message ?? "Unhandled error",
      };
    }
  }

  @action
  public transferApp(newOwnerName: string): void {
    const { TRANSFER_APP_TO_ORG } = API;
    const { owner, name } = this.app;

    console.info(`Transferring ${this.app.name} from ${owner?.name} to ${newOwnerName}`);
    this.setState(ExternalDataState.Pending);

    apiGateway
      .post(TRANSFER_APP_TO_ORG, {
        params: {
          owner_name: owner!.name,
          app_name: name,
          destination_owner_name: newOwnerName,
        },
      })
      .catch((error: FetchError) => {
        logger.error("Error transferring app to org", error, {
          appId: this.app?.id,
          previousOwner: owner!.name,
          newOwnerName,
        });

        runInAction(() => {
          this.setState(ExternalDataState.Failed);
          this.error = error;
        });
      })
      .then(() => {
        if (this.state !== ExternalDataState.Failed) {
          apiGateway
            .get<IAHBranchStatus[]>(API.APP_BRANCHES, {
              params: {
                owner_name: newOwnerName,
                app_name: name,
              },
            })
            .catch((error) => {
              if (error?.message === "App has not been configured for build") {
                logger.info(error.message, error);
                return [];
              } else {
                logger.error("Failed to load branches.", error?.message, error);
                throw error;
              }
            })
            .then((branches) => {
              appStore
                .fetchApp({ ownerName: newOwnerName, appName: this.app.name })
                .onFailure((error) => {
                  throw error;
                })
                .onSuccess((appData) => {
                  if (appData) {
                    const promises: Promise<void>[] = [];

                    ciStore.setCurrentRepoStore(appData);
                    branches.forEach((b) => {
                      if (b.branch && b.configured) {
                        // get branch config
                        promises.push(
                          apiGateway
                            .get<IAHBranchConfiguration>(API.BUILD_BRANCHES_CONFIG, {
                              params: {
                                owner_name: newOwnerName,
                                app_name: name,
                                branch: b.branch?.name,
                              },
                            })
                            .then((bc) => {
                              if (b.branch?.name && ciStore.currentRepoStore) {
                                ciStore.currentRepoStore.setCurrentBranchConfigurationStore(b);

                                const configureStore = new ConfigureStore(appData, b.branch?.name);
                                configureStore.load();

                                const branchConfigurationProps = configureStore!.saveConfiguration({});
                                const branchConfigurationStore = ciStore.currentRepoStore?.currentBranchConfigurationStore;

                                if (branchConfigurationStore?.isLoaded && branchConfigurationStore?.data) {
                                  branchConfigurationProps.id = branchConfigurationStore.data.id;
                                }

                                branchConfigurationStore?.configure(bc, true, false, false);
                              }
                            })
                        );
                      }
                    });
                    Promise.all(promises)
                      .then(() => {
                        if (this.state !== ExternalDataState.Failed) {
                          appStore
                            .fetchApp({ ownerName: newOwnerName, appName: this.app.name })
                            .onFailure((error) => {
                              throw error;
                            })
                            .onSuccess((newAppData) => {
                              if (newAppData) {
                                runInAction(() => {
                                  this.setState(ExternalDataState.Loaded);
                                  appStore.updateAppInAppsList(this.app, Object.assign({}, this.app, newAppData));
                                  locationStore.pushWithApp("/", newAppData);
                                  notify({
                                    persistent: false,
                                    message: `${newAppData.display_name} is now owned by ${newAppData.owner?.display_name}`,
                                  });
                                });
                              }
                            });
                        }
                      })
                      .catch((error: FetchError) => {
                        runInAction(() => {
                          this.setState(ExternalDataState.Failed);
                          this.error = error;
                        });
                      })
                      .finally(() => {
                        if (!this.error) {
                          this.hideTransferConfirmationDialog();
                        }
                      });
                  }
                });
            });
        }
      })
      .catch((error: FetchError) => {
        logger.error("Error querying build configuration after transferring app", error, {
          appId: this.app?.id,
          previousOwner: owner!.name,
          newOwnerName,
        });
        runInAction(() => {
          this.setState(ExternalDataState.Failed);
          this.error = error;
        });
      });
  }
}

export const getTransferAppStore = memoize((app: IApp) => new TransferAppStore(app), { max: 1 });

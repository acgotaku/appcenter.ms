import { observable, action, computed } from "mobx";
import { t } from "@root/lib/i18n";
import { clone } from "lodash";
import { appStore, locationStore, organizationStore } from "@root/stores";
import { exportConfigurationStore, ExportConfiguration, ExportType, Type, ExportState } from "@root/data/management";
import { getAcl } from "@root/shared";
import { Permission } from "@root/shared/utils/permissions/settings";
import crypto = require("crypto");

export class ExportWizardUIStore {
  private originalExportConfiguration!: ExportConfiguration;
  @observable public exportType: ExportType = null as any;
  @observable public custom: boolean = false;
  @observable public exportConfiguration!: ExportConfiguration;
  @observable private fetchingId!: string;
  @observable public deleteExportConfigurationWargningVisible = false;
  @observable public addAzureSubscriptionWargningVisible = false;
  @observable public increaseAzureUsageWargningVisible = false;
  @observable public failureMessage: string | null = null;
  @observable public secretInvalid = false;

  @computed
  public get isFetching() {
    return this.fetchingId ? exportConfigurationStore.isFetching(this.fetchingId) : false;
  }

  @computed
  public get isSaving() {
    return (
      exportConfigurationStore.isCreating(this.exportConfiguration) || exportConfigurationStore.isUpdating(this.exportConfiguration)
    );
  }

  @computed
  public get isEdit() {
    return !!this.fetchingId;
  }

  @computed
  public get isChanged() {
    if (this.originalExportConfiguration && this.exportConfiguration) {
      return (
        this.originalExportConfiguration.connectionString !== this.exportConfiguration.connectionString ||
        this.originalExportConfiguration.instrumentationKey !== this.exportConfiguration.instrumentationKey
      );
    }
    return false;
  }

  @computed
  public get displayWarning() {
    if (appStore.app.azure_subscription) {
      return false;
    }
    if (!this.isEdit && !this.isCustom) {
      // if the app is not an org app and current user is not owner, display warnings
      return !this.isOwner && !appStore.app.isOrgApp;
    }
    return false;
  }

  @computed
  public get displayInfo() {
    if (appStore.app.azure_subscription) {
      return false;
    }
    if (!this.isEdit && !this.isCustom) {
      return this.isOrgApp && !organizationStore.isCurrentUserAnAdmin(organizationStore.find(appStore.app.owner.name));
    }
    return false;
  }

  @computed
  public get isOwner() {
    return appStore.app.isOwnedByCurrentUser;
  }

  @computed
  public get isOrgApp() {
    return appStore.app.isOrgApp;
  }

  @computed
  public get title() {
    if (this.isFetching) {
      return "";
    } else if (this.isEdit) {
      return t("management:exportDetails.existingTitle", {
        exportType: t(`management:exportDetails.exportType.${this.exportConfiguration.exportType}.name`),
      });
    } else {
      return t("management:exportDetails.newTitle");
    }
  }

  @computed
  public get azureLink() {
    const appId = appStore.app.id;
    const appName = appStore.app.name;
    if (this.isFetching) {
      return null;
    } else {
      let subscriptionId: string | null = null;

      // if the export is a custom export, hide the link
      if (this.exportConfiguration.instrumentationKey || this.exportConfiguration.connectionString) {
        return null;
      }
      if (this.exportConfiguration.state === ExportState.Pending) {
        return null;
      }
      if (this.exportConfiguration.subscriptionId) {
        subscriptionId = this.exportConfiguration.subscriptionId!;
      } else if (appStore.app.azure_subscription && appStore.app.azure_subscription.subscription_id) {
        subscriptionId = appStore.app.azure_subscription.subscription_id!;
      } else {
        return null;
      }
      const urlPrefix = `https://portal.azure.com/#resource/subscriptions/${subscriptionId}/resourceGroups/${
        this.exportConfiguration.resourceGroup ? this.exportConfiguration.resourceGroup : `mobilecenter-export-${appName}`
      }`;
      if (this.isEdit) {
        return this.exportConfiguration.exportType === ExportType.BlobStorage
          ? `${urlPrefix}/providers/Microsoft.Storage/storageAccounts/${`ex00${this.digest(appId)}${this.digest(
              subscriptionId
            )}`}/overview`
          : `${urlPrefix}/providers/microsoft.insights/components/${
              this.exportConfiguration.resourceName ? this.exportConfiguration.resourceName : `MobileCenterExport-${appName}`
            }/overview`;
      } else {
        return null;
      }
    }
  }

  @computed
  public get createExportConfigurationTitle() {
    if (this.custom) {
      return t("management:exportDetails.increaseDialog.titleCustom");
    } else if (this.hasAzureSubscription) {
      return t("management:exportDetails.increaseDialog.titleStandard", {
        subscriptionName: appStore.app.azure_subscription?.subscription_name,
      });
    }
    return "";
  }

  public get deleteTitle() {
    return t("management:exportDetails.deleteDialog.title", {
      exportType: t(`management:exportDetails.exportType.${this.exportConfiguration.exportType}.name`),
    });
  }

  @computed
  public get deleteMessage() {
    return t("management:exportDetails.deleteDialog.message", {
      exportType: t(`management:exportDetails.exportType.${this.exportConfiguration.exportType}.name`),
    });
  }

  @computed
  public get subscription() {
    if (this.hasAzureSubscription && appStore.app.azure_subscription?.subscription_id === this.exportConfiguration.subscriptionId) {
      return appStore.app.azure_subscription;
    }
  }

  @computed
  public get isValidExportConfiguration() {
    if (this.isFetching) {
      return false;
    }

    if (this.isEdit) {
      return true;
    }

    const { type, instrumentationKey, connectionString } = this.exportConfiguration;

    if (!type) {
      return false;
    }

    if (type === Type.ApplicationInsightsInstrumentationKey && !instrumentationKey) {
      return false;
    }

    if (type === Type.BlobStorageConnectionString && !connectionString) {
      return false;
    }

    return true;
  }

  @computed
  public get canDeleteExportConfiguration() {
    return getAcl().checkPermission(Permission.DeleteExportConfiguration);
  }

  @computed
  public get hasAzureSubscription() {
    return !!(appStore.app && appStore.app.azure_subscription);
  }

  @computed
  public get secret() {
    if (this.exportConfiguration.exportType === ExportType.BlobStorage || this.exportType === ExportType.BlobStorage) {
      return this.exportConfiguration.connectionString;
    }
    if (this.exportConfiguration.exportType === ExportType.AppInsights || this.exportType === ExportType.AppInsights) {
      return this.exportConfiguration.instrumentationKey;
    }
  }

  @computed
  public get secretPlaceholder() {
    return t(`management:exportDetails.edit.secretPlaceholder.${this.exportConfiguration.exportType || this.exportType}`);
  }

  @computed
  public get isCustom() {
    return (
      this.exportConfiguration &&
      (this.exportConfiguration.type === Type.ApplicationInsightsInstrumentationKey ||
        this.exportConfiguration.type === Type.BlobStorageConnectionString)
    );
  }

  public canCreateExportConfiguration(exportType: ExportType) {
    if (exportConfigurationStore.resources && exportConfigurationStore.resources.some((c) => c.exportType === exportType)) {
      return false;
    }
    return true;
  }

  @action
  public reset() {
    this.fetchingId = null as any;
    this.exportType = null as any;
    this.exportConfiguration = new ExportConfiguration();
    this.exportConfiguration.type = Type.BlobStorageConnectionString;
    this.failureMessage = null;
    this.secretInvalid = false;
  }

  @action
  public fetch(id: string) {
    this.fetchingId = id;
    const fetched = exportConfigurationStore.get(id);
    if (fetched) {
      this.setFetched(fetched);
    } else {
      exportConfigurationStore
        .fetchOne(id, {
          ownerName: appStore.app.owner.name,
          appName: appStore.app.name,
        })
        .onSuccess((configuration: any) => {
          this.setFetched(configuration);
        });
    }
  }

  @action
  private setFetched(configuration: ExportConfiguration) {
    this.originalExportConfiguration = configuration;
    this.exportConfiguration = clone(configuration);
  }

  @action
  public createStandardExportConfiguration() {
    if (this.hasAzureSubscription) {
      this.exportConfiguration.subscriptionId = appStore.app.azure_subscription!.subscription_id;
      this.increaseAzureUsageWargningVisible = true;
    }
  }

  @action
  public createCustomExportConfiguration() {
    this.exportConfiguration.subscriptionId = undefined;
    this.failureMessage = null;
    this.increaseAzureUsageWargningVisible = true;
  }

  @action
  public cancelCreateExportConfiguration() {
    this.increaseAzureUsageWargningVisible = false;
  }

  get exportRefreshUrl() {
    return `${appStore.app.isOrgApp ? "/orgs" : "/users"}/${locationStore.ownerName}/apps/${locationStore.appName}/settings/export`;
  }

  @action
  public createOrUpdateExportConfiguration() {
    this.failureMessage = null;
    const needToEnable = this.exportConfiguration.state === ExportState.Invalid;
    if (this.isEdit) {
      this.exportConfiguration.stateInfo = undefined;
      exportConfigurationStore
        .update(this.originalExportConfiguration, this.exportConfiguration, false, {
          ownerName: appStore.app.owner.name,
          appName: appStore.app.name,
        })
        .onSuccess(() => {
          if (needToEnable) {
            this.setState(true).onSuccess(
              action(() => {
                this.exportConfiguration.stateInfo = undefined;
                locationStore.router.push(this.exportRefreshUrl);
              })
            );
          } else {
            locationStore.goUp();
          }
        })
        .onFailure((error: any) => {
          const statusCode = error.status;
          if (statusCode === 500) {
            this.failureMessage = t(`management:exportDetails.edit.internalErrorMessage`);
          } else if (statusCode === 504) {
            this.failureMessage = t(`management:exportDetails.edit.gateWayErrorMessage`);
          } else {
            this.failureMessage = error.message;
          }
        });
    } else {
      this.increaseAzureUsageWargningVisible = false;
      exportConfigurationStore
        .create(this.exportConfiguration, false, {
          ownerName: appStore.app.owner.name,
          appName: appStore.app.name,
        })
        .onSuccess(() => {
          locationStore.router.push(this.exportRefreshUrl);
        })
        .onFailure((error: any) => {
          const statusCode = error.status;
          if (statusCode === 500) {
            this.failureMessage = t(`management:exportDetails.create.internalErrorMessage`);
          } else if (statusCode === 504) {
            this.failureMessage = t(`management:exportDetails.create.gateWayErrorMessage`);
          } else {
            this.failureMessage = error.message;
          }
        });
    }
  }

  @action
  public addAzureSubscription() {
    this.addAzureSubscriptionWargningVisible = true;
  }

  @action
  public cancelAddAzureSubscription() {
    this.addAzureSubscriptionWargningVisible = false;
  }

  @action
  public confirmAddAzureSubscription() {
    this.addAzureSubscriptionWargningVisible = false;
    locationStore.router.push(appStore.app.isOrgApp ? `/orgs/${appStore.app.owner.name}/manage/azure` : "/settings/azure");
  }

  @action
  public setExportType(exportType: ExportType) {
    this.exportType = exportType;
    if (this.exportType === ExportType.BlobStorage) {
      this.exportConfiguration.type = Type.BlobStorageLinkedSubscription;
    }
    if (this.exportType === ExportType.AppInsights) {
      this.exportConfiguration.type = Type.ApplicationInsightsLinkedSubscription;
    }
  }

  @computed
  public get pricingUrl() {
    if (this.exportType === ExportType.BlobStorage) {
      return "https://azure.microsoft.com/en-us/pricing/details/storage/blobs/";
    } else if (this.exportType === ExportType.AppInsights) {
      return "https://azure.microsoft.com/en-us/pricing/details/application-insights/";
    }
  }

  @action
  public enableCustomize() {
    this.custom = true;
    if (this.exportType === ExportType.BlobStorage) {
      this.exportConfiguration.type = Type.BlobStorageConnectionString;
    }
    if (this.exportType === ExportType.AppInsights) {
      this.exportConfiguration.type = Type.ApplicationInsightsInstrumentationKey;
    }
  }

  @action
  public disableCustomize() {
    this.custom = false;
    this.failureMessage = null;
    this.secretInvalid = false;
    if (this.exportType === ExportType.BlobStorage) {
      this.exportConfiguration.type = Type.BlobStorageLinkedSubscription;
      this.exportConfiguration.connectionString = undefined;
    }
    if (this.exportType === ExportType.AppInsights) {
      this.exportConfiguration.type = Type.ApplicationInsightsLinkedSubscription;
      this.exportConfiguration.instrumentationKey = undefined;
    }
  }

  @action
  public setSecret(secret: string) {
    if (this.exportConfiguration.exportType === ExportType.BlobStorage || this.exportType === ExportType.BlobStorage) {
      if (!secret.startsWith("DefaultEndpointsProtocol")) {
        this.failureMessage = secret ? t("management:exportDetails.secretInvalidMessage") : null;
        this.secretInvalid = true;
      } else {
        this.failureMessage = null;
        this.secretInvalid = false;
      }
      this.exportConfiguration.connectionString = secret;
    }
    if (this.exportConfiguration.exportType === ExportType.AppInsights || this.exportType === ExportType.AppInsights) {
      if (!secret.match("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")) {
        this.failureMessage = secret ? t("management:exportDetails.secretInvalidMessage") : null;
        this.secretInvalid = true;
      } else {
        this.failureMessage = null;
        this.secretInvalid = false;
      }
      this.exportConfiguration.instrumentationKey = secret;
    }
  }

  @action
  public setState(enabled: boolean) {
    this.exportConfiguration.state = enabled ? ExportState.Enabled : ExportState.Disabled;
    return exportConfigurationStore
      .setState(this.originalExportConfiguration, enabled ? ExportState.Enabled : ExportState.Disabled, true, {
        ownerName: appStore.app.owner.name,
        appName: appStore.app.name,
      })
      .onFailure(
        action((error: any) => {
          this.exportConfiguration.state = !enabled ? ExportState.Enabled : ExportState.Disabled;
        })
      );
  }

  @action
  public deleteExportConfiguration() {
    this.deleteExportConfigurationWargningVisible = true;
  }

  @action
  public confirmDeletingExportConfiguration() {
    exportConfigurationStore.delete(this.exportConfiguration.id!, true, {
      ownerName: appStore.app.owner.name,
      appName: appStore.app.name,
    });
    this.deleteExportConfigurationWargningVisible = false;
    locationStore.goUp();
  }

  @action
  public cancelDeletingExportConfiguration() {
    this.deleteExportConfigurationWargningVisible = false;
  }

  private digest(str: string, count: number = 10) {
    return (crypto.createHash("md5").update(str).digest("hex") + "").substr(0, count); // CodeQL [SM04514] We don't hash sensitive data here. We hash the app id and subscription id to generate a unique name for the storage account.
  }
}

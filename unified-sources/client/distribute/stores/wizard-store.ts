import { observable, action, computed, runInAction, reaction } from "mobx";
import { isEmpty, identity, some, sortBy, uniqBy } from "lodash";
import { Release, ProfileType } from "../models/release";
import { distributionStores } from "./distribution-stores";
import { deviceRegistrationStore, DeviceRegistrationErrorPage } from "./device-registration-store";
import { DistributionGroupCreateStore } from "./distribution-group-create-store";
import { DistributeFromBuildStore } from "./distribute-from-build-store";
import { BranchesWithCommitStore } from "./branches-with-commit-store";
import { BuildsWithCommitStore } from "./builds-with-commit-store";
import { TelemetryProperty, ResponseHelper } from "../utils";
import { OS } from "../models/os";
import { Status, Device } from "../models/device";
import { BranchWithCommit } from "../models/branch-with-commit";
import { BuildWithCommit } from "../models/build-with-commit";
import { DestinationWrapper } from "../models/destination-wrapper";
import { DistributionDestinationType } from "../models/destination-type";
import { Urls, Routes, TabId } from "../utils/constants";
import * as Strings from "../utils/strings";
import { BuildUtils } from "@root/data/build";
import { ExternalDataState, IDragDropUploadHandlerStore } from "@root/shared/index";
import { optimizelyStore, appStore, locationStore, notify, Notification } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DeviceListStore, ServerDevice } from "./device-list-store";
import { ReleaseDestination, ReleaseTesterDestination } from "@root/data/distribute/models/release-destination";
import { autoProvisioningConfigStore } from "@root/distribute/stores/auto-provisioning-config-store";
import { DestinationHelper } from "@root/distribute/utils/destination-helper";
import { NormalizedDistributionGroup } from "@root/distribute/models/normalized-distribution-group";
import { t } from "@root/lib/i18n";
import { DistributionGroup } from "@root/data/distribute/models/distribution-group";
import { CommonDistributionSummaryStore } from "@root/stores/common-distribution-summary-store";
import { failedDestinationsStore } from "@root/distribute/stores/failed-destinations-store";
import { NewReleaseUpload } from "../upload/new-release-upload";
import { UploadStatus } from "@root/lib/drag-drop-upload";
import { UploadCallbacks } from "../utils/streaming-upload-helper";
import {
  releaseDestinationAssociationStore,
  DistributeReleaseError,
  DistributeReleaseResourceRequest,
} from "../../data/distribute/stores/release-destination-association-store";
import { ApiReleaseUpdateResponse, ApiDestination } from "@root/api/clients/releases/api";
import { releaseStore } from "@root/data/distribute/stores/release-store";
import { ReleaseModel } from "@root/data/distribute/models/release";
import { IUser, IHttpOptions, OptimizelyFeatureNames } from "@lib/common-interfaces";
import { isHttpsUri } from "valid-url";
import { convertSnakeToCamelCase, caseConvertedAny } from "./convert-snake-to-camel-case";
import { logger } from "@root/lib/telemetry";

export enum WizardPage {
  SourceSelection,
  BuildSelection,
  SelectDestinations,
  CreateNewGroup,
  Summary,
  RegisterDevices,
  Notes,
}

export enum GroupWizardParent {
  Releases = 1,
  DistributionGroups,
  DistributionGroupDetails,
  ReleaseDetails,
}

export enum DistributeSourceType {
  Upload,
  Branch,
  ExternalBuild,
}

export const WizardPages = {
  [WizardPage.SourceSelection]: Strings.WizardPages.UploadRelease,
  [WizardPage.BuildSelection]: Strings.WizardPages.SelectBuild,
  [WizardPage.SelectDestinations]: Strings.WizardPages.Destination,
  [WizardPage.Summary]: Strings.WizardPages.Summary,
  [WizardPage.RegisterDevices]: Strings.WizardPages.Devices,
  [WizardPage.Notes]: Strings.WizardPages.Notes,
};

export class WizardStore extends CommonDistributionSummaryStore {
  private groupWizardParent: GroupWizardParent;
  private selectedTab: string;
  private distributeFromBuildStore = new DistributeFromBuildStore(appStore.app);
  private reactionDisposers: any[] = [];
  public branchesStore = new BranchesWithCommitStore(appStore.app);
  public buildsStore = new BuildsWithCommitStore(appStore.app);

  private readonly MAX_TESTERS = 50;
  private readonly MAX_TESTERS_PER_RELEASE = 30000;

  @observable public deviceRegistrationIsChecked: boolean = false;
  @observable private pageIndex = 0;
  @observable private isCreatingNewGroup = false;
  @observable private selectedDistributionGroupId!: string;
  @observable private selectedGroups = observable.array<DestinationWrapper>();
  @observable private selectedTesters = observable.array<DestinationWrapper>();
  @observable public distributeInProgress!: boolean;
  @observable public isGettingUnprovisionedDevices: ExternalDataState = ExternalDataState.Idle;
  @observable public unprovisionedDevicesInRelease: Device[] = [];
  @observable public releaseNotes = "";
  @observable public buildVersion = "";
  @observable public buildNumber = "";
  @observable public releaseNotesLoaded!: boolean;
  @observable public errorMessage!: string;
  @observable public appleAccountServiceConnectionId!: string;
  @observable public appleCertificateServiceConnectionId!: string;
  @observable public externalBuildUrl = "";

  public createGroupStore = new DistributionGroupCreateStore();
  public uploadHandler: IDragDropUploadHandlerStore;

  private createUploadHandler(): IDragDropUploadHandlerStore {
    const callbacks: UploadCallbacks = {
      onUploadReset: () => this.reset(),
      onUploadStarted: this.onUploadStarted,
      onUploadFinished: this.onUploadFinished,
      onUploadFailed: this.onUploadFailed,
      onGetUploadUrlFinished: this.onGetUploadUrlFinished,
      onGetUploadUrlFailed: this.onUploadFailed,
    };

    return new NewReleaseUpload(appStore.app, callbacks);
  }

  constructor(parent: GroupWizardParent, releaseId?: number, selectedTab?: string) {
    super();
    const { app } = appStore;
    this.uploadHandler = this.createUploadHandler();

    // Ensure distribution group list is fresh by the time we get to that page
    this.distributionGroupListStore.fetchDistributionGroupsList().then(() => {
      if (parent === GroupWizardParent.DistributionGroupDetails && this.distributionGroupListStore.selectedGroup) {
        const selectedDestination = DestinationHelper.createDestinationFromSource(
          this.distributionGroupListStore.selectedGroup,
          DistributionDestinationType.DistributionGroup
        );
        this.addDestinations([selectedDestination]);
      } else if (!this.distributionGroup) {
        deviceRegistrationStore.initialize();
      }
    });
    this.groupWizardParent = parent;
    this.selectedTab = selectedTab!;

    if (parent === GroupWizardParent.ReleaseDetails && releaseId) {
      (async () => {
        await releaseStore.fetchOne(releaseId.toString()).promise;
        const release = releaseStore.get(releaseId.toString());
        if (release) {
          this.setRelease(release);
          this.setReleaseNotesLoaded(true);
        }
      })();
    } else {
      this.setReleaseNotesLoaded(true);
    }

    // Setup the reactions if auto provisioning is enabled
    if (app.isIosApp && this.source !== DistributeSourceType.ExternalBuild) {
      this.reactionDisposers.push(
        reaction(
          () => this.distributionGroup,
          (group) => {
            if (group) {
              // Fetch the auto provisioning configuration for the given distribution group name
              autoProvisioningConfigStore.fetchOne(autoProvisioningConfigStore.configurationKey(app, group.name!), {
                ownerName: app.owner.name,
                appName: app.name,
                destinationName: group.name,
              });
            }
          }
        )
      );
    }

    logger.info("distribute-wizard-opened", {
      source: GroupWizardParent[parent],
    });
  }

  @computed
  public get isFetching() {
    if (this.release && this.release.id) {
      return releaseStore.isFetching(this.release.id.toString());
    } else {
      return false;
    }
  }

  public cleanupReactions() {
    this.reactionDisposers.forEach((disposer) => disposer());

    if (this.uploadHandler) {
      this.uploadHandler.dispose!();
    }
  }

  public track(event: string, withReleases = true, otherProps: TelemetryProperty = {}) {
    const existingReleases = (distributionStores.releaseListUIStore.releases || []).length;
    const props: TelemetryProperty = Object.assign(
      {},
      otherProps,
      this.groupWizardParent === GroupWizardParent.Releases && withReleases ? { existingReleases } : null
    );

    logger.info(event, props);
  }

  @action public setDistributionGroup(groupId: string) {
    this.selectedDistributionGroupId = groupId;
    if (
      appStore.app.isIosApp &&
      this.release &&
      !this.release.isProvisioningProfileSyncing &&
      this.distributionGroup &&
      this.source !== DistributeSourceType.ExternalBuild
    ) {
      this.setUnprovisionedDevicesForRelease(this.release, this.distributionGroup.name!);
    }
  }

  @action
  public clearErrorMessage = () => {
    this.setErrorMessage("");
  };

  @action
  public addDestinations = (destinations: DestinationWrapper[], removeFromTagStore?: (destination: DestinationWrapper) => void) => {
    this.clearErrorMessage();

    // ObservableArrays don't behave nicely with .includes() on the DestinationWrapper object, so use the keys directly
    const selectedGroupKeys = this.selectedGroups.map((group) => group.key);
    const selectedTesterKeys = this.selectedTesters.map((tester) => tester.key);
    const selectedKeys = selectedGroupKeys.concat(selectedTesterKeys);
    let duplicateDestinations: DestinationWrapper[] = [];
    let maxTestersReached = false;
    let destinationsLimitReached = false;

    destinations.forEach((destination) => {
      if (selectedKeys.includes(destination.key)) {
        duplicateDestinations.push(destination);
        this.removeFromTagStore(destination, removeFromTagStore!);
        return;
      }
      if (this.selectedDestinationsCount(destination) > this.MAX_TESTERS_PER_RELEASE) {
        destinationsLimitReached = true;

        // Do not reject new selections because this is just an estimate and it can be valid at the end.
      }
      if (destination.type === DistributionDestinationType.DistributionGroup) {
        this.selectedGroups.push(destination);
        selectedKeys.push(destination.key);
      } else if (destination.type === DistributionDestinationType.Tester) {
        if (this.selectedTesters.length >= this.MAX_TESTERS) {
          maxTestersReached = true;
          return;
        }
        this.selectedTesters.push(destination);
        selectedKeys.push(destination.key);
      }

      this.removeFromTagStore(destination, removeFromTagStore!);
    });

    let messageText = "";
    if (maxTestersReached) {
      messageText = t("distribute:releases.maxTesters", { count: this.MAX_TESTERS });
    } else if (duplicateDestinations.length > 0) {
      // TODO NIT: Sort this list so it's displayed in the same order as elsewhere (DGs first alphabetically, then testers next alphabetically)
      duplicateDestinations = uniqBy(duplicateDestinations, (destination) => destination.key);
      messageText = t("distribute:releases.duplicateDestination", { count: duplicateDestinations.length });
      messageText += `${duplicateDestinations
        .map((duplicateDestination) => duplicateDestination.displayText || duplicateDestination.email)
        .join(", ")}`;
    } else if (destinationsLimitReached) {
      messageText = t("distribute:releases.testersPerRelease", { count: this.MAX_TESTERS_PER_RELEASE });
    }

    this.setErrorMessage(messageText);
  };

  private removeFromTagStore(destination: DestinationWrapper, func: (destination: DestinationWrapper) => void) {
    if (func) {
      func(destination);
    }
  }

  /**
   * Counts selected destinations after adding a new one.
   * @param newDestination destination to add.
   */
  private selectedDestinationsCount(newDestination: DestinationWrapper): number {
    // There is no data to count unique users because one user can take part in multiple groups, so just "estimate" instead.
    const selectedCount = this.selectedGroups.reduce((count, group) => count + group.totalUsersCount, this.selectedTesters.length);
    return selectedCount + newDestination.totalUsersCount;
  }

  @action
  public deleteDestination = (destination: DestinationWrapper) => {
    this.clearErrorMessage();
    if (destination.type === DistributionDestinationType.DistributionGroup) {
      this.selectedGroups.remove(destination);
    } else {
      this.selectedTesters.remove(destination);
    }
  };

  @action
  public setAppleAccountServiceConnectionId = (value: string) => {
    this.appleAccountServiceConnectionId = value;
  };

  @action
  public setAppleCertificateServiceConnectionId = (value: string) => {
    this.appleCertificateServiceConnectionId = value;
  };

  @computed get appleAccountToUse() {
    return this.appleAccountServiceConnectionId;
  }

  @computed get appleCertificateToUse() {
    return this.appleCertificateServiceConnectionId;
  }

  @action public setDeviceRegistrationIsChecked(value: boolean) {
    this.deviceRegistrationIsChecked = value;
  }

  @action public goToGroupCreation() {
    this.isCreatingNewGroup = true;
  }

  @action public setReleaseNotes(notes: string) {
    this.releaseNotes = notes;
    this.setReleaseNotesLoaded(true);
  }

  @action setReleaseNotesLoaded = (value: boolean) => {
    this.releaseNotesLoaded = value;
  };

  @action public setSource(source: DistributeSourceType) {
    this.source = source;
  }

  @action public setRelease(release: Release) {
    this.release = release;
    this.setReleaseNotes((release && release.releaseNotes) || "");
  }

  @action public setSourceAndFetchBranchesIfNeeded(source: DistributeSourceType) {
    this.setSource(source);
    if (source === DistributeSourceType.Branch) {
      this.branchesStore.fetchBranches();
    }
  }

  @action public fetchBuilds() {
    this.buildsStore.fetchBuildsWithCommits(this.branch!);
  }

  @action public setBranch(branch: string) {
    this.branch = branch;
    this.buildId = undefined;
  }

  @action public setBuildId(buildId: number) {
    this.buildId = Number(buildId);
  }

  @action
  public setErrorMessage = (message: string) => {
    this.errorMessage = message;
  };

  @computed
  public get autoProvisioningConfig() {
    if (!this.distributionGroup) {
      return undefined;
    }

    const { app } = appStore;
    if (!app) {
      return undefined;
    }
    return autoProvisioningConfigStore.get(autoProvisioningConfigStore.configurationKey(app, this.distributionGroup.name!));
  }

  @computed
  public get shouldAutoProvision() {
    return this.autoProvisioningConfig && this.autoProvisioningConfig.allowAutoProvisioning;
  }

  @computed
  public get hasUnprovisionedDevices() {
    return this.unprovisionedDevicesInRelease && this.unprovisionedDevicesInRelease.length > 0;
  }

  @computed
  public get shouldManuallyProvision() {
    return this.appleAccountServiceConnectionId && this.appleCertificateServiceConnectionId && this.deviceRegistrationIsChecked;
  }

  @action public nextAfterCreatingGroup() {
    if (this.distributionGroupListStore.hasDistributionGroupWithName(this.createGroupStore.groupName)) {
      this.createGroupStore.groupNameErrorMessage = Strings.DistributionGroupWizardStrings.GroupWithSameNameError;
    } else {
      logger.info("New group creation started", { source: "distribute wizard" });
      this.createGroupStore.createDistributionGroup().then(
        () => {
          logger.info("Create distribution group complete", { result: "succeed" });
          this.distributionGroupListStore.fetchDistributionGroupsList();
          this.setDistributionGroup(this.createGroupStore.groupId);
          this.next();
        },
        (error) => {
          // TODO: Implement error handling
          logger.info("Create distribution group complete", {
            result: "failed",
            ...ResponseHelper.extractResponse(error),
          });
        }
      );
    }
  }

  @action public next() {
    if (this.page === WizardPage.SourceSelection && this.source === DistributeSourceType.ExternalBuild) {
      if (!!this.release) {
        this.updatePage();
        return;
      }
      this.createExternalBuild()
        .then((release) => {
          this.setRelease(release);
          this.updatePage();
        })
        .catch(
          action((err: Error) => {
            this.errorMessage = err.message;
          })
        );
    } else if (
      this.page === WizardPage.SourceSelection &&
      this.uploadHandler.uploadStatus !== UploadStatus.UploadSuccessful &&
      this.shouldDeferUpload
    ) {
      this.uploadHandler!.beginUpload!(this.getUploadOptions()).then(() => {
        if (!this.uploadHandler.errorMessage) {
          this.updatePage();
        } else {
          const errorMessage = this.uploadHandler.errorMessage;
          action(() => {
            this.errorMessage = errorMessage;
          });
        }
      });
    } else {
      this.updatePage();
    }
  }

  @action
  private updatePage() {
    this.errorMessage = null as any;
    switch (this.page) {
      case WizardPage.CreateNewGroup:
        this.isCreatingNewGroup = false;
        break;
      default:
        this.pageIndex++;
    }
  }

  @action public back() {
    deviceRegistrationStore.clearErrorMessage();
    this.clearErrorMessage();
    if (this.page === WizardPage.CreateNewGroup) {
      this.isCreatingNewGroup = false;
    } else {
      this.pageIndex--;
    }
  }

  @action public finish() {
    this.distributeInProgress = true;

    const shouldExecuteResign =
      OS.isIos(appStore.app.os) && this.shouldManuallyProvision && !(this.release && this.release.isExternalBuild);
    if (shouldExecuteResign) {
      this.distributeWithResign();
    } else if (this.groupWizardParent !== GroupWizardParent.ReleaseDetails) {
      // this else if means we aren't re-releasing a build
      if (
        (this.source === DistributeSourceType.Upload || this.source === DistributeSourceType.ExternalBuild) &&
        this.release &&
        this.release.id
      ) {
        this.distributeFromUpload();
      } else if (this.source === DistributeSourceType.Branch && this.branch && this.buildId) {
        this.distributeFromBranch();
      }
    } else {
      // this code path means we're re-releasing
      this.redistributeRelease();
    }
  }

  @action
  public setBuildVersion(buildVersion: string) {
    this.buildVersion = buildVersion;
  }

  @action
  public setBuildNumber(buildNumber: string) {
    this.buildNumber = buildNumber;
  }

  public getUploadOptions(): IHttpOptions {
    let versionInfo: any = null;
    if (this.buildNumber && this.buildVersion) {
      versionInfo = { build_version: this.buildVersion, build_number: this.buildNumber };
    } else if (this.buildVersion) {
      versionInfo = { build_version: this.buildVersion };
    }

    return {
      body: versionInfo,
    };
  }

  @action
  public setExternalBuildUrl(externalBuildUrl: string) {
    this.externalBuildUrl = externalBuildUrl;
  }

  private trackDistributeTelemetry(error, event: string, props?: TelemetryProperty) {
    runInAction(() => {
      this.distributeInProgress = false;
    });
    const telemetryProps = {
      result: error ? "failed" : "succeed",
      ...(error ? ResponseHelper.extractResponse(error) : {}),
      ...props,
    };

    this.track(event, true, telemetryProps);
  }

  @action private distributeWithResign() {
    // Update the configuration with the credential values that were selected in the register devices step.
    deviceRegistrationStore.addUpdateGroupProvisioningConfig(
      this.appleAccountToUse,
      this.appleCertificateToUse,
      this.distributionGroup!.name!
    );

    this.distributeRelease();
    deviceRegistrationStore.clearErrorMessage();
    logger.info("Provisioning: device registration to Apple Developer portal and application resigning started", {
      source: "Distribute new release",
    });
    deviceRegistrationStore.setIsDistributingRelease(true);

    deviceRegistrationStore.setAppId(appStore.app.id);
    deviceRegistrationStore.setRelease(this.release!);
    locationStore.goUp();

    deviceRegistrationStore
      .publishAndResignDevices(this.distributionGroup!.name!, this.appleAccountToUse, this.appleCertificateToUse, this.release!.id)
      .then(
        action(() => {
          if (deviceRegistrationStore.errorMessage) {
            this.distributeInProgress = false;
          }
          distributionStores.getDistributionGroupDetailsStore(this.distributionGroup!.name!).deviceWithTesterStore.fetchDevices();
          distributionStores.releaseListUIStore.fetchReleaseList();
          return null;
        })
      );
    const telemetryProperties = {
      source: "ResignDistribute",
      destinations: this.getReleaseDestinations().map((dest) => dest.destinationType!),
      mandatoryUpdate: this.mandatoryUpdate,
      notifyTesters: this.notifyTesters,
    };

    this.trackDistributeTelemetry(null, "Distribution complete", telemetryProperties);
  }

  checkAndPollIfResign(data: ApiReleaseUpdateResponse): boolean {
    if (this.shouldAutoProvision && data.provisioningStatusUrl) {
      // The deviceRegistrationStore doesn't look at a central place for it's "single source of truth".
      // It relies on other stores to set state from other stores.
      // If the following state isn't set, none of the computed's are fired (which normally would have) -
      // -- if we had a central place for data.
      deviceRegistrationStore.setAppId(appStore.app.id);
      deviceRegistrationStore.setRelease(this.release!);
      deviceRegistrationStore.setGroupName(this.distributionGroup ? this.distributionGroup.name! : (null as any));
      deviceRegistrationStore.startPolling(data.provisioningStatusUrl);
    }

    if (data.provisioningStatusUrl) {
      const selectedTab = deviceRegistrationStore.groupTab || "releases";
      locationStore.pushWithCurrentApp(Routes.ProvisioningStatus, { tab: selectedTab, group_name: this.distributionGroup!.name });
      return true;
    }
    return false;
  }

  private distributeFromUpload() {
    this.distributeRelease()
      .then(
        action(() => {
          this.handleModelUpdatesForDistributeAndRedistribute();
          this.redirectBasedOnDestinationTypes();
          return;
        })
      )
      .catch(identity)
      .then((error) => {
        const telemetryProperties = {
          source: this.source.toString(),
          destinations: this.getReleaseDestinations().map((dest) => dest.destinationType),
          mandatoryUpdate: this.mandatoryUpdate,
          notifyTesters: this.notifyTesters,
        };
        this.trackDistributeTelemetry(error, "Distribution complete", telemetryProperties as any);
      });
  }

  private distributeFromBranch() {
    const destinations = this.getReleaseDestinations();
    this.distributeFromBuildStore
      .distribute(this.buildId!, this.releaseNotes, destinations, this.mandatoryUpdate, this.notifyTesters)
      .catch(identity)
      .then((result) => {
        const error = result.status !== "started" ? result : undefined;
        if (error) {
          locationStore.goUp();
          if (this.distributionGroup) {
            this.showDistributionErrorNotification(
              t("distribute:wizardStrings.buildDistributionErrorToGroup", {
                group: this.distributionGroup.name,
                buildNumber: this.buildId,
              })
            );
          } else {
            this.showDistributionErrorNotification(
              t("distribute:wizardStrings.buildDistributionError", { buildNumber: this.buildId })
            );
          }
        } else {
          this.redirectBasedOnDestinationTypes();
        }

        const commitMessage = this.builds.find((build) => build.id === this.buildId)!.commit.commit!.message;
        const extraTelemetryProperties = {
          source: "Branch",
          branchType: BuildUtils.getBranchNameType(this.branch!),
          destinations: destinations.map((dest) => dest.destinationType),
          modifiedDefaultReleaseNotes: this.releaseNotes !== commitMessage,
          mandatoryUpdate: this.mandatoryUpdate,
          notifyTesters: this.notifyTesters,
        };
        this.trackDistributeTelemetry(error, "Distribution complete", extraTelemetryProperties as any);
        return;
      });
  }

  private redistributeRelease() {
    return this.distributeRelease()
      .then(() => {
        this.handleModelUpdatesForDistributeAndRedistribute();
        this.redirectBasedOnDestinationTypes();
        return null;
      })
      .catch(identity)
      .then((error) => {
        const telemetryProperties = {
          source: "ReDistribute",
          destinations: this.getReleaseDestinations().map((dest) => dest.destinationType),
          mandatoryUpdate: this.mandatoryUpdate,
          notifyTesters: this.notifyTesters,
        };
        this.trackDistributeTelemetry(error, "ReDistribution complete", telemetryProperties as any);
      });
  }

  @action private handleModelUpdatesForDistributeAndRedistribute() {
    // Using the new stores, we can just add the response from the initial upload to the
    // data store and the association store, without needing to do a refetch.

    // First though, we need to pre-populate the destinations, so they will show up in the table
    // on the Releases page.
    if (!this.release!.destinations) {
      // release.destinations is undefined. Initializing it.
      this.release!.destinations = [];
    }

    const destinations: ApiDestination[] = [
      ...this.distributionGroups.map(
        (group): ApiDestination => ({
          id: group.id,
          name: group.name,
          displayName: group.display_name,
          destinationType: "group",
        })
      ),
      ...this.distributionTesters.map(
        (tester): ApiDestination => ({
          id: tester.id!,
          name: tester.name,
          displayName: tester.display_name,
          destinationType: "tester",
        })
      ),
      ...this.release!.destinations,
    ];
    let model = releaseStore.get(this.release!.id.toString());
    if (model) {
      model.applyChanges({ destinations: uniqBy([...model.destinations!, ...destinations], (dest) => dest.id) });
    } else {
      model = new ReleaseModel({ ...this.release, destinations: destinations });
      releaseStore.add(model);
    }

    const associationBody = {
      id: this.release!.id.toString(),
      mandatoryUpdate: this.mandatoryUpdate,
    };
    this.distributionGroups.forEach((group) => {
      // Add the association record for each destination, so they'll show up in the DG list.
      releaseDestinationAssociationStore.add(group.name!, this.release!.id.toString(), associationBody, { groupName: group.name });

      // LatestReleaseStore is currently not depricated becuase it can't be replaced until
      // we replace the distribution group stores.
      //
      // In the future, this should be replaced with something like this:
      //
      // const groupModel = distributionGroupStore.get(group.id);
      // releaseStore.getForRelationship(groupModel, "latestReleaseId");
      //
      // This would end up fetching the latest release for the group, and would
      // bump the latestReleaseId observable on the group model if it's different,
      // which would then cause a rerender on the latest release info (since it would
      // be changed to be observing group.latestReleaseId instead of what it's doing now).
      // And, we need to set the mandatory flag before we pass it along.
      this.release!.mandatoryUpdate = this.mandatoryUpdate;
      distributionStores.releaseListUIStore.refreshLatestReleaseForGroup(group.name!, this.release!);
    });
    this.distributionTesters.forEach((tester) => {
      releaseDestinationAssociationStore.add(tester.email!, this.release!.id.toString(), associationBody, {
        testerEmail: tester.email!,
      });
    });
  }

  private redirectBasedOnDestinationTypes(): void {
    const destinations = this.getReleaseDestinations();
    if (destinations.length === 1 && destinations[0].destinationType === "group") {
      let tabId: TabId;
      if (this.selectedTab) {
        tabId = TabId[this.selectedTab];
      } else {
        tabId = TabId.overview;
      }
      locationStore.pushWithCurrentApp(Routes.DistributionGroupDetails, { tab: TabId[tabId], group_name: destinations[0].name });
      return;
    }
    locationStore.pushWithCurrentApp(Routes.Releases);
  }

  private async distributeRelease(): Promise<ApiReleaseUpdateResponse | any> {
    try {
      return await this.wrapDistributeRelease();
    } catch (error) {
      if (error instanceof DistributeReleaseError) {
        this.handleErrors(error.destinations, error.message);
        return null as any;
      }
    }
  }

  @computed
  get iconUrl(): string {
    return appStore.app.icon_url!;
  }

  // @ts-ignore. [Should fix it in the future] Strict error.
  @computed get distributionGroup() {
    if (this.selectedDistributionGroupId) {
      return (
        this.distributionGroupListStore.dataArray.find((group) => group.id === this.selectedDistributionGroupId) ||
        this.defaultDistributionGroup
      );
    }

    if (isEmpty(this.selectedGroups)) {
      return null;
    }

    if (!isEmpty(this.selectedTesters)) {
      return null;
    }

    return this.selectedGroups.length > 1
      ? null
      : (this.selectedGroups[0].destination as NormalizedDistributionGroup).toDistributionGroupInterface();
  }

  @computed get distributionTesters(): IUser[] {
    return this.selectedTesters.map((wrapper) => {
      return wrapper.destination as IUser;
    });
  }
  @computed get distributionGroups(): DistributionGroup[] {
    return this.selectedGroups.map((wrapper) => {
      return (wrapper.destination as NormalizedDistributionGroup).toDistributionGroupInterface();
    });
  }

  @computed get destinations(): DestinationWrapper[] {
    return [
      ...sortBy(this.selectedGroups.slice(), (destination) => (destination.displayText || "").toLowerCase()),
      ...sortBy(this.selectedTesters.slice(), (destination) => (destination.displayText || "").toLowerCase()),
    ];
  }

  @computed get branches(): BranchWithCommit[] {
    return this.branchesStore.data || [];
  }

  @computed get builds(): BuildWithCommit[] {
    return this.buildsStore.data || [];
  }

  @computed get page() {
    if (this.isCreatingNewGroup) {
      return WizardPage.CreateNewGroup;
    } else if (this.isPublishingDevicesOrSigningRelease) {
      return WizardPage.Summary;
    } else {
      return this.pages[this.pageIndex];
    }
  }

  get parent() {
    return this.groupWizardParent;
  }

  @computed get index() {
    return this.pageIndex;
  }

  @computed get registerDevicesPage() {
    if (
      (!this.release || this.release.provisioningProfileType === ProfileType.adhoc) &&
      OS.isIos(appStore.app.os) &&
      !this.shouldAutoProvision
    ) {
      return [WizardPage.RegisterDevices];
    } else {
      return [];
    }
  }

  @computed get pages() {
    switch (this.groupWizardParent) {
      // Scenario: re-release
      case GroupWizardParent.ReleaseDetails:
        return [WizardPage.Notes, WizardPage.SelectDestinations, WizardPage.Summary];
      // Scenario: distributing from a distribution group
      case GroupWizardParent.DistributionGroupDetails:
        if (this.isBuildIntegrationAvailable() && this.source === DistributeSourceType.Branch) {
          return [WizardPage.SourceSelection, WizardPage.BuildSelection, WizardPage.Notes, WizardPage.Summary];
        } else if (this.source === DistributeSourceType.ExternalBuild) {
          return [WizardPage.SourceSelection, WizardPage.Notes, WizardPage.Summary];
        } else {
          return [WizardPage.SourceSelection, WizardPage.Notes, ...this.registerDevicesPage, WizardPage.Summary];
        }
      // Scenario: Distribution from the groups list or release list
      default:
        if (this.isBuildIntegrationAvailable() && this.source === DistributeSourceType.Branch) {
          return [
            WizardPage.SourceSelection,
            WizardPage.BuildSelection,
            WizardPage.Notes,
            WizardPage.SelectDestinations,
            WizardPage.Summary,
          ];
        } else if (this.source === DistributeSourceType.ExternalBuild) {
          return [WizardPage.SourceSelection, WizardPage.Notes, WizardPage.SelectDestinations, WizardPage.Summary];
        } else {
          return [
            WizardPage.SourceSelection,
            WizardPage.Notes,
            WizardPage.SelectDestinations,
            ...this.registerDevicesPage,
            WizardPage.Summary,
          ];
        }
    }
  }

  @computed
  public get buildVersionInputDisabled(): boolean {
    return [UploadStatus.UploadStarted, UploadStatus.UploadProcessing].includes(this.uploadHandler.uploadStatus!);
  }

  @computed
  public get uploadIsActiveOrFailed(): boolean {
    return [
      UploadStatus.UploadStarted,
      UploadStatus.UploadProcessing,
      UploadStatus.UploadFailed,
      UploadStatus.UploadFailedBlocks,
      UploadStatus.UploadFailedPatch,
      UploadStatus.UploadFailedPost,
    ].includes(this.uploadHandler.uploadStatus!);
  }

  @computed get canGoNext() {
    switch (this.page) {
      case WizardPage.SourceSelection:
        if (this.source === DistributeSourceType.Branch) {
          return this.isBinaryUploaded;
        } else if (this.source === DistributeSourceType.ExternalBuild) {
          if (this.isBuildNumberRequired) {
            return !isEmpty(this.buildVersion) && !isEmpty(this.buildNumber) && this.isExternalBuildUrlValid;
          } else {
            return !isEmpty(this.buildVersion) && this.isExternalBuildUrlValid;
          }
        }
        return !this.uploadIsActiveOrFailed && (this.isBinaryUploaded || this.deferredUploadReady);
      case WizardPage.BuildSelection:
        return Boolean(this.buildId);
      case WizardPage.SelectDestinations:
        if (this.destinations && this.destinations.length > 0) {
          return true;
        }
        return Boolean(this.distributionGroup);
      case WizardPage.CreateNewGroup:
        return !isEmpty(this.createGroupStore.groupName) && !this.createGroupStore.isPending;
      default:
        return false;
    }
  }

  private get isExternalBuildUrlValid(): boolean {
    return isHttpsUri(this.externalBuildUrl);
  }

  private get isBinaryUploaded(): boolean {
    return (
      (Boolean(this.release) && this.source === DistributeSourceType.Upload) ||
      (Boolean(this.branch) && this.source === DistributeSourceType.Branch)
    );
  }

  private get deferredUploadReady(): boolean {
    if (this.source !== DistributeSourceType.Upload) {
      return false;
    } else if (this.shouldDisplayBuildVersionAndBuildNumberInput) {
      return !!this.buildVersion && !!this.buildNumber;
    } else if (this.shouldDisplayBuildVersionInputOnly) {
      return !!this.buildVersion;
    }
    return false;
  }

  @computed get isUploadingP12Cert() {
    return deviceRegistrationStore.isUploadingP12Cert;
  }

  @computed get shouldShowProvisioningStatus() {
    return (
      this.isPublishingDevices ||
      this.isSigningRelease ||
      (this.shouldManuallyProvision && (this.publishingDevicesHasStarted || this.publishingDevicesHasFinished)) ||
      deviceRegistrationStore.resigningStatus
    );
  }

  @computed
  public get shouldDeferUpload(): boolean {
    return this.shouldDisplayBuildVersionInputOnly || this.shouldDisplayBuildVersionAndBuildNumberInput;
  }

  @computed
  public get shouldDisplayBuildVersionInputOnly(): boolean {
    const supportedAppType = appStore.app.isWindowsApp || appStore.app.isCustomApp;
    if (
      supportedAppType &&
      this.source === DistributeSourceType.ExternalBuild &&
      optimizelyStore.isFeatureEnabled(OptimizelyFeatureNames.distribute_external_builds)
    ) {
      return true;
    }
    if (!supportedAppType) {
      return false;
    }
    let isFileNameSupported = false;
    if (this.uploadHandler.file) {
      const fileName = this.uploadHandler.file.name;
      const extension: string = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
      isFileNameSupported = [".zip", ".msi"].includes(extension); // If file of any of those extensions, need build version.
    }
    return isFileNameSupported;
  }

  @computed
  public get shouldDisplayBuildVersionAndBuildNumberInput(): boolean {
    if (
      optimizelyStore.isFeatureEnabled(OptimizelyFeatureNames.distribute_external_builds) &&
      this.source === DistributeSourceType.ExternalBuild
    ) {
      return true;
    }
    if (!appStore.app.isMacOSApp) {
      return false;
    }
    let isFileNameSupported = false;
    if (this.uploadHandler.file) {
      const fileName = this.uploadHandler.file.name;
      const extension: string = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
      isFileNameSupported = [".dmg", ".pkg"].includes(extension); // If file of any of those extensions, need build version and build number.
    }
    return isFileNameSupported;
  }

  @computed get isBuildNumberRequired(): boolean {
    return !appStore.app.isWindowsApp && !appStore.app.isCustomApp;
  }

  @computed
  public get shouldDisplayLinkText(): boolean {
    return !OS.isCustom(appStore.app.os);
  }

  @computed get isSigningRelease() {
    return this.distributionGroup && deviceRegistrationStore.isResigningDistributionGroupRelease(this.distributionGroup.name);
  }

  @computed get publishingDevicesHasStarted() {
    return deviceRegistrationStore.publishingDevicesHasStarted;
  }

  @computed get isPublishingDevices() {
    return deviceRegistrationStore.isPublishingDevices;
  }

  @computed get publishingDevicesHasFinished() {
    return deviceRegistrationStore.publishingDevicesHasFinished;
  }

  @computed get isPublishingDevicesOrSigningRelease() {
    return (
      this.publishingDevicesHasStarted || this.isPublishingDevices || this.isSigningRelease || deviceRegistrationStore.resigningStatus
    );
  }

  @computed get hasFailedPublishingOrResigning() {
    return this.distributionGroup && deviceRegistrationStore.hasFailedPublishingOrResigning(this.distributionGroup.name);
  }

  @computed get provisioningProfilesZipURL() {
    return deviceRegistrationStore.provisioningProfilesZipURL;
  }

  @computed get isDistributingRelease() {
    return deviceRegistrationStore.isDistributingRelease;
  }

  @computed get deviceRegistrationErrorMessage() {
    return deviceRegistrationStore.errorMessage;
  }

  @computed get isDeviceRegistrationShowingErrorPage() {
    return deviceRegistrationStore.isShowingErrorPage;
  }

  @computed get unprovisionedDevicesInLatestRelease() {
    return this.unprovisionedDevicesInRelease || deviceRegistrationStore.unprovisionedDevicesInLatestRelease;
  }

  @computed get isPendingUnprovisionedDevices() {
    return this.isGettingUnprovisionedDevices === ExternalDataState.Pending;
  }

  /*
   * Returns the group that should be pre selected on the group selection page.
   */
  @computed private get defaultDistributionGroup() {
    switch (this.groupWizardParent) {
      case GroupWizardParent.DistributionGroupDetails:
        return this.distributionGroupListStore.selectedGroup;
      case GroupWizardParent.ReleaseDetails:
        if (this.onlyDistributionGroup && !this.isCurrentReleaseDestination(this.onlyDistributionGroup.id)) {
          return this.onlyDistributionGroup;
        }
        return null;
      default:
        return this.onlyDistributionGroup;
    }
  }

  @computed private get onlyDistributionGroup() {
    const groups = this.distributionGroupListStore.dataArray;
    return groups.length === 1 ? groups[0] : null;
  }

  public clearDeviceRegistrationErrorMessage() {
    deviceRegistrationStore.clearErrorMessage();
  }

  @action
  public async setUnprovisionedDevicesForRelease(release: Release, distributionGroupName: string): Promise<void> {
    this.isGettingUnprovisionedDevices = ExternalDataState.Pending;
    await this.getUnprovisionedDevicesForReleaseRequest(distributionGroupName, release.id.toString(10))
      .then(
        action((devices: ServerDevice[]) => {
          this.isGettingUnprovisionedDevices = ExternalDataState.Loaded;
          const transformedDevices = DeviceListStore.transform(devices);
          this.unprovisionedDevicesInRelease = transformedDevices
            ? Array.from(transformedDevices).filter((device) => device.status === Status.Unprovisioned)
            : [];
          deviceRegistrationStore.setDevicesToBeRegistered(this.unprovisionedDevicesInRelease);
          deviceRegistrationStore.setUnprovisionedDevicesInLatestRelease(this.unprovisionedDevicesInRelease);
        })
      )
      .error(() => {
        this.isGettingUnprovisionedDevices = ExternalDataState.Failed;
      });
  }

  @computed get pendingUnprovisionedDevices(): boolean {
    return this.isGettingUnprovisionedDevices === ExternalDataState.Pending;
  }

  @computed get currentRelease(): Release {
    return this.release!;
  }

  @computed get isNextButtonEnabled(): boolean {
    return (
      !this.deviceRegistrationIsChecked ||
      (this.deviceRegistrationIsChecked &&
        !!this.appleAccountServiceConnectionId &&
        !!this.appleCertificateServiceConnectionId &&
        deviceRegistrationStore.errorPage === DeviceRegistrationErrorPage.None &&
        deviceRegistrationStore.isConnectedToAppleDeveloper &&
        !deviceRegistrationStore.allDeviceTypesReachedLimit)
    );
  }

  private isCurrentReleaseDestination(distributionGroupId: string): boolean {
    if (!distributionGroupId) {
      return false;
    }
    const existingDestinations = this.currentRelease && this.currentRelease.destinations;
    const isDestination = isEmpty(existingDestinations) ? false : some(existingDestinations!, { id: distributionGroupId });
    return isDestination;
  }

  private getUnprovisionedDevicesForReleaseRequest(groupName: string, releaseId: string): Promise<ServerDevice[]> {
    return apiGateway.get<ServerDevice[]>(Urls.GetUnprovisionedDevicesInRelease, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
        distribution_group_name: groupName,
        release_id: releaseId,
      },
    });
  }

  private async createExternalBuild(): Promise<Release> {
    const snakeCaseRelease = await apiGateway.post<caseConvertedAny>(Urls.PostExternalReleasePath, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
      },
      body: {
        external_download_url: this.externalBuildUrl,
        build_version: this.buildVersion,
        build_number: this.buildNumber,
      },
    });
    const release = convertSnakeToCamelCase<Release>(snakeCaseRelease);
    release.isExternalBuild = true;
    release.downloadStats = { uniqueCount: 0, totalCount: 0 };
    return release;
  }

  private async wrapDistributeRelease(): Promise<ApiReleaseUpdateResponse> {
    const destinations = this.getReleaseDestinations();
    const apiReleaseUpdate = await releaseDestinationAssociationStore.putReleaseDetails(
      this.release!.id,
      this.releaseNotes,
      destinations
    );
    const requests = releaseDestinationAssociationStore.distributeRelease(
      this.release!.id,
      this.mandatoryUpdate,
      destinations,
      this.notifyTesters
    );
    this.handleDistributeResponses(requests, destinations, apiReleaseUpdate);
    return apiReleaseUpdate;
  }

  private handleDistributeResponses(
    requests: DistributeReleaseResourceRequest[],
    destinations: ReleaseDestination[],
    putReleaseDetails: ApiReleaseUpdateResponse
  ) {
    let pendingRequests = requests.length;
    let didFail = false;
    requests.forEach((request) => {
      request.onFailure(() => {
        pendingRequests--;
        didFail = true;
        if (!pendingRequests && didFail) {
          this.handleErrors(
            destinations,
            t("distribute:wizardStrings.distributeDestinationError", { count: destinations.length, releaseNumber: this.release!.id })
          );
        }
      });
      request.onSuccess((data) => {
        pendingRequests--;

        // Per the old code, data can apparently sometimes come back as undefined. So, we have to be careful in how we use it here.
        // Always check for its existence before using.
        putReleaseDetails.provisioningStatusUrl = (data && data.provisioningStatusUrl) || (null as any);
        destinations = data
          ? destinations.filter((dest) =>
              dest.destinationType === "tester" ? (dest as ReleaseTesterDestination).email !== data.leftKey : dest.id !== data.leftKey
            )
          : [];
        if (!pendingRequests && didFail) {
          this.handleErrors(
            destinations,
            t("distribute:wizardStrings.distributeDestinationError", { count: destinations.length, releaseNumber: this.release!.id })
          );
        }
        if (requests.length === 1 && data) {
          this.checkAndPollIfResign(data);
        }
      });
    });
  }

  private handleErrors(destinations: ReleaseDestination[], errorMessage: string) {
    locationStore.goUp();
    failedDestinationsStore.setDestinations(this.getDestinationWrappersFromReleaseDestinations(destinations));
    failedDestinationsStore.setReleaseNumber(this.release!.id);
    this.showDistributionErrorNotification(errorMessage);
  }

  private getReleaseDestinations(): ReleaseDestination[] {
    return this.destinations.map(DestinationHelper.createReleaseDestination);
  }

  private showDistributionErrorNotification(message: string): void {
    let notification: Notification = {
      persistent: true,
      message,
      onDismiss: () => failedDestinationsStore.reset(),
    };

    if (failedDestinationsStore.destinations.length > 0) {
      notification = {
        ...notification,
        buttonText: t("common:button:viewError"),
        action: () => failedDestinationsStore.enableFailedDestinationsDialog(),
      };
    }

    notify(notification);
  }

  private getDestinationWrappersFromReleaseDestinations(releaseDestinations: ReleaseDestination[]): DestinationWrapper[] {
    const destinationWrappers: DestinationWrapper[] = [];
    this.destinations.forEach((d) => {
      const foundItem = releaseDestinations.find((rd) => rd.id === d.destination.id);
      if (foundItem) {
        destinationWrappers.push(d);
      }
    });
    return destinationWrappers;
  }

  private get distributionGroupListStore() {
    return distributionStores.getDistributionGroupListStore(appStore.app);
  }

  // Upload handlers
  private onUploadStarted = () => {
    this.track("New upload started");
  };

  private onUploadFinished = (response: Release) => {
    this.track("Upload complete", true, { result: "succeed" });
    this.reset();
    this.setRelease(response);
  };

  private reset() {
    this.setBuildVersion("");
    this.setBuildNumber("");
  }

  private onGetUploadUrlFinished = () => {
    this.track("Get upload url complete");
  };

  private onUploadFailed = (response: any) => {
    // TODO: Replace this once shared alert system is available
    const extractedResponse = ResponseHelper.extractResponse(response);
    this.track("Upload complete", true, { result: "fail", ...extractedResponse });
  };

  public isBuildIntegrationAvailable(): boolean {
    return appStore.app.isSupportedForBeacon("build");
  }

  public getTabTitle(page: WizardPage) {
    if (page === WizardPage.SourceSelection) {
      if (this.isBuildIntegrationAvailable() && this.source === DistributeSourceType.Branch) {
        return Strings.WizardPages.SelectBranch;
      }
    }
    return WizardPages[page];
  }

  public distributionGroupDetailsStore() {
    return distributionStores.getDistributionGroupDetailsStore(this.distributionGroup!.name!);
  }

  public resetDeviceRegistrationIfFinished() {
    if (this.distributionGroup && deviceRegistrationStore.hasFinishedResigningDistributionGroupRelease(this.distributionGroup.name)) {
      deviceRegistrationStore.initialize();
    }
  }

  public get hasSelectedGroups(): boolean {
    return !isEmpty(this.selectedGroups);
  }

  public get hasSelectedTesters(): boolean {
    return !isEmpty(this.selectedTesters);
  }
}

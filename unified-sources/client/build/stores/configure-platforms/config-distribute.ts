import { observable, action, computed } from "mobx";

import { RepoStore } from "../repo-store";
import { appStore } from "@root/stores";
import { IAHDistributionGroup, IAHBranchConfiguration, IDistributionStore, AutoDistributionDestinationType } from "@root/data/build";
import { ConfigurePlatformHandler, ConfigurePlatformCommon, ConfigureMessage, BranchData } from "./config-base";
import { DestinationAutocompleteStore } from "@root/distribute/stores/destination-autocomplete-store";
import { DestinationPillsTagStore } from "@root/distribute/distribution-groups/destination-pills/destination-pills-ui-store";
import { ApiExternalStoreRequest } from "@root/api/clients/stores/api";

export class ConfigurePlatformDistribute extends ConfigurePlatformHandler {
  public destinationUIStore = new DestinationPillsTagStore();
  public destinationAutocompleteStore = new DestinationAutocompleteStore();

  @observable
  public distributeEnabled: boolean = false;

  @observable
  public selectedDestinationId: string = "";

  @observable
  public selectedGroupsDestinations = observable.array<string>();

  @observable
  public selectedStoresDestinations = observable.array<string>();

  @observable
  private currentDestinationType?: AutoDistributionDestinationType;

  @observable
  public isSilent: boolean = false;

  @observable
  public releaseNotes: string = "";

  @action
  public selectDestinationId = (destinationId: string) => {
    this.selectedDestinationId = destinationId;
    if (this.selectedDestinationType === AutoDistributionDestinationType.Store) {
      this.selectDestinations([destinationId]);
    }
  };

  @computed
  public get selectedDestinations(): string[] {
    switch (this.selectedDestinationType) {
      case AutoDistributionDestinationType.Groups: {
        return this.selectedGroupsDestinations.slice();
      }
      case AutoDistributionDestinationType.Store: {
        return this.selectedStoresDestinations.slice();
      }
      default: {
        return [];
      }
    }
  }

  @action
  public selectDestinations = (destinations: string[]) => {
    switch (this.selectedDestinationType) {
      case AutoDistributionDestinationType.Groups: {
        this.selectedGroupsDestinations = observable.array(destinations);
        break;
      }
      case AutoDistributionDestinationType.Store: {
        this.selectedStoresDestinations = observable.array(destinations);
        break;
      }
    }
  };

  @action
  public setReleaseNotes = (event: { target: { value: string } }) => (this.releaseNotes = event.target.value);

  @computed
  public get showStores(): boolean {
    return appStore.app && (appStore.app.isAndroidApp || appStore.app.isIosApp);
  }

  @action
  public setDistributeEnabled(value: boolean) {
    this.distributeEnabled = value;
  }

  @computed
  public get isLoading(): boolean {
    const { distributionStoresStore, distributionGroupsStore } = this.repoStore;
    return distributionStoresStore.isPending || distributionGroupsStore.isPending;
  }

  @computed
  public get stores(): IDistributionStore[] {
    const distributionStoresStore = this.repoStore.distributionStoresStore;
    return distributionStoresStore.grouppedStores;
  }

  @computed
  public get selectedGroup(): IAHDistributionGroup | undefined {
    return this.allGroups.find((group) => group.id === this.selectedDestinationId);
  }

  @computed
  public get selectedStore(): IDistributionStore | undefined {
    return this.stores.find((store) => store.id === this.selectedDestinationId);
  }

  @computed
  public get selectedDestination(): IAHDistributionGroup | IDistributionStore | undefined {
    if (this.selectedDestinationType === AutoDistributionDestinationType.Store) {
      return this.selectedStore;
    } else {
      return this.selectedGroup;
    }
  }

  @computed
  public get selectedDestinationType(): AutoDistributionDestinationType {
    if (this.currentDestinationType) {
      return this.currentDestinationType;
    }
    if (this.selectedStore) {
      return AutoDistributionDestinationType.Store;
    }
    return AutoDistributionDestinationType.Groups;
  }

  @computed
  public get selectedDestinationSubtype(): ApiExternalStoreRequest.ApiTypeEnum | undefined {
    return this.selectedDestinationType === AutoDistributionDestinationType.Store && this.selectedStore
      ? this.selectedStore.type
      : undefined;
  }

  @action
  public setDestinationType(destinationType: AutoDistributionDestinationType) {
    this.currentDestinationType = destinationType;
  }

  @action
  public setIsSilent = (value: boolean) => {
    this.isSilent = value;
  };

  @computed
  public get allGroups(): IAHDistributionGroup[] {
    const distributionGroupsStore = this.repoStore.distributionGroupsStore;
    if (!distributionGroupsStore.isLoaded || !distributionGroupsStore.data) {
      return [];
    }

    return distributionGroupsStore.data;
  }

  private primaryHandler?: ConfigurePlatformCommon;

  constructor(repoStore: RepoStore, primaryHandler?: ConfigurePlatformCommon) {
    super(repoStore);

    this.primaryHandler = primaryHandler;
  }

  @action
  public onBranchConfigurationPreLoaded(branchData: BranchData) {
    const config = branchData.config;

    if (config && config.toolsets && config.toolsets.distribution) {
      const distribution = config.toolsets.distribution;
      this.selectedDestinationId = config.toolsets.distribution.distributionGroupId || "";
      this.releaseNotes = config.toolsets.distribution.releaseNotes || "";
      this.distributeEnabled = !!this.selectedDestinationId;
      if (distribution.destinationType && distribution.destinations) {
        this.distributeEnabled = true;
        this.currentDestinationType = distribution.destinationType;
        this.selectDestinations(distribution.destinations);
        if (this.currentDestinationType === AutoDistributionDestinationType.Groups) {
          this.isSilent = !!distribution.isSilent;
        }
        if (
          this.currentDestinationType === AutoDistributionDestinationType.Store &&
          distribution.destinations &&
          distribution.destinations.length === 1
        ) {
          this.selectedDestinationId = distribution.destinations[0];
        }
      } else {
        // make old configuration compatible with the new UI
        // if list of stores/groups not awailable at this moment, it will be updated later by checkDistributionType handler
        if (this.selectedStore) {
          this.currentDestinationType = AutoDistributionDestinationType.Store;
        }
        if (this.selectedGroup) {
          this.currentDestinationType = AutoDistributionDestinationType.Groups;
        }
        this.selectDestinations([this.selectedDestinationId]);
      }
    }
  }

  @action
  public checkDistributionType = () => {
    if (!this.currentDestinationType && this.selectedDestinationId) {
      this.currentDestinationType = this.selectedStore
        ? AutoDistributionDestinationType.Store
        : AutoDistributionDestinationType.Groups;
      this.selectDestinations([this.selectedDestinationId]);
    }
  };

  @action
  public onAllBranchDataAvailable(branchData: BranchData) {
    // make sure all our props are properly set
    if (!branchData.wasPreloaded) {
      this.onBranchConfigurationPreLoaded(branchData);
    }
  }

  @computed
  public get isValid(): boolean {
    if (this.distributeEnabled && !this.selectedDestinationId) {
      if (this.selectedDestinationType === AutoDistributionDestinationType.Groups) {
        return this.selectedDestinations && this.selectedDestinations.length > 0;
      }
      if (this.selectedDestinationType === AutoDistributionDestinationType.Store) {
        return this.selectedDestinations && this.selectedDestinations.length === 1;
      }

      return false;
    }

    if (this.isLoading) {
      return false;
    }

    return true;
  }

  public save(config: IAHBranchConfiguration, telemetry?: Object): void {
    if (this.distributeEnabled && !this.distributeToggleDisabled()) {
      config.toolsets.distribution = {
        destinationType: this.selectedDestinationType,
        destinationSubtype: this.selectedDestinationSubtype,
        destinations: this.selectedDestinations,
      };

      if (this.selectedDestinationType === AutoDistributionDestinationType.Groups) {
        config.toolsets.distribution.isSilent = this.isSilent;
      }

      if (this.selectedDestinationType === AutoDistributionDestinationType.Store) {
        config.toolsets.distribution.releaseNotes = this.releaseNotes;
      }
    }
  }

  public distributeToggleDisabled(): boolean {
    return !!this.primaryHandler && this.primaryHandler.distributeToggleDisabled();
  }

  public distributeMessage(): ConfigureMessage | undefined {
    return this.primaryHandler && this.primaryHandler.distributeMessage();
  }
}

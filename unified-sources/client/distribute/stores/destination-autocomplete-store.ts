import { debounce } from "lodash";
import { appStore } from "@root/stores";
import { DestinationWrapper } from "../models/destination-wrapper";
import { DistributionDestinationType } from "../models/destination-type";
import { action, observable, computed } from "mobx";
import { distributionStores } from "./distribution-stores";
import { AadGroupSuggestionsStore, getAADGroupSuggestionStore } from "./aad-group-suggestions-store";
import { distributionGroupStore } from "@root/data/distribute";
import { DestinationHelper } from "@root/distribute/utils/destination-helper";

export interface DestinationAutocompleteInputStore {
  groups: DestinationWrapper[];
  search(input: string): void;
  searchDebounced(term: string): void;
  autocompleteItems: DestinationWrapper[];
}

export class DestinationAutocompleteStore implements DestinationAutocompleteInputStore {
  constructor() {
    getAADGroupSuggestionStore().then((store) => {
      this.aadGroupSuggestionsStore = store;
    });
  }

  private aadGroupSuggestionsStore?: AadGroupSuggestionsStore;

  @observable
  public groupsLoaded = false;

  @computed
  private get testersAndGroups(): DestinationWrapper[] {
    return [...this.testers, ...this.groups];
  }

  @observable
  private testers: DestinationWrapper[] = [];

  @observable
  public groups: DestinationWrapper[] = [];

  @observable
  private aadGroups: DestinationWrapper[] = [];

  @computed get isDistributionGroupStoreReady(): boolean {
    return !distributionGroupStore.isFetchingCollection;
  }

  @action
  public loadGroups() {
    this.groupsLoaded = false;
    return distributionGroupStore
      .fetchCollection({
        ownerName: appStore.app.owner.name,
        appName: appStore.app.name,
      })
      .onSuccess((groups) => {
        this.groupsLoaded = true;
        groups!.forEach((group) =>
          this.groups.push(DestinationHelper.createDestinationFromSource(group, DistributionDestinationType.DistributionGroup))
        );
      });
  }

  @action
  public loadTestersAndGroups() {
    distributionStores.appTestersStore
      .fetchAppTesters()
      .then((testers) =>
        testers.forEach((user) =>
          this.testers.push(DestinationHelper.createDestinationFromSource(user, DistributionDestinationType.Tester))
        )
      )
      .catch((e) => null);

    this.loadGroups();
  }

  @action
  search = (input: string) => {
    this.aadGroups = [];

    if (!this.aadGroupSuggestionsStore) {
      return;
    }

    this.aadGroupSuggestionsStore.searchGroups(input).then((aadGroups) =>
      aadGroups.map((group) => {
        this.aadGroups.push(DestinationHelper.createDestinationFromSource(group, DistributionDestinationType.AADGroup));
      })
    );
  };

  public searchDebounced = debounce(this.search, 200);

  @computed
  get autocompleteItems(): DestinationWrapper[] {
    return [...this.testersAndGroups, ...this.aadGroups];
  }

  @computed
  public get destinationIdsMapping(): { [id: string]: DestinationWrapper } {
    return this.autocompleteItems.reduce((map, destination) => {
      if (destination.destination) {
        map[destination.destination.id!] = destination;
      }
      return map;
    }, {});
  }
}

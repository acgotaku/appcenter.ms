import { observable, action, computed } from "mobx";
import { startsWith, isEmpty, find, debounce, noop } from "lodash";
import { IDistributionGroupUser } from "../models/distribution-group-user";
import { IUser } from "@lib/common-interfaces";
import { distributionStores } from "../stores/distribution-stores";
import { AadGroupSuggestionsStore, getAADGroupSuggestionStore } from "../stores/aad-group-suggestions-store";
import validations from "@root/shared/formsy/validation-rules";
import { ExternalDataState } from "@root/shared";
import { IAddTesterInputStore } from "../../shell/add-tester-input/add-tester-input";
import { distributionGroupTesterStore } from "@root/data/distribute/stores/distribution-group-tester-store";

export class AddTesterInputStore implements IAddTesterInputStore {
  private aadGroupSuggestionsStore?: AadGroupSuggestionsStore;
  @observable public autocompleteValue = "";
  @observable private autocompleteData: any[] = [];
  @observable public state!: ExternalDataState;

  @computed get isPending() {
    return this.state === ExternalDataState.Pending;
  }

  @computed
  public get autocompleteItems() {
    if (this.organizationName) {
      // searching for shared group suggestions
      const sharedDistributionGroupTesters = distributionGroupTesterStore.resources.filter(
        (tester) => tester.organizationName === this.organizationName
      );
      return this.autocompleteData.concat(sharedDistributionGroupTesters);
    }
    return this.autocompleteData;
  }

  constructor(private organizationName?: string) {
    if (!this.organizationName) {
      // searching for normal group suggestions
      distributionStores.appTestersStore
        .fetchAppTesters()
        .then(
          action((users: IUser[]) => {
            this.autocompleteData = users;
          })
        )
        .catch(noop);
    }

    getAADGroupSuggestionStore(this.organizationName).then((store) => {
      this.aadGroupSuggestionsStore = store;
    });
  }

  @action public setAutocompleteValue = (autocompleteValue: string) => {
    this.autocompleteValue = autocompleteValue;
  };

  private isValidEmail(email: string): boolean {
    return validations.isEmail(undefined, email);
  }

  public getTesterByInputValue = (value: string): IDistributionGroupUser => {
    let userToAdd: IDistributionGroupUser;
    this.setAutocompleteValue("");
    if (this.isValidEmail(value)) {
      userToAdd = this._getTesterByEmail(value);
    } else {
      userToAdd = this._getTesterByName(value);
    }
    return userToAdd;
  };

  @action public clear = (): void => {
    this.autocompleteValue = "";
    this.autocompleteData = [];
  };

  @action public searchGroups = (term: string) => {
    if (!this.aadGroupSuggestionsStore) {
      return;
    }
    this.state = ExternalDataState.Pending;

    this.aadGroupSuggestionsStore
      .searchGroups(term)
      .then(
        action((groups: IUser[]) => {
          if (Array.isArray(groups)) {
            // filtering out previous AAD results
            if (groups.length) {
              this.autocompleteData = this.autocompleteData.filter((item) => !item.aad_group_id);
            }
            groups.forEach((group) => {
              // ignore existing results from previous searches, which may contain individual users results in-addition to groups
              if (!this.autocompleteData.find((item) => item.id === group.id)) {
                this.autocompleteData.push(group);
              }
            });
          }
          this.state = ExternalDataState.Idle;
        })
      )
      .error(() => {
        this.state = ExternalDataState.Failed;
      });
  };

  protected _getTesterByEmail(email: string): IDistributionGroupUser {
    const users = distributionStores.appTestersStore.data;
    let userToAdd: IDistributionGroupUser = find(users!, (u) => u.email!.toLowerCase() === email.toLowerCase());
    userToAdd = userToAdd || { email: email };
    return userToAdd;
  }

  protected _getTesterByName(name: string): IDistributionGroupUser {
    const users = distributionStores.appTestersStore.data;
    let userToAdd: IDistributionGroupUser;
    if (!isEmpty(name)) {
      userToAdd = find(users!, (u) => startsWith(u.display_name!.toLowerCase(), name.toLowerCase()));
    }
    return userToAdd!;
  }

  public searchGroupsDebounced = debounce(this.searchGroups, 200);
}

import { remove, isEmpty, noop } from "lodash";
import { t } from "@root/lib/i18n";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { notifyScreenReader } from "@root/stores";
import { DistributionGroup } from "@root/data/distribute/models/distribution-group";
import { DistributionGroupUser } from "../models/distribution-group-user";
import { distributionStores } from "./distribution-stores";
import { StringHelper } from "../utils/string-helper";
import { AddTesterInputStrings } from "../utils/strings";
import { observable, action, IObservableArray } from "mobx";
import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { Urls } from "../utils/constants";
import { aadGroupsListStore } from "@root/data/distribute/stores/aad-groups-list-store";

export class DistributionGroupCreateStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<DistributionGroup> {
  public fetchDataPromise!: Promise<DistributionGroup>;
  public readonly addedUsers: IObservableArray<DistributionGroupUser> = observable([]);
  @observable public groupName!: string;
  @observable public groupNameErrorMessage!: string;
  @observable public addTesterErrorMessage!: string;
  @observable public errorMessage!: string; // For all other error messages that come from backend
  @observable public groupId!: string;
  @observable public isPublic!: boolean;

  constructor() {
    super(ExternalDataState.Loaded);
  }

  @action
  public addTesterOrGroup(tester: DistributionGroupUser): boolean {
    if (!this.isAdded(tester)) {
      this.setAddTesterErrorMessage("");
      this.addedUsers.push(tester);
      return true;
    } else {
      this.setAddTesterErrorMessage(
        StringHelper.format(AddTesterInputStrings.MessageAlreadyAdded, tester.aad_group_id ? tester.display_name : tester.email)
      );
      return false;
    }
  }

  @action
  public removeTester(user: DistributionGroupUser): void {
    this.setAddTesterErrorMessage("");
    remove(this.addedUsers, (existingUser) => {
      // user.id can be null if the user does not have an account or the profile is not fetched yet
      // compare with email if id is not available
      return user.id ? existingUser.id === user.id : existingUser.email === user.email;
    });
  }

  public createDistributionGroup(): Promise<DistributionGroup> {
    const fetchDataPromise = apiGateway
      .post<DistributionGroup>(Urls.PostCreateDistributionGroup, {
        params: {
          app_name: appStore.name,
          owner_name: appStore.ownerName,
        },
        body: {
          name: this.groupName,
          is_public: this.isPublic,
        },
      })
      .then((json) => {
        if (!isEmpty(this.addedUsers)) {
          const { testerListStore } = distributionStores.getDistributionGroupDetailsStore(this.groupName);
          const testersToAdd = this.addedUsers.filter((tester) => !tester.aad_group_id).map((tester) => tester.email!);
          const aadGroupsToAdd = this.addedUsers.filter((tester) => tester.aad_group_id);

          const promises: Promise<void>[] = [];

          if (testersToAdd.length) {
            promises.push(testerListStore.addTesters(testersToAdd));
          }

          if (aadGroupsToAdd.length) {
            promises.push(aadGroupsListStore.postResources(aadGroupsToAdd, { distributionGroupName: this.groupName }).then(noop));
          }

          return Promise.all(promises).then(() => json);
        }

        return json;
      })
      .then(
        action((json: DistributionGroup) => {
          this.groupId = json.id;
          notifyScreenReader({ message: t("distribute:groups.wasCreated", { name: json.name }), delay: 1500 });
          return json;
        })
      )
      .catch(
        action((error: any) => {
          this.errorMessage = (error && error.body && error.body.error && error.body.error.message) || "";
          throw error;
        })
      );

    return this.load(fetchDataPromise);
  }

  @action public setGroupName(name: string): void {
    this.groupName = name.trim();
  }

  @action public setGroupNameErrorMessage(errorMessage: string): void {
    this.groupNameErrorMessage = errorMessage;
  }

  @action public setAddTesterErrorMessage(errorMessage: string): void {
    this.addTesterErrorMessage = errorMessage;
  }

  @action public setIsPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }

  @action
  public resetStore(): void {
    this.groupNameErrorMessage = undefined as any;
    this.addTesterErrorMessage = undefined as any;
    this.errorMessage = undefined as any;
    this.addedUsers.splice(0, this.addedUsers.length);
    this.groupId = "";
    this.groupName = "";
    this.data = null as any;
    this.isPublic = false;
  }

  private isAdded(tester: DistributionGroupUser): boolean {
    return tester.aad_group_id ? this.isGroupAdded(tester.id!) : this.isUserAdded(tester.email!);
  }

  private isUserAdded(email: string): boolean {
    return this.addedUsers.some((user) => user.email === email);
  }

  private isGroupAdded(id: string): boolean {
    return this.addedUsers.some((user) => user.id === id);
  }
}

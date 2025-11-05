import { DistributionGroupUser } from "../models/distribution-group-user";
import { distributionStores } from "./distribution-stores";
import { observable, action } from "mobx";
import { appStore } from "@root/stores";
import { StringHelper } from "../utils/string-helper";
import { AddTesterInputStrings } from "../utils/strings";
import { OS } from "../models/os";
import { aadGroupsListStore } from "@root/data/distribute/stores/aad-groups-list-store";
import { noop } from "lodash";

export class TesterTableStore {
  @observable public addTesterErrorMessage!: string;

  // Note: this is a duplicate value from "core-services/accounts-management-service/config/default.json"
  private readonly MAX_MEMBERS_PER_GROUP = 30000;

  private _groupName: string;
  public get groupName(): string {
    return this._groupName;
  }

  constructor(groupName) {
    this._groupName = groupName;
  }

  private checkMembersAmount(data: DistributionGroupUser[]) {
    if (data.length > this.MAX_MEMBERS_PER_GROUP && data.some((user) => user.invite_pending)) {
      this.setAddTesterErrorMessage(StringHelper.format(AddTesterInputStrings.MessageOverflowWarning, this.MAX_MEMBERS_PER_GROUP));
    }
  }

  @action public setAddTesterErrorMessage(errorMessage: string): void {
    this.addTesterErrorMessage = errorMessage;
  }

  @action public addTesterOrGroup(tester: DistributionGroupUser): boolean {
    const { testerListStore, deviceWithTesterStore } = distributionStores.getDistributionGroupDetailsStore(this._groupName);
    if (!tester.aad_group_id) {
      if (!testerListStore.alreadyAdded(tester.email!)) {
        testerListStore
          .addTesters([tester.email!])
          .then(() => {
            distributionStores.getDistributionGroupListStore(appStore.app).fetchDistributionGroupsList();
            testerListStore.fetchTesterList().then(() => {
              this.checkMembersAmount(testerListStore.dataArray);
            });
            if (OS.isIos(appStore.app.os)) {
              deviceWithTesterStore.fetchDevices();
            }
          })
          .catch(noop);
        this.checkMembersAmount(testerListStore.dataArray);
      } else {
        this.setAddTesterErrorMessage(StringHelper.format(AddTesterInputStrings.MessageAlreadyAdded, tester.email));
        return false;
      }
    } else {
      if (!aadGroupsListStore.alreadyAdded(this._groupName, tester.id!)) {
        aadGroupsListStore.postResources([tester], { distributionGroupName: this._groupName }).then(() => {
          distributionStores.getDistributionGroupListStore(appStore.app).fetchDistributionGroupsList();
          aadGroupsListStore.fetchCollection({ distributionGroupName: this._groupName });
          if (OS.isIos(appStore.app.os)) {
            deviceWithTesterStore.fetchDevices();
          }
        });
      } else {
        this.setAddTesterErrorMessage(StringHelper.format(AddTesterInputStrings.MessageAlreadyAdded, tester.display_name));
        return false;
      }
    }
    return true;
  }

  @action public async deleteTesters(selected: DistributionGroupUser[]): Promise<void> {
    const { testerListStore, deviceWithTesterStore } = distributionStores.getDistributionGroupDetailsStore(this._groupName);
    const emails = Array.from(selected)
      .filter(({ aad_group_id }) => !aad_group_id)
      .map(({ email }) => email);
    const groups = Array.from(selected).filter(({ aad_group_id }) => aad_group_id);
    this.setAddTesterErrorMessage("");

    if (emails && emails.length > 0) {
      await testerListStore.deleteTesters(emails as any);
    }
    if (groups && groups.length > 0) {
      await aadGroupsListStore.deleteResources(groups, { distributionGroupName: this._groupName });
    }
    distributionStores.getDistributionGroupListStore(appStore.app).fetchDistributionGroupsList();
    aadGroupsListStore.fetchCollection({ distributionGroupName: this._groupName });
    if (OS.isIos(appStore.app.os)) {
      deviceWithTesterStore.fetchDevices();
    }
  }

  @action public deleteTester(tester: DistributionGroupUser): void {
    this.deleteTesters([tester]);
  }
}

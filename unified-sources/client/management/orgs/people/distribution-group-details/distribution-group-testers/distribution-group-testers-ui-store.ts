import { computed, reaction, IReactionDisposer, observable, action } from "mobx";
import { AddTesterStore } from "../../../../../shell/add-tester-input/add-tester-input";
import { distributionGroupTesterStore } from "@root/data/distribute/stores/distribution-group-tester-store";
import { distributionGroupTesterAssociationStore } from "@root/data/distribute/stores/distribution-group-tester-association-store";
import { distributionGroupStore } from "@root/data/distribute/stores/distribution-group-store";
import { apiGateway } from "@root/lib/http";
import { notificationStore } from "@root/stores";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { API } from "@root/data/distribute/constants";
import { t } from "@root/lib/i18n";
import { logger } from "@root/lib/telemetry";
import { DistributionGroupTester } from "@root/data/distribute/models/distribution-group-tester";
import { DistributionGroupUser } from "@root/distribute/models/distribution-group-user";
import { aadGroupsListStore } from "@root/data/distribute/stores/aad-groups-list-store";

export class DistributionGroupTestersUiStore implements AddTesterStore {
  private updateTesterCount: IReactionDisposer;
  @observable public testerInputErrorMessage!: string;
  @observable public groupName: string;
  @observable public organizationName: string;

  constructor(organizationName: string, groupName: string) {
    this.groupName = groupName;
    this.organizationName = organizationName;
    this.updateTesterCount = reaction(
      () => this.group && this.aadGroupsAndTestersList.length,
      (length) => {
        if (typeof length !== "undefined") {
          this.group!.totalUsersCount = length;
        }
      }
    );
  }

  @computed
  public get isFetchingTesters() {
    return distributionGroupTesterStore.isFetchingRelationship(
      `${distributionGroupTesterAssociationStore.id}-${distributionGroupTesterAssociationStore.internalDistributionGroupKey(
        this.organizationName,
        this.groupName
      )}`
    );
  }

  @computed
  public get group() {
    return distributionGroupStore.findGroupForOrganization(this.organizationName, this.groupName);
  }

  @computed
  public get testers() {
    return this.group ? distributionGroupTesterStore.getTestersForGroup(this.group) : [];
  }
  @computed
  public get aadGroupsAndTestersList(): DistributionGroupUser[] {
    const groups = aadGroupsListStore.getAadGroupsForGroup(this.groupName);
    return groups.concat(this.testers);
  }

  public clearReaction() {
    this.updateTesterCount();
  }

  public async resendInvitation(email: string, organizationName: string, groupName: string): Promise<void> {
    const body = { user_emails: [email] };

    if (!this.testers.some((o) => o.email === email)) {
      const message = t("distribute:testers.resendInvitationUnexpectedError", { email });
      logger.warn(message);
      notificationStore.notify({
        persistent: true,
        message,
      });
      return Promise.reject(message); // not localized because this is a developer-only message that is never shown to users
    }

    try {
      await apiGateway.post(API.ORG_DISTRIBUTION_GROUP_RESEND_INVITE, {
        params: {
          org_name: organizationName,
          group_name: groupName,
        },
        responseType: RESPONSE_TYPES.TEXT,
        body,
      });

      logger.info("resend invitation");
      notificationStore.notify({
        persistent: false,
        message: t("distribute:testers.resendInvitationSuccess", { email }),
      });
    } catch (err: any) {
      logger.warn("resend invitation failure", err);
      notificationStore.notify({
        persistent: true,
        message: t("distribute:testers.resendInvitationFailure", { email }),
      });
      throw err;
    }
  }

  // @ts-ignore. [Should fix it in the future] Strict error.
  public addTesterOrGroup(tester: DistributionGroupUser): boolean {
    if (tester.aad_group_id) {
      aadGroupsListStore.postResources([tester], { organizationName: this.organizationName, distributionGroupName: this.groupName });
      return true;
    }
    distributionGroupTesterAssociationStore.addTesterToGroup(tester.email!, this.organizationName, this.groupName).onSuccess(() => {
      if (!distributionGroupTesterStore.has(tester.email)) {
        distributionGroupTesterStore.add(
          new DistributionGroupTester({
            email: tester.email,
            organizationName: this.organizationName,
          })
        );
      }
    });

    return true;
  }

  @action
  public async removeTestersOrGroup(testers: DistributionGroupUser[]): Promise<void> {
    const users = Array.from(testers).filter(({ aad_group_id }) => !aad_group_id);
    const groups = Array.from(testers).filter(({ aad_group_id }) => aad_group_id);
    this.setAddTesterErrorMessage("");

    if (groups && groups.length > 0) {
      // AAD groups
      aadGroupsListStore.deleteResources(groups, { organizationName: this.organizationName, distributionGroupName: this.groupName });
    }
    if (users.length) {
      distributionGroupTesterAssociationStore.removeTestersFromGroup(
        users.map((user) => user.email) as any,
        this.organizationName,
        this.groupName!
      );
    }
  }

  @action
  public setAddTesterErrorMessage(errorMessage: string): void {
    this.testerInputErrorMessage = errorMessage;
  }

  @action
  public update(orgName: string, groupName: string): void {
    this.organizationName = orgName;
    this.groupName = groupName;
  }

  public fetchTesters() {
    distributionGroupTesterStore.fetchTestersForGroup(this.organizationName, this.groupName);
  }
}

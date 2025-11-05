import { computed, action, observable, reaction } from "mobx";
import { locationStore } from "@root/stores";
import { deleteDistributionGroupDialogStore } from "./dialog/delete-distribution-group-dialog";
import { DistributionGroup, distributionGroupStore, GROUP_OWNER_TYPE } from "@root/data/distribute";
import { NotificationType } from "@root/shared";
import { VALIDATION_ERRORS, VALIDATIONS } from "../../../../utils/formsy/validations";

export class DistributionGroupSettingsUIStore {
  @observable public name: string | undefined;
  @observable public isPublic;
  @observable private error!: string;

  constructor(private organizationName: string, private distributionGroupName: string, private tab: string) {
    this.name = this.distributionGroup ? this.distributionGroup.displayName : undefined;

    reaction(
      () => !!this.distributionGroup,
      () => this.setName()
    );
  }

  @computed
  public get updateNotification() {
    if (this.error) {
      return {
        type: NotificationType.Error,
        message: this.error,
      };
    }
  }

  @action
  public setName() {
    this.name = this.distributionGroup.displayName?.toString();
  }

  @computed
  public get distributionGroup(): DistributionGroup {
    return distributionGroupStore.findGroupForOrganization(this.organizationName, this.distributionGroupName)!;
  }

  @computed
  public get isFetching(): boolean {
    return distributionGroupStore.isFetching(this.distributionGroup);
  }

  @computed
  public get isDeleting(): boolean {
    return distributionGroupStore.isDeleting(this.distributionGroup);
  }

  @computed
  public get isUpdating(): boolean {
    return distributionGroupStore.isUpdating(this.distributionGroup);
  }

  @computed
  public get isPublicGroup() {
    return typeof this.isPublic === "boolean" ? this.isPublic : this.distributionGroup ? this.distributionGroup.isPublic : false;
  }

  @action
  public onIsPublicToggleChanged = (event: any) => {
    const checked = event.target.checked;
    this.isPublic = checked;
  };

  @action
  public onNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.error = null as any;
    this.name = event.target.value;
    if (!this.name.trim()) {
      this.error = VALIDATION_ERRORS.DISTRIBUTION_GROUP_DISPLAY_NAME.emptyString;
    } else if (this.name.endsWith(" ")) {
      this.error = VALIDATION_ERRORS.DISTRIBUTION_GROUP_DISPLAY_NAME.trailingSpaces;
    } else if (this.name.length > VALIDATIONS.DISTRIBUTION_GROUP_DISPLAY_NAME.maxLength) {
      this.error = VALIDATION_ERRORS.DISTRIBUTION_GROUP_DISPLAY_NAME.maxLength;
    } else if (this.name === ".") {
      this.error = VALIDATION_ERRORS.DISTRIBUTION_GROUP_DISPLAY_NAME.matchRegexp;
    }
  };

  @computed
  public get applyButtonDisabled() {
    if (!this.distributionGroup) {
      return false;
    }
    return !this.name || !!this.error;
  }

  @action
  public confirmDeleteDistributionGroup = (): void => {
    deleteDistributionGroupDialogStore.setVisible(true);
  };

  @action
  public deleteDistributionGroup = (): void => {
    distributionGroupStore
      .deleteGroup(this.distributionGroup, false, {
        ownerType: "org",
        ownerName: this.organizationName,
        groupName: encodeURIComponent(this.distributionGroupName),
      })
      .onSuccess(() => {
        deleteDistributionGroupDialogStore.setVisible(false);
        locationStore.router.push(`/orgs/${this.organizationName}/people/distribution-groups`);
      })
      .onFailure(() => {
        deleteDistributionGroupDialogStore.setVisible(false);
      });
  };

  @action
  public updateSettings = (): void => {
    distributionGroupStore
      .update(this.distributionGroup, { name: this.name, isPublic: this.isPublic }, false, { ownerType: GROUP_OWNER_TYPE.ORG })
      .onSuccess((group: DistributionGroup | undefined) => {
        distributionGroupStore.fetchForRelationship("organizationName", this.organizationName, {
          ownerType: GROUP_OWNER_TYPE.ORG,
        });
        locationStore.router.push(
          `/orgs/${this.organizationName}/people/distribution-groups/${encodeURIComponent(group?.name)}/${this.tab}`
        );
      })
      .onFailure((error: any) => {
        this.error = error.body.error.message;
      });
  };
}

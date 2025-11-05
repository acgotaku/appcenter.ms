import { API } from "@lib/constants/api";
import { portalServer } from "@root/lib/http";
import { logger } from "@root/lib/telemetry";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState, NotificationType } from "@root/shared";
import { organizationStore, userStore } from "@root/stores";
import { action, computed, observable, runInAction, set } from "mobx";

export class UpdateCategoryStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  @observable public accountType: string = "";
  @observable public accountID: string = "";
  @observable public serviceTreeID: string = "";
  @observable public isConfirmationDialogVisible: boolean = false;
  @observable private iniServiceTreeID: string = "";

  constructor() {
    super();

    this.resetState();
  }

  @computed
  get notification(): { message: string; type: NotificationType } {
    switch (this.state) {
      case ExternalDataState.Failed:
        return {
          type: NotificationType.Error,
          message: "Please provide valid service tree id from https://aka.ms/servicetree.",
        };
      case ExternalDataState.Loaded:
        return {
          type: NotificationType.Success,
          message: "Sweet! Service Tree ID was updated successfully.",
        };
      default:
        return null as any;
    }
  }
  @computed
  get isServiceTreeIDUpdated(): boolean {
    return this.serviceTreeID !== this.iniServiceTreeID;
  }

  @action
  public changeInputData = (event): void => {
    this.serviceTreeID = event.target.value;
  };

  @action
  public openConfirmationDialog = (): void => {
    this.isConfirmationDialogVisible = true;
  };

  @action
  public closeConfirmationDialog = (): void => {
    this.isConfirmationDialogVisible = false;
  };

  @action
  public resetState(): void {
    this.state = undefined as any;
  }

  @action
  public changeAccountType(accountType: string): void {
    this.accountType = accountType;
  }

  @action
  public changeServiceTreeID(serviceTreeID: string): void {
    this.serviceTreeID = serviceTreeID;
    this.iniServiceTreeID = serviceTreeID;
  }

  @action
  public setAccountID(accountID: string): void {
    this.accountID = accountID;
  }

  @action
  protected updatedCategoryForOrganization(organizationId: string): void {
    const org = organizationStore.findOrgById(organizationId);
    if (org) {
      const category = { ...org.organization_category, service_tree_id: this.serviceTreeID };
      set(org, { organization_category: category });
    }
  }

  @action
  protected updatedCategoryForUser(userId: string): void {
    const user = userStore.currentUser;
    if (user && user.id === userId) {
      const category = { ...user.user_category, service_tree_id: this.serviceTreeID };
      set(user, { user_category: category });
    }
  }

  @action
  public update(serviceTreeID: string): Promise<void> {
    this.setState(ExternalDataState.Pending);
    const body: { category?: string | null; service_tree_id: string | null } = {
      service_tree_id: serviceTreeID,
    };
    const params = this.accountType === "organization" ? { organizationId: this.accountID } : { userId: this.accountID };

    return portalServer
      .post<any>(this.accountType === "organization" ? API.ORGANIZATION_DETAILS_CATEGORY : API.USER_DETAILS_CATEGORY, {
        body,
        params,
      })
      .then(() => {
        runInAction(() => {
          this.state = ExternalDataState.Loaded;
          if (this.accountType === "organization") {
            this.updatedCategoryForOrganization(this.accountID);
          } else if (this.accountType === "user") {
            this.updatedCategoryForUser(this.accountID);
          }
        });
        logger.info("Category updated successfully");
      })
      .catch((error) => {
        runInAction(() => {
          this.state = ExternalDataState.Failed;
          this.error = error;
          logger.error(`Error updating category: ${error.message}`);
        });
      });
  }
}

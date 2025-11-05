import { observable, action, computed } from "mobx";
import { locationStore, userStore, notificationStore } from "@root/stores";
import { BeaconName } from "@lib/common-interfaces";
import { ResourceRequest } from "@root/data/lib";
import { portalServer } from "@root/lib/http";
import { logger } from "@root/lib/telemetry";

export type Category = {
  displayName: string;
  value: string;
  beaconNames?: BeaconName[];
  docs: string;
  docsDisplayName?: string;
};

const defaultCategory = {
  displayName: "Other",
  value: "other",
  docs: "https://docs.microsoft.com/appcenter/",
  docsDisplayName: "",
};

export const categories: Category[] = [
  { displayName: "Build", value: "build", beaconNames: ["build"], docs: "https://docs.microsoft.com/appcenter/build/" },
  { displayName: "Test Cloud", value: "test", beaconNames: ["test"], docs: "https://docs.microsoft.com/appcenter/test-cloud/" },
  {
    displayName: "Distribute",
    value: "distribute",
    beaconNames: ["distribute"],
    docs: "https://docs.microsoft.com/appcenter/distribution/",
  },
  {
    displayName: "Diagnostics",
    value: "diagnostics",
    beaconNames: ["crashes"],
    docs: "https://docs.microsoft.com/appcenter/diagnostics/",
  },
  {
    displayName: "Analytics",
    value: "analytics",
    beaconNames: ["analytics"],
    docs: "https://docs.microsoft.com/appcenter/analytics/",
  },
  {
    displayName: "My Account",
    value: "account",
    beaconNames: ["overview", "apps", "settings"],
    docs: "https://docs.microsoft.com/appcenter/general/account",
    docsDisplayName: "Account",
  },
  { displayName: "Billing", value: "billing", docs: "https://docs.microsoft.com/appcenter/general/billing" },
  defaultCategory,
];

interface SupportCaseResponse {
  messageId: string;
}

export class CreateSupportCaseModalUIStore {
  private categoryName: string = "Other";

  @observable email: string = userStore.currentUser.email;
  @observable openDialog = false;
  @observable message: string = "";
  @observable overrideCategory: Category | undefined;
  @observable private resourceRequest: ResourceRequest<SupportCaseResponse | undefined, SupportCaseResponse> | undefined;
  @observable caseResponse?: SupportCaseResponse = { messageId: "noMessageId" };

  @computed get isFailed(): boolean {
    return !!this.resourceRequest && !this.resourceRequest.isLoaded && this.resourceRequest.isFailed;
  }

  @computed get isSuccessful(): boolean {
    return !!this.resourceRequest && this.resourceRequest.isLoaded && !this.resourceRequest.isFailed;
  }

  @computed get isSubmitting(): boolean {
    return !!this.resourceRequest && this.resourceRequest.isPending;
  }

  @computed get beaconCategory(): Category | undefined {
    if (locationStore.pathname.includes("billing")) {
      return categories.find(({ value }) => value === "billing");
    } else {
      return categories.find(({ beaconNames = [] }) => !!locationStore.beacon && beaconNames.includes(locationStore.beacon));
    }
  }

  @action createSupportCase = (): void => {
    if (this.dropdownCategory != null) {
      this.categoryName = this.dropdownCategory.displayName;
    }
    const resource = {
      body: {
        body: this.message,
        email: this.email,
        subject: this.categoryName,
      },
    };
    this.resourceRequest = new ResourceRequest(
      portalServer.post<SupportCaseResponse>("/support/cases", resource),
      () => {
        return this.caseResponse;
      },
      (error, data) => {
        if (!error) {
          logger.info("support-menu/submit-clicked");
        }
        this.caseResponse = data || undefined;
      }
    ).onFailure(() => {
      this.sendFailToast();
    });
  };

  @action clearResourceRequest = (): void => {
    this.resourceRequest = undefined;
  };

  @action setCategory = (category: Category | undefined): void => {
    this.overrideCategory = category;
  };

  @computed get dropdownCategory(): Category {
    return this.overrideCategory || this.beaconCategory || defaultCategory;
  }

  @computed get categoryDocsLabel(): string {
    const category = this.dropdownCategory;
    return category.docsDisplayName !== undefined ? category.docsDisplayName : category.displayName;
  }

  @computed get docsLink(): string {
    return this.dropdownCategory.docs;
  }

  @action setMessage = (message: string): void => {
    this.message = message;
  };

  @action onInputMessage = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    this.setMessage(event.target.value);
  };

  @action setEmail = (email: string): void => {
    this.email = email;
  };

  hasExistingEmail(): boolean {
    const hasEmail = !!userStore.currentUser.email;
    if (!hasEmail) {
      logger.info("User has no email address attached to their account");
    }
    return hasEmail;
  }

  @action onInputEmail = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    this.setEmail(event.target.value);
  };

  @action toggleDialog = (isToggled: boolean): void => {
    this.openDialog = isToggled;
  };

  @action clearValues = (): void => {
    this.setMessage("");
    this.setEmail(userStore.currentUser.email);
    this.setCategory(undefined);
    this.clearResourceRequest();
  };

  @action closeModal = (callback): void => {
    this.toggleDialog(false);
    this.clearValues();
    // callback will always be a method to hide the modal
    callback();
  };

  @action confirmCloseModal = (callback): void => {
    if (this.message) {
      this.toggleDialog(true);
    } else {
      this.closeModal(callback);
    }
  };

  sendFailToast = (): void => {
    notificationStore.notify({
      message: "Your message was not submitted, please retry",
      persistent: true,
    });
    this.clearResourceRequest();
  };

  @computed get buttonDisabled(): boolean {
    return !this.message || !this.email;
  }
}

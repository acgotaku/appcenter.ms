import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState, NotificationType } from "@root/shared";
import { IOrganization } from "@lib/common-interfaces";
import { action, runInAction, computed } from "mobx";
import { FetchError } from "../../../lib/http/fetch-error";
import { locationStore, organizationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { API } from "../../constants/api";

export class NewOrgStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IOrganization> {
  constructor() {
    super();
    this.resetState();
  }

  @computed
  get notification(): { message: string; type: NotificationType } {
    const error = this.error as FetchError;

    switch (this.state) {
      case ExternalDataState.Failed:
        return {
          type: NotificationType.Error,
          // @ts-ignore. [Should fix it in the future] Strict error.
          message: ((error) => {
            if (this.state === ExternalDataState.Failed) {
              switch (error.status) {
                case 409:
                  return null; // Handled in `conflictError()`
                case 400:
                  return "Oops. Something seems to be wrong with the data used to create this organization.";
                case 429:
                  return "You can not create more organizations at this time. Please try again later.";
                default:
                  return "Oops. Something went wrong. Please try again.";
              }
            } else {
              return null;
            }
          })(error),
        };
      default:
        return null as any;
    }
  }

  @computed
  get conflictError(): string | undefined {
    const error = this.error as FetchError;

    if (this.state !== ExternalDataState.Failed) {
      return undefined;
    }

    if (error.status === 409) {
      return "An organization or user of this name already exists. Please select a different name.";
    } else {
      return undefined;
    }
  }

  /**
   * Create a new organization.
   */
  @action
  public create(organization: IOrganization): void {
    this.loadVoid(
      apiGateway
        .post<IOrganization>(API.USER_ORGANIZATIONS, {
          body: organization,
          params: {
            include: ["collaborator_role", "collaborators_count"],
          },
        })
        .then((data) => {
          console.log(`Created Org:`, data);
          runInAction(() => {
            // Add collaborators_count set to 1, since it's only the admin for now.
            const newOrganization = Object.assign(data, { collaborators_count: 1 });

            organizationStore.addOrganization(newOrganization);

            // Go to the organization home page.
            locationStore.router.push(organizationStore.homePageUrl(data)!);
          });
          return data;
        })
        .catch((error: FetchError) => {
          console.warn(`Creating organization ${organization.name} failed.`);
          throw error;
        })
    );
  }

  /**
   *
   * Resets the state to undefined.
   */
  @action
  public resetState(): void {
    this.state = undefined as any;
  }
}

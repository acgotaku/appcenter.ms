import { action, computed, observable } from "mobx";
import { BugTrackerService } from "./services-store";
import { locationStore } from "@root/stores";
import { IconName } from "@root/shared";
import { logger } from "@root/lib/telemetry";
import { t } from "@root/lib/i18n";
import { ServiceConnectionCreateStore } from "@root/data/shell/stores/service-connection-create-store";
import { FetchError } from "../../../lib/http/fetch-error";

export interface Connection {
  id: string;
}

export type ConnectionHandler = (connection?: Connection) => void;

/**
 * UI Store for BugTracker wizard page.
 */
export class ServiceConnectionDialogFormUIStore {
  @observable private currentError!: FetchError;
  @observable public service!: BugTrackerService;
  @observable public showDialog: boolean = false;
  @observable public isFormPosting: boolean = false;
  private serviceConnectionCreateStore: ServiceConnectionCreateStore = new ServiceConnectionCreateStore();

  constructor(private handler?: ConnectionHandler) {}

  @computed
  public get isAuthError() {
    if (this.currentError) {
      return this.currentError.httpResponse.status === 400 || this.currentError.httpResponse.status === 401;
    }
    return false;
  }

  @computed
  public get formError() {
    if (this.currentError) {
      switch (this.currentError.httpResponse.status) {
        case 401:
        case 400:
          return t("management:appServices.bugTracker.form.errors.unauthenticated");
        case 500:
          return t("management:appServices.bugTracker.form.errors.serverError");
        default:
          return this.currentError.message;
      }
    }
  }

  @computed
  public get headerText() {
    if (this.service) {
      return t("management:appServices.bugTracker.form.headerText", {
        name: this.service.name,
      });
    }
  }

  @computed
  public get subTitleText() {
    if (this.service) {
      return t("management:appServices.bugTracker.form.text", {
        name: this.service.name,
      });
    }
  }

  @computed
  public get iconName() {
    if (this.service) {
      return this.service.type === "jira" ? IconName.Jira : null;
    }
  }

  @action
  public setServiceAndShowForm = (service: BugTrackerService, handler?: ConnectionHandler) => {
    logger.info("app-services-connecting-bugtracker", { service: service.name });
    this.handler = handler;
    this.service = service;
    this.showDialog = true;
  };

  @action
  public hideServiceForm = () => {
    this.showDialog = false;
    this.service = null as any;
  };

  @action
  public postServiceConnection(data: any) {
    const serviceConnection = {
      serviceType: this.service.type,
      displayName: this.service.name,
      data,
    };
    this.isFormPosting = true;
    this.currentError = null as any;
    return this.serviceConnectionCreateStore
      .createServiceConnection(serviceConnection)
      .then(
        action((connection: any) => {
          this.isFormPosting = false;
          this.showDialog = false;
          if (this.handler) {
            this.handler(connection);
          } else {
            locationStore.pushWithCurrentApp("settings/services/bugtracker/add/:serviceType", {
              serviceType: connection.serviceType,
              access_token_id: connection.id,
            });
          }
        })
      )
      .catch(
        action((err: any) => {
          this.isFormPosting = false;
          this.currentError = err;
        })
      );
  }
}

import { observable, action } from "mobx";
import { createObservableContext } from "@root/shared/utils/create-observable-context";
import { logger } from "@root/lib/telemetry";

export const SupportUIStoreContext = createObservableContext<SupportUIStore>(null as any);

export class SupportUIStore {
  @observable visible: boolean = false;
  @action hide = (): void => {
    this.visible = false;
  };
  @action show = (): void => {
    logger.info("management/support/openCreateSupportCaseModal/clicked");
    this.visible = true;
  };
}

import { computed } from "mobx";

import { IApp } from "@lib/common-interfaces";

import { ConfigurePlatformHandler, ConfigurePlatformCommon, ConfigureMessage } from "./config-base";
import { ConfigurePlatformTest } from "./config-testcloud";
import { ConfigurePlatformDistribute } from "./config-distribute";
import { ConfigurePlatformAdvanced } from "./config-advanced";
import { ConfigurePlatformCustomVariables } from "./config-custom-variables";

export interface ICardState {
  readonly visible?: boolean;
  readonly hasToggle?: boolean;
  readonly active?: boolean;
  setActive(value: boolean);
  readonly disabled?: boolean;
  readonly errorMessage?: string;
  readonly infoMessage?: string;
  readonly subtitle?: string;
}

export interface ICardsState {
  build?: ICardState;
  sign?: ICardState;
  test?: ICardState;
  distribute?: ICardState;
  advanced?: ICardState;
  customVariables?: ICardState;
}

export abstract class ConfigureCardStoreBase implements ICardState {
  protected readonly app: IApp;
  protected readonly handler?: ConfigurePlatformHandler;

  constructor(app: IApp, handler?: ConfigurePlatformHandler) {
    this.app = app;
    this.handler = handler;
  }

  public get visible(): boolean {
    return true;
  }

  public abstract setActive(value: boolean);

  public abstract getMessage(): ConfigureMessage | undefined;

  @computed
  public get subtitle(): string | undefined {
    const msg = this.getMessage();
    if (msg && !msg.type) {
      return msg.message;
    }
    return;
  }

  @computed
  public get infoMessage(): string | undefined {
    const msg = this.getMessage();
    if (msg && msg.type === "info") {
      return msg.message;
    }
    return;
  }

  @computed
  public get errorMessage(): string | undefined {
    const msg = this.getMessage();
    if (msg && msg.type === "error") {
      return msg.message;
    }
    return;
  }
}

export class ConfigureBuildCard extends ConfigureCardStoreBase {
  public get hasToggle(): boolean {
    return false;
  }

  public setActive(value: boolean) {
    /* not needed */
  }

  public getMessage(): ConfigureMessage | undefined {
    return undefined;
  }
}

export class ConfigureSignCard extends ConfigureCardStoreBase {
  private get signingHandler(): ConfigurePlatformCommon {
    return this.handler as ConfigurePlatformCommon;
  }

  constructor(app: IApp, handler?: ConfigurePlatformCommon) {
    super(app, handler);
  }

  public get hasToggle(): boolean {
    return !!this.handler && this.handler.signToggleVisible();
  }

  public get active(): boolean {
    return this.signingHandler.signingEnabled;
  }

  public setActive(value: boolean) {
    this.signingHandler.setSigningEnabled(value);
  }

  public get disabled(): boolean {
    return !!this.handler && this.handler.signToggleDisabled();
  }

  public getMessage(): ConfigureMessage | undefined {
    return this.handler && this.handler.signMessage();
  }
}

export class ConfigureTestCard extends ConfigureCardStoreBase {
  private get testHandler(): ConfigurePlatformTest {
    return this.handler as ConfigurePlatformTest;
  }

  public get hasToggle(): boolean {
    return true;
  }

  public get active(): boolean {
    return this.testHandler.testingEnabled && !this.disabled;
  }

  public setActive(value: boolean) {
    this.testHandler.setTestingEnabled(value);
  }

  public get disabled(): boolean {
    return !!this.handler && this.handler.testToggleDisabled();
  }

  public getMessage(): ConfigureMessage | undefined {
    return this.handler && this.handler.testMessage();
  }
}

export class ConfigureDistributeCard extends ConfigureCardStoreBase {
  private get distributeHandler(): ConfigurePlatformDistribute {
    return this.handler as ConfigurePlatformDistribute;
  }

  public get hasToggle(): boolean {
    return true;
  }

  public get active(): boolean {
    return this.distributeHandler.distributeEnabled && !this.disabled;
  }

  public setActive(value: boolean) {
    this.distributeHandler.setDistributeEnabled(value);
  }

  public get disabled(): boolean {
    return !!this.handler && this.handler.distributeToggleDisabled();
  }

  public getMessage(): ConfigureMessage | undefined {
    return this.handler && this.handler.distributeMessage();
  }
}

export class ConfigureAdvancedCard extends ConfigureCardStoreBase {
  private get advancedHandler(): ConfigurePlatformAdvanced {
    return this.handler as ConfigurePlatformAdvanced;
  }

  public get hasToggle(): boolean {
    return false;
  }

  public setActive(value: boolean) {
    /* not needed */
  }

  public get disabled(): boolean {
    return this.advancedHandler.advancedDisabled();
  }

  public getMessage(): ConfigureMessage | undefined {
    return undefined;
  }
}

export class ConfigureCustomVariablesCard extends ConfigureCardStoreBase {
  private get customVariablesHandler(): ConfigurePlatformCustomVariables {
    return this.handler as ConfigurePlatformCustomVariables;
  }

  public get hasToggle(): boolean {
    return true;
  }

  public get active(): boolean {
    return this.customVariablesHandler.customVariablesEnabled;
  }

  public setActive(value: boolean) {
    this.customVariablesHandler.setCustomVariablesEnabled(value);
  }

  public get disabled(): boolean {
    return false;
  }

  public getMessage(): ConfigureMessage | undefined {
    return undefined;
  }
}

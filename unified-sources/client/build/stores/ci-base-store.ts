import { action } from "mobx";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { IApp } from "@lib/common-interfaces";

export abstract class CIBaseStore<T> extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<T> {
  private _app?: IApp;
  private _lastFetch?: number;

  public get app(): IApp | undefined {
    return this._app;
  }

  constructor(app?: IApp) {
    super();

    this._app = app;
  }

  @action
  public clear() {
    this._lastFetch = undefined;
    this.data = undefined;
    this.setState(ExternalDataState.Pending);
  }

  public clearLastFetch() {
    this._lastFetch = undefined;
  }

  public set lastFetchTimestamp(fetchTime: number | undefined) {
    this._lastFetch = fetchTime;
  }

  public get lastFetchTimestamp(): number | undefined {
    return this._lastFetch;
  }

  public lastFetchToNow(): number | undefined {
    if (!this._lastFetch) {
      return;
    }

    return Date.now() - this._lastFetch;
  }

  public getPathWithSlug(relativePath: string, apiVersion: string = "v0.1"): string {
    return this.app && this.app.owner ? `/${apiVersion}/apps/${this.app.owner.name}/${this.app.name}/${relativePath}` : "";
  }
}

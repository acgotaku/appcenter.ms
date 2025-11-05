import { action, computed, observable } from "mobx";

export class ErrorDialogUIStore {
  @observable
  private _errorMessage?: string;
  @observable
  private _header?: string;

  @computed
  get isVisible(): boolean {
    return !!this._errorMessage;
  }

  get header(): string | undefined {
    return this._header;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  @action
  public show(header: string, errorMessage: string) {
    this._header = header;
    this._errorMessage = errorMessage;
  }

  @action
  public dismiss() {
    this._header = undefined;
    this._errorMessage = undefined;
  }
}

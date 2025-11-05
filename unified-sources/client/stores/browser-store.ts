import { observable, action, untracked } from "mobx";

export class BrowserStore {
  @observable
  private _isFocused: boolean = true;

  constructor() {
    this.setIsFocused(true);

    this.setupVisibilityListener();
  }

  private setupVisibilityListener(): void {
    let hidden, visibilityChange;

    if (typeof document.hidden !== "undefined") {
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    } else if (typeof document["msHidden"] !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
    }

    if (!hidden) {
      console.warn("Cannot determine visibility property, focus tracking disabled");
      return;
    }

    let documentHidden = document[hidden];

    document.addEventListener(visibilityChange, () => {
      if (documentHidden !== document[hidden]) {
        const focused = untracked(() => {
          return this._isFocused;
        });

        const isDocumentHidden = document[hidden];

        if (isDocumentHidden === focused) {
          this.setIsFocused(!isDocumentHidden);
        }

        documentHidden = document[hidden];
      }
    });
  }

  @action
  protected setIsFocused(focused: boolean): void {
    this._isFocused = focused;
  }

  get focused(): boolean {
    return this._isFocused;
  }
}

export const browserStore = new BrowserStore();

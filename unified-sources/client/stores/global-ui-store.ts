import { observable, action, computed } from "mobx";
import { setFocusToButton, needToFocusElement } from "@root/shared/utils/returnFocus";
import { UniqueElementStack } from "@root/shared/utils/uniqueElementStack";

export enum NavigationMode {
  Keyboard,
  Mouse,
}

export class GlobalUIStore {
  public viewportElement?: HTMLElement;

  constructor() {
    this.focusReturnElements = UniqueElementStack.create();
  }

  public tooltip = observable({
    uid: null,
    setUID: action((uid: string) => (this.tooltip.uid = uid)),
    unsetUID: action((uid: string) => {
      if (this.tooltip.uid === uid) {
        this.tooltip.uid = null;
      }
    }),
  });

  @observable public isNavBarOpen: boolean = false;
  @action public setIsNavBarOpen(isNavBarOpen: boolean) {
    this.isNavBarOpen = isNavBarOpen;
  }

  @observable public navigationMode?: NavigationMode;
  @action public setNavigationMode(navigationMode: NavigationMode) {
    this.navigationMode = navigationMode;
  }

  @observable public isModalOpen: boolean = false;
  @action public setModalOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  @observable public isOverlayOpen: boolean = false;
  @action public setOverlayOpen(isOpen: boolean) {
    this.isOverlayOpen = isOpen;
  }

  private openDialogsAndPopovers = observable.map<string, true>(); // just using this as a Set
  @action public setDialogOrPopoverOpen(uid: string) {
    this.openDialogsAndPopovers.set(uid, true);
  }
  @action public setDialogOrPopoverClosed(uid: string) {
    this.openDialogsAndPopovers.delete(uid);
  }
  @computed public get isDialogOrPopoverOpen() {
    return this.openDialogsAndPopovers.size > 0;
  }

  @observable public fallbackFocusedElement?: HTMLElement;
  /**
   * Capture the last element that received focus that was not document.body. Should
   * only be used as a fallback for when document.activeElement cannot be used due to a focused
   * element being removed from the DOM.
   */
  @action public setFallbackFocusedElement(element: HTMLElement) {
    this.fallbackFocusedElement = element;
  }

  // this is a (unique) stack because we want the return focus logic to work even several levels deep
  public focusReturnElements: UniqueElementStack<HTMLElement>;

  /**
   * Save a button which was used to open a new page/modal/dialog/panel in order to be able to focus it later.
   * This is for good accessibility.
   */
  public setFocusReturnElement(element: Element | HTMLElement | null, checkForClick?: boolean) {
    if (!element) {
      return;
    }

    if (element !== document.body && needToFocusElement(element as HTMLElement)) {
      /**  extra check for type button is here to fix one very specific case where for example an anchor rendered on the page
      was being added as a focus return element while it shouldnt. However this never happens with buttons */
      if (checkForClick && element.getAttribute("type") !== "button") {
        element.addEventListener("click", () => {
          this.focusReturnElements.add(element as HTMLElement);
        });
      } else {
        this.focusReturnElements.add(element as HTMLElement);
      }
    }
  }

  /**
   * Return focus to the button which was used to open a new page/modal/dialog/panel after it is closed.
   * This is for good accessibility.
   */
  public returnFocus() {
    const nextElementToFocus = this.focusReturnElements.take();

    if (nextElementToFocus) {
      setFocusToButton(nextElementToFocus);
    }
  }
}
export const globalUIStore = new GlobalUIStore();

import { doFocus } from "@root/lib/utils/focuser";

export enum Section {
  Navigation = "Navigation",
  PrimaryPanel = "PrimaryPanel",
  SecondaryPanel = "SecondaryPanel",
  Modal = "Modal",
}

export enum Direction {
  Left,
  Right,
}

export type LastFocusedElements = { [K in Section]: HTMLElement };

/**
 * Switching focus between sections:
 * Navigation → SecondaryPanel? → PrimaryPanel
 */
export class FocusSwitcherStore {
  /**
   * Last focused element of each section
   */
  public lastFocusedElements: LastFocusedElements = {} as LastFocusedElements;

  private moveFocusToSection = (direction: Direction): void => {
    // Do nothing if modal opened
    if (this.getContainerBySection(Section.Modal)) {
      return;
    }

    if (document.activeElement === document.body) {
      this.setFocusToSection(Section.Navigation);
      return;
    }

    const section = this.section;
    // Saving last focused element in current section
    this.lastFocusedElements[section] = document.activeElement as HTMLElement;

    const secondary = this.getContainerBySection(Section.SecondaryPanel);
    switch (section) {
      case Section.Navigation:
        this.setFocusToSection(secondary && direction === Direction.Right ? Section.SecondaryPanel : Section.PrimaryPanel);
        break;
      case Section.PrimaryPanel:
        this.setFocusToSection(secondary && direction === Direction.Left ? Section.SecondaryPanel : Section.Navigation);
        break;
      case Section.SecondaryPanel:
        this.setFocusToSection(direction === Direction.Right ? Section.PrimaryPanel : Section.Navigation);
        break;
      default:
        break;
    }
  };

  public moveFocusToNextSection = (): void => this.moveFocusToSection(Direction.Right);

  public moveFocusToPreviousSection = (): void => this.moveFocusToSection(Direction.Left);

  private get section(): Section {
    const activeElement = document.activeElement;
    const navigation = this.getContainerBySection(Section.Navigation);
    const primary = this.getContainerBySection(Section.PrimaryPanel);
    const secondary = this.getContainerBySection(Section.SecondaryPanel);

    if (navigation?.contains(activeElement) || activeElement === document.body) {
      return Section.Navigation;
    }
    if (primary?.contains(activeElement)) {
      return Section.PrimaryPanel;
    }
    if (secondary && secondary.contains(activeElement)) {
      return Section.SecondaryPanel;
    }
    return Section.Navigation;
  }

  private setFocusToSection = (section: Section): void => {
    const container = this.getContainerBySection(section);
    const lastFocusedElement = this.getLastFocusedElement(section);
    if (lastFocusedElement && lastFocusedElement.focus) {
      lastFocusedElement.focus();
    } else {
      if (container) {
        doFocus(container);
      }
    }
  };

  private getContainerBySection = (section: Section): HTMLElement | null => {
    switch (section) {
      case Section.Navigation:
        return document.getElementById("left-nav");
      case Section.PrimaryPanel:
        return document.getElementById("page-in-primary");
      case Section.SecondaryPanel:
        return document.getElementById("page-in-secondary");
      case Section.Modal:
        return document.querySelector('[id^="page-in-modal-"]') as HTMLElement;
      default:
        return null;
    }
  };

  private getLastFocusedElement = (section: Section) => {
    const lastElement = this.lastFocusedElements[section];
    const container = this.getContainerBySection(section);
    if (container && container.contains(lastElement)) {
      return lastElement;
    }
    return null;
  };
}

export const focusSwitcherStore = new FocusSwitcherStore();
export const moveFocusToNextSection = focusSwitcherStore.moveFocusToNextSection;
export const moveFocusToPreviousSection = focusSwitcherStore.moveFocusToPreviousSection;

import { layoutStore } from "@root/stores";
const triggerElements = new Map<HTMLElement, { changed: (newClientRect: ClientRect) => void; value: ClientRect }>();

function scrollHandler() {
  if (!layoutStore.isMobile) {
    triggerElements.forEach((triggerRect, element) => {
      const newRect = element.getBoundingClientRect();
      if (newRect.top !== triggerRect.value.top || newRect.left !== triggerRect.value.left) {
        triggerRect.value = newRect;
        triggerRect.changed(newRect);
      }
    });
  }
}

export function register(
  triggerElement: HTMLElement,
  callback: (newTriggerRect: ClientRect) => void,
  currentRect = triggerElement.getBoundingClientRect() as ClientRect
) {
  triggerElements.set(triggerElement, { changed: callback, value: currentRect });
  if (triggerElements.size === 1) {
    document.addEventListener("scroll", scrollHandler, true);
  }
}

export function unregister(triggerElement: HTMLElement) {
  triggerElements.delete(triggerElement);
  if (triggerElements.size === 0) {
    document.removeEventListener("scroll", scrollHandler, true);
  }
}

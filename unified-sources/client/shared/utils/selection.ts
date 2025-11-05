const editableInputTypes = /^(?:text|email|number|search|tel|url|password)$/i;

export function isElementEditable(element: EventTarget | Element): boolean {
  return (
    element &&
    element instanceof HTMLElement &&
    (element.isContentEditable ||
      (element instanceof HTMLTextAreaElement && !element.disabled && !element.readOnly) ||
      (element instanceof HTMLInputElement && !element.disabled && !element.readOnly && editableInputTypes.test(element.type)))
  );
}

export function editableSelectionIsAtBeginning(element: HTMLInputElement | HTMLTextAreaElement): boolean {
  return element.selectionStart === 0 && element.selectionEnd === 0;
}

export function editableSelectionIsAtEnd(element: HTMLInputElement | HTMLTextAreaElement): boolean {
  return element.selectionStart === element.value.length && element.selectionEnd === element.value.length;
}

// TODO: this doesn’t work for RTL languages
export function canMoveSelectionLeft(element: EventTarget | Element): boolean {
  return (
    isElementEditable(element) &&
    (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
    !editableSelectionIsAtBeginning(element)
  );
}

export function canMoveSelectionRight(element: EventTarget | Element): boolean {
  return (
    isElementEditable(element) &&
    (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
    !editableSelectionIsAtEnd(element)
  );
}

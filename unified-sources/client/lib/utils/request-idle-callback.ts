export function requestIdleCallback(fn: Function, options?: { timeout?: number }) {
  if (window["requestIdleCallback"]) {
    // @ts-ignore
    window["requestIdleCallback"](fn, options);
  } else {
    setTimeout(fn, 0);
  }
}

type MediaQueryListListener = (ev: MediaQueryListEvent | MediaQueryList) => any;

const listeners = new Set<MediaQueryListListener>();

/*
 * Window height threshold to consider screen to be small screen
 * Must be greater than 500 since we support 200% zoom
 * and min-height for Dropdown content is 250px (250 * 2 = 500)
 */
const minWindowHeight = 580; // px
const mediaQuery = window.matchMedia && window.matchMedia(`(max-height: ${minWindowHeight}px)`);

function mediaQueryHandler(event: MediaQueryListEvent | MediaQueryList) {
  listeners.forEach((listener) => listener(event));
}

export function register(fn: MediaQueryListListener) {
  if (mediaQuery) {
    listeners.add(fn);
    if (listeners.size === 1) {
      mediaQuery.addListener(mediaQueryHandler);
    }
    fn(mediaQuery);
  }
}

export function unregister(fn: MediaQueryListListener) {
  if (mediaQuery) {
    listeners.delete(fn);
    if (listeners.size === 0) {
      mediaQuery.removeListener(mediaQueryHandler);
    }
  }
}

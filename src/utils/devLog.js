/** Log only in development builds */
export function devLog(...args) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log(...args);
  }
}

export function devWarn(...args) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(...args);
  }
}

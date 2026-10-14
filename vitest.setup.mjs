// The SDK's test setup reports every media query as unmatched (a phone). Default to a desktop-wide
// window; tests for narrow layouts stub matchMedia themselves.
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (media) => ({ media, matches: true, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }),
});

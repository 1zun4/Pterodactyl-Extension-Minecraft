import { useCallback, useSyncExternalStore } from 'react';

/** Tailwind's `lg` breakpoint: below it the screens stack into one column. */
export const WIDE = '(min-width: 64rem)';

/** Without `matchMedia` (tests, old browsers) the desktop layout is used. */
export function matchesMedia(query: string): boolean {
    return typeof window === 'undefined' || typeof window.matchMedia !== 'function' || window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            if (typeof window.matchMedia !== 'function') {
                return () => undefined;
            }

            const list = window.matchMedia(query);
            list.addEventListener('change', onChange);

            return () => list.removeEventListener('change', onChange);
        },
        [query]
    );

    return useSyncExternalStore(subscribe, () => matchesMedia(query), () => true);
}

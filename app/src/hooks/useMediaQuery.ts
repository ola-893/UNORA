import { useEffect, useState } from 'react';

/**
 * Tracks a CSS media query in React state.
 *
 * Used only where a layout genuinely cannot be expressed in CSS — the fanned positions deck
 * positions its cards with inline transform values, so a small screen needs a different
 * element tree rather than different classes. Prefer Tailwind breakpoints everywhere else.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True at Tailwind's `lg` breakpoint and up — the width at which the rail becomes permanent. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

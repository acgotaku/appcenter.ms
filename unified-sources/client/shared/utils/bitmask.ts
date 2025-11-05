export const maskMatches = (mask: boolean | number, matches: number) => (typeof mask === "number" ? Boolean(mask & matches) : mask);

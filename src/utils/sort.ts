export function sortAlphabetically<T>(
  items: T[],
  getKey: (item: T) => string,
): T[] {
  return [...items].sort((a, b) =>
    getKey(a).localeCompare(getKey(b), undefined, {
      sensitivity: "base",
      numeric: true,
    }),
  );
}

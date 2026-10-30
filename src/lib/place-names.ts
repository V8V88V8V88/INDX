export function placeNameKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[’'".,()/–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

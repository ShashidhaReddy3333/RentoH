const NON_ALPHANUMERIC = /[^a-z0-9]+/g;

export function createSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(NON_ALPHANUMERIC, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "listing";
}

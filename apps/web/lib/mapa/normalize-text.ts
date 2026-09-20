/** Accent-insensitive, case-insensitive normalization for map search and name matching. */
export const normalizeText = (value: string): string =>
  String(value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

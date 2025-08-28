import { COLUMN2, COLUMN5, COLUMN6, COLUMN8 } from "./PPConfig";

export const findTowingShipNames = (item: any, towingList: { t_name: string }[]): string[] => {
  const targetCols = [COLUMN2, COLUMN5, COLUMN6, COLUMN8];
  const result: string[] = [];

  targetCols.forEach((col) => {
    const val: string = item[col] ?? "";
    if (!val) return;

    // Split on delimiters: newline, spaces, commas
    const tokens = val
      .split(/[\n 　,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    towingList.forEach(({ t_name }) => {
      tokens.forEach((token) => {
        // Skip escort pattern (must match whole token)
        const escortPattern = new RegExp(`^(?:ｴｽｺｰﾄ|ES)\\s*[:：]\\s*${t_name}$`, "i");
        if (escortPattern.test(token)) return;

        // True if NAME(NUMBER) appears anywhere (half or full width)
        const hpPattern = new RegExp(`${t_name}[\\(（][0-9０-９]+[\\)）]`);

        // True if NAME:Something appears anywhere
        const infoPattern = new RegExp(`${t_name}[:：].+`);

        if (hpPattern.test(token) || infoPattern.test(token)) {
          result.push(t_name);
        }
      });
    });
  });

  return Array.from(new Set(result)); // remove duplicates
};

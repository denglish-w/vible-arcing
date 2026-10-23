// Maps MACULA Strong numbers that the Dodson lexicon lacks to their Dodson
// Strong equivalents. Built from the MACULA_Strong_Crosswalk sheet (75 rows)
// shipped with dodson-lexicon.xlsx.
//
// A value of null means "no Dodson entry exists; show the MACULA gloss only."
// Composite keys (e.g. "5228+1537+4053") are kept verbatim; ~5 NT word
// occurrences carry them and they always resolve to no Dodson entry.
export const STRONG_CROSSWALK = {
  "2036": 3004, "2076": 1510, "5213": 4771, "3450": 1473, "5216": 4771,
  "848": 1438, "4675": 4771, "5209": 4771, "2258": 1510, "2257": 1473,
  "5124": 3778, "3165": 1473, "5210": 4771, "5023": 3778, "3427": 1473,
  "4671": 4771, "4571": 4771, "2071": 1510, "2254": 1473, "2248": 1473,
  "5607": 1510, "1526": 1510, "2249": 1473, "1511": 1510, "5026": 3778,
  "2075": 1510, "1488": 1510, "1698": 1473, "1691": 1473, "5129": 3778,
  "3391": null, "5130": 3778, "5600": 1510, "5127": 3778, "5126": 3778,
  "2070": 1510, "5128": 3778, "2252": 1510, "5025": 3778, "5125": 3778,
  "5123": 3778, "2077": 1510, "4458": 4459, "1498": 1510, "4056": null,
  "39": 40, "4483": 4482, "2444": null, "2468": 1510, "5024": 3778,
  "197": null, "2467": 1492, "5228+1537+4053": null, "925": 916, "0": null,
  "2208": 2207, "1400": 1401, "2277": 1510, "4707": 4705, "33": null,
  "4054": null, "1537+4053": null, "566": 568, "933": null, "4530": null,
  "4384": 4367, "5120": 3588, "2568": 2570, "3386": null, "3176": null,
  "4668": null, "4555": 4556, "2461": null, "1417+3461": null, "5332": 5333,
};

// Resolve a MACULA Strong value (string or number) to a Dodson Strong number,
// or null when no Dodson entry exists.
export function resolveDodsonStrong(maculaStrong) {
  if (maculaStrong === null || maculaStrong === undefined) return null;
  // MACULA strong imported from xlsx as strings may carry a trailing ".0".
  const s = String(maculaStrong).trim();
  const norm = s.replace(/\.0+$/, "");
  if (Object.prototype.hasOwnProperty.call(STRONG_CROSSWALK, norm)) return STRONG_CROSSWALK[norm];
  if (Object.prototype.hasOwnProperty.call(STRONG_CROSSWALK, s)) return STRONG_CROSSWALK[s];
  // A composite stored as its leading number (e.g. "5228.0+1537.0+...")
  const leading = String(parseInt(s, 10));
  if (leading !== "NaN" && Object.prototype.hasOwnProperty.call(STRONG_CROSSWALK, leading))
    return STRONG_CROSSWALK[leading];
  if (/^\d+$/.test(norm)) return parseInt(norm, 10);
  return null;
}
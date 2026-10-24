// The ingest attribution committed with the repo, bundled into the server build.
// /credits shows it when the corpus store cannot supply the live entries, so the
// SBLGNT and MACULA notices are never missing from the UI.
import committed from "../../../corpus/v1/attribution.json";
import { parseAttribution } from "../../lib/corpus/format.ts";

export function committedAttribution() {
  return parseAttribution(committed, "corpus/v1/attribution.json").datasets;
}

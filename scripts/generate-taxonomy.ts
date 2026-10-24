// `npm run taxonomy:generate`: write src/lib/analysis/taxonomy.generated.ts from
// docs/data/relationships.json (foundation design decision 4). With `--check`,
// writes nothing and exits non-zero if the committed file is out of date.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  GENERATED_TAXONOMY_PATH,
  TAXONOMY_JSON_PATH,
  generateTaxonomyModule,
} from "../src/lib/analysis/taxonomy-codegen.ts";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, GENERATED_TAXONOMY_PATH);
const json = JSON.parse(
  readFileSync(path.join(root, TAXONOMY_JSON_PATH), "utf8"),
);
const generated = await generateTaxonomyModule(json, output);

if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8") !== generated) {
    console.error(
      `${GENERATED_TAXONOMY_PATH} is out of date. Run \`npm run taxonomy:generate\`.`,
    );
    process.exit(1);
  }
  console.log(`${GENERATED_TAXONOMY_PATH} is up to date.`);
} else {
  writeFileSync(output, generated);
  console.log(`Wrote ${GENERATED_TAXONOMY_PATH}`);
}

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataSources = await Promise.all([
  readFile(new URL("../app/card-data.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/early-product-data.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/vol5-data.ts", import.meta.url), "utf8"),
]);
const textSource = await readFile(new URL("../app/card-text.ts", import.meta.url), "utf8");

test("効果モンスター・魔法・罠に表示用テキストがある", () => {
  const specialIds = dataSources.flatMap((source) => source.split("\n")
    .filter((line) => line.includes('effect: true') || line.includes('cardType: "spell"') || line.includes('cardType: "trap"'))
    .map((line) => line.match(/id: "([^"]+)"/)?.[1])
    .filter(Boolean));
  assert.ok(specialIds.length > 40);
  for (const id of specialIds) assert.match(textSource, new RegExp(`"${id}":`), `${id}のテキストがありません`);
});

test("レアリティの日本語名をすべて表示する", () => {
  for (const name of ["シークレットレア", "ウルトラレア", "スーパーレア", "レア", "ノーマル"]) {
    assert.match(textSource, new RegExp(name));
  }
});

test("融合モンスターの素材名をカード説明に表示する", () => {
  assert.match(textSource, /fusionRecipe\(card\.id\)/);
  assert.match(textSource, /融合素材：/);
});

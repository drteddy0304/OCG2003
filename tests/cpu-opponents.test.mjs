import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const appUrl = new URL("../app/", import.meta.url);
const files = (await readdir(appUrl)).filter((name) => name.endsWith("-data.ts") || name === "card-data.ts");
const cardsById = new Map();

for (const file of files) {
  const source = await readFile(new URL(file, appUrl), "utf8");
  for (const line of source.split(/\r?\n/)) {
    if (!line.includes("{ id:") || !line.includes("cardType:")) continue;
    const value = (key) => line.match(new RegExp(`${key}: \\"([^\\"]+)\\"`))?.[1];
    const number = (key) => Number(line.match(new RegExp(`${key}: (\\d+)`))?.[1] ?? 0);
    const id = value("id");
    if (!id) continue;
    cardsById.set(id, {
      id,
      name: value("name"),
      cardType: value("cardType"),
      kind: value("kind"),
      attribute: value("attribute"),
      level: number("level"),
      atk: number("atk"),
      def: number("def"),
      effect: line.includes("effect: true"),
      fusion: line.includes("fusion: true"),
      ritual: line.includes("ritual: true"),
    });
  }
}

const source = await readFile(new URL("../app/cpu-opponents.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
const { createCpuOpponents } = await import(moduleUrl);
const opponents = createCpuOpponents([...cardsById.values()]);

test("15人のCPUが重複3枚以内の40枚デッキを使う", () => {
  assert.equal(opponents.length, 15);
  assert.equal(new Set(opponents.map((entry) => entry.id)).size, 15);
  for (const opponent of opponents) {
    assert.equal(opponent.deck.length, 40, opponent.name);
    const counts = opponent.deck.reduce((result, id) => result.set(id, (result.get(id) ?? 0) + 1), new Map());
    assert.ok([...counts.values()].every((count) => count <= 3), opponent.name);
    assert.ok(opponent.deck.every((id) => cardsById.has(id)), opponent.name);
    assert.ok(opponent.deck.filter((id) => cardsById.get(id).cardType === "monster").length >= 20, opponent.name);
  }
});

test("原作の切り札を対応するキャラクターが使用する", () => {
  const deck = (id) => opponents.find((entry) => entry.id === id).deck;
  assert.ok(deck("yami-yugi").includes("vol1-dark-magician"));
  assert.ok(deck("seto-kaiba").includes("stb-blue-eyes"));
  assert.ok(deck("joey-wheeler").includes("vol3-red-eyes"));
  assert.ok(deck("mai-valentine").includes("vol4-harpie-lady"));
  assert.ok(deck("weevil-underwood").includes("pr99-perfect-moth"));
  assert.ok(deck("yami-marik").includes("g4-03-ra"));
});

test("今後追加されるテーマカードもデュエリストのデッキへ自動採用する", () => {
  const futureCards = [
    ...cardsById.values(),
    { id: "future-harpie-support", name: "ハーピィの新戦術", cardType: "spell", kind: "通常魔法", rarity: "UR" },
  ];
  const updated = createCpuOpponents(futureCards);
  const mai = updated.find((entry) => entry.id === "mai-valentine");
  assert.ok(mai.deck.includes("future-harpie-support"));
  assert.equal(mai.deck.length, 40);
});

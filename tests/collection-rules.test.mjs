import assert from "node:assert/strict";
import test from "node:test";
import { addCardsToCollection, MAX_OWNED_COPIES } from "../app/collection-rules.mjs";

test("同名カードは5枚まで所持できる", () => {
  const result = addCardsToCollection({ card: 4 }, ["card"]);
  assert.equal(MAX_OWNED_COPIES, 5);
  assert.deepEqual(result, { collection: { card: 5 }, kept: [true] });
});

test("6枚目以降は所持数を増やさず自動破棄する", () => {
  const result = addCardsToCollection({ card: 5 }, ["card", "card"]);
  assert.deepEqual(result, { collection: { card: 5 }, kept: [false, false] });
});

test("同じパック内の重複も順番に上限判定する", () => {
  const result = addCardsToCollection({ card: 4 }, ["card", "card", "other"]);
  assert.deepEqual(result, {
    collection: { card: 5, other: 1 },
    kept: [true, false, true],
  });
});

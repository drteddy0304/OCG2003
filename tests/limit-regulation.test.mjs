import assert from "node:assert/strict";
import test from "node:test";
import {
  cardCopyLimit,
  cardLimitStatus,
  LIMITED_CARD_NAMES,
  LIMIT_REGULATION_DATE,
  SEMI_LIMITED_CARD_NAMES,
} from "../app/limit-regulation.mjs";

test("2003年12月31日に有効な2003年10月15日改訂を収録する", () => {
  assert.equal(LIMIT_REGULATION_DATE, "2003-10-15");
  assert.equal(LIMITED_CARD_NAMES.length, 52);
  assert.equal(SEMI_LIMITED_CARD_NAMES.length, 9);
});

test("制限は1枚、準制限は2枚、一覧外は3枚までにする", () => {
  assert.equal(cardLimitStatus("聖なるバリア －ミラーフォース－"), "limited");
  assert.equal(cardCopyLimit("強欲な壺"), 1);
  assert.equal(cardLimitStatus("増援"), "semi-limited");
  assert.equal(cardCopyLimit("増援"), 2);
  assert.equal(cardLimitStatus("地割れ"), "unlimited");
  assert.equal(cardCopyLimit("地割れ"), 3);
});

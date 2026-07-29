import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/"), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("Vol.1・Vol.2を各1日10パック開封できる初期画面を表示する", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /OCG 2003/);
  assert.match(html, /Vol\.1/);
  assert.match(html, /Vol\.2/);
  assert.match(html, /40(?:<!-- -->)?種/);
  assert.match(html, /10(?:<!-- -->)? \/ (?:<!-- -->)?10(?:<!-- -->)? PACKS/);
  assert.match(html, /各パックを毎日10回/);
  assert.match(html, /パックを開ける/);
  assert.match(html, /<button class="">デッキ<\/button>/);
  assert.match(html, /<button class="">デュエル<\/button>/);
  assert.match(html, /PHASE 2 · BUILD 015/);
  assert.doesNotMatch(html, /codex-preview/);
});

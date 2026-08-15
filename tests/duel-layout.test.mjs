import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");

test("Vol.7の起動効果に専用の操作導線がある", () => {
  assert.match(arena, /カタパルト・タートルの効果を使う/);
  assert.match(arena, /捨てて同名カードをサーチ/);
  assert.match(arena, /catapultUsedTurn/);
  assert.match(arena, /pendingCatapultTurtle !== null/);
  assert.match(arena, /リボルバー・ドラゴンの効果を使う/);
  assert.match(arena, /pendingBarrelDragon !== null/);
  assert.match(arena, /function useCpuBarrelDragon/);
  assert.match(arena, /クリボーの効果を使いますか/);
  assert.match(arena, /pendingKuribohResponse/);
  assert.match(arena, /マタンゴをCPUへ渡しますか/);
  assert.match(arena, /function applyMatangoStandby/);
  assert.match(arena, /function transferCpuMatangos/);
  assert.match(arena, /守備表示にするモンスターを選ぶ/);
  assert.match(arena, /statsSwappedTurn/);
  assert.match(arena, /しびれ薬・攻撃不可/);
  assert.match(arena, /function applyGermInfectionStandby/);
  assert.match(arena, /執念の剣.*デッキの一番上/);
  assert.match(arena, /追い剥ぎゴブリンを発動しますか/);
  assert.match(arena, /playerActiveTraps/);
  assert.match(arena, /CPUが追い剥ぎゴブリンを発動/);
});

test("攻撃・守備表示はプレイヤーごとの正しい向きになる", () => {
  assert.match(css, /\.zones-player \.field-card\.attack \{ transform: rotate\(0deg\)/);
  assert.match(css, /\.zones-player \.field-card\.defense \{ transform: rotate\(90deg\)/);
  assert.match(css, /\.zones-cpu \.field-card\.attack \{ transform: rotate\(180deg\)/);
  assert.match(css, /\.zones-cpu \.field-card\.defense \{ transform: rotate\(-90deg\)/);
});

test("キャノン・ソルジャーの対象選択には専用の読みやすい画面を使う", () => {
  assert.match(arena, /className="card-overlay cannon-soldier-overlay"/);
  assert.match(arena, /className="cannon-soldier-panel"/);
  assert.match(arena, /className="target-list cannon-target-list"/);
  assert.match(css, /\.cannon-soldier-panel \{[^}]*max-height: 84vh;[^}]*overflow: auto;/);
  assert.match(css, /\.cannon-target-list \{[^}]*max-height: 48vh;[^}]*overflow: auto;/);
  assert.match(css, /\.feedback-effect \.action-cut-in strong \{[^}]*overflow-wrap: anywhere;/);
});

test("CPUの行動は処理済みの結果一覧としてまとめて表示する", () => {
  assert.match(arena, /CPU ACTION RESULT/);
  assert.match(arena, /以下はすべて盤面へ反映済みです/);
  assert.match(arena, /className="cpu-result-list"/);
  assert.doesNotMatch(arena, />次の行動</);
  assert.match(css, /\.cpu-result-list \{[^}]*max-height: 48vh;[^}]*overflow: auto;/);
});

test("フィールドのカードに攻撃表示・守備表示を明記する", () => {
  assert.match(arena, /攻撃表示・縦/);
  assert.match(arena, /守備表示・横/);
});

test("Boosterの追加魔法・罠に選択と発動確認の導線がある", () => {
  assert.match(arena, /天使の施し/);
  assert.match(arena, /pendingGracefulCharity/);
  assert.match(arena, /痛み分け/);
  assert.match(arena, /pendingSharePain/);
  assert.match(arena, /自業自得を発動しますか/);
  assert.match(arena, /pendingJustDesserts/);
  assert.match(arena, /"bo6-fusion-sage"/);
  assert.match(arena, /"bo3-reinforcements"/);
  assert.match(arena, /DAMAGE STEP/);
  assert.match(arena, /pendingBattleStatTrap/);
  assert.match(arena, /battleDefBonusTurn/);
  assert.match(arena, /血の代償を発動して追加召喚/);
  assert.match(arena, /canUseUltimateOffering/);
  assert.match(arena, /あまのじゃくの呪いを発動しますか/);
  assert.match(arena, /pendingReverseTrap/);
  assert.match(arena, /reverseTrapDeclinedTurn/);
});

test("EXの戦闘効果と和睦の使者に操作導線がある", () => {
  assert.match(arena, /厳格な老魔術師がリバース/);
  assert.match(arena, /幻影の壁の効果が発動/);
  assert.match(arena, /和睦の使者を発動しますか/);
  assert.match(arena, /pendingWabokuResponse/);
  assert.match(arena, /playerWabokuTurn/);
  assert.match(arena, /ドラゴンを呼ぶ笛/);
  assert.match(arena, /pendingDragonFlute/);
  assert.match(arena, /isEffectTargetProtected/);
});

test("光の護封剣で表になった人喰い虫も対象を選んで処理する", () => {
  assert.match(arena, /resolveFlipSequence\(revealed, "cpu"/);
  assert.match(arena, /resolveFlipSequence\(state, "player"/);
  assert.match(arena, /pendingFlipQueue/);
  assert.match(arena, /選べる相手モンスターはいなかった/);
});

test("Magic Rulerの手札妨害と最終戦争はプレイヤーが対象・コストを選べる", () => {
  assert.match(arena, /pendingHandDisruption/);
  assert.match(arena, /resolveHandDisruptionSpell/);
  assert.match(arena, /pendingFinalDestiny/);
  assert.match(arena, /墓地へ捨てる手札を5枚選んでください/);
  assert.match(arena, /mr-gravekeepers-servant/);
  assert.match(arena, /duelAttackPayment/);
});

test("Magic Rulerの能力変化カードは表側モンスターを自分で選べる", () => {
  assert.match(arena, /pendingTemporaryStat/);
  assert.match(arena, /resolveTemporaryStat/);
  assert.match(arena, /mr-rush-recklessly/);
  assert.match(arena, /mr-reliable-guardian/);
  assert.match(arena, /毒蛇の牙を発動する/);
  assert.match(arena, /mr-hiros-shadow-scout/);
});

test("苦渋の選択と闇の訪れはコストと対象をプレイヤーが選べる", () => {
  assert.match(arena, /pendingPainfulChoice/);
  assert.match(arena, /togglePainfulChoiceCard/);
  assert.match(arena, /この5枚を公開する/);
  assert.match(arena, /pendingDarknessApproaches/);
  assert.match(arena, /toggleDarknessDiscard/);
  assert.match(arena, /表示形式を変えずに裏側表示/);
  assert.match(arena, /mr-penguin-knight/);
  assert.match(arena, /pendingTailor/);
  assert.match(arena, /移し替える装備魔法を選んでください/);
});

test("六芒星の呪縛は対象を選び攻撃と表示形式変更を封じる", () => {
  assert.match(arena, /pendingSpellbindingCircle/);
  assert.match(arena, /六芒星の呪縛の対象を選択/);
  assert.match(arena, /isSpellbindingCircleLocked/);
  assert.match(arena, /六芒星の呪縛・攻撃／表示変更不可/);
  assert.match(arena, /cleanupSpellbindingCircles/);
});

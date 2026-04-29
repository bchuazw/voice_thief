// @ts-nocheck
/**
 * Voice Thief — full end-to-end test in mock mode.
 *
 * Drives the running dev server (http://localhost:3000) via Playwright,
 * exercising every gameplay primitive:
 *   1. title → intro → playing
 *   2. street scene rendering
 *   3. recording flow (via store hook, since headless mic is awkward)
 *   4. notebook displays voice card
 *   5. phone diversion call → branch flips
 *   6. voice auth (fail then pass)
 *   7. vault opens, briefcase pickup, train station → WIN
 *   8. failure path: stressed voice + suspicion → LOST
 *
 * Captures screenshots into docs/test-shots/ and prints PASS/FAIL.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT = "docs/test-shots";
fs.mkdirSync(OUT, { recursive: true });

const checks = [];
function check(label, ok, detail = "") {
  checks.push({ label, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? `  — ${detail}` : ""}`);
}

async function shoot(page, name) {
  await page.screenshot({ path: path.join(OUT, name) });
}

async function vt(page, fn) {
  return await page.evaluate(fn);
}

async function getState(page) {
  return await vt(page, () => window.__vt.getState());
}

async function setState(page, patch) {
  return await vt(page, (p) => window.__vt.setState(p), patch);
}

function browserExecutablePath() {
  const candidates = [
    process.env.CHROME_BIN,
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
}

async function waitFor(page, predFn, label, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await page.evaluate(predFn);
    if (ok) return true;
  }
  check(`wait: ${label}`, false, `timeout after ${timeoutMs}ms`);
  return false;
}

(async () => {
  const executablePath = browserExecutablePath();
  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
    args: [
      "--no-sandbox",
      "--use-gl=swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--disable-dev-shm-usage",
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ["microphone"],
  });
  const page = await ctx.newPage();

  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

  // ── 1. Phase transitions ────────────────────────────────────────────
  console.log("\n=== Phase 1: title → intro → playing ===");
  await page.goto("http://localhost:3000/play", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__vt?.getState, undefined, { timeout: 30000 });
  await page.waitForTimeout(2000);

  let state = await getState(page);
  check("initial phase = title", state.phase === "title", `got ${state.phase}`);
  check("__vt hook exposed", !!state, `phase=${state?.phase}`);

  await page.locator("text=Start").first().click();
  await page.waitForTimeout(800);
  state = await getState(page);
  check("after Start: phase = intro", state.phase === "intro", `got ${state.phase}`);

  await page.locator("text=Skip").first().click();
  await page.waitForTimeout(2000);
  state = await getState(page);
  check("after Skip: phase = playing", state.phase === "playing", `got ${state.phase}`);
  // Force diorama for headless E2E (FP needs pointer lock which doesn't work
  // in headless reliably). The viewMode toggle is exposed on the store hook.
  await page.evaluate(() => window.__vt.setState({ viewMode: "diorama" }));
  await page.waitForTimeout(500);
  check(
    "initial in-game time near 6:00 PM",
    state.inGameTime >= 18 * 3600 && state.inGameTime < 18 * 3600 + 60,
    `got ${(state.inGameTime / 3600).toFixed(3)}h`,
  );
  check("player at street", state.player.currentLocation === "street");
  check("inventory empty", state.voiceInventory.length === 0);
  check("suspicion = 0", state.suspicion === 0);
  check("vault closed", state.vaultOpen === false);
  check("bank front unlocked at 6 PM", state.bankFrontUnlocked === true);
  check("hallway locked at start", state.bankHallwayUnlocked === false);

  await shoot(page, "01-street-6pm.png");

  // ── 2. Recording flow (via API + store) ─────────────────────────────
  console.log("\n=== Phase 2: recording ===");
  // Add a voice card via direct API call, mimicking what recordingManager does.
  const cloneRes = await page.evaluate(async () => {
    const form = new FormData();
    form.append("audio", new Blob(["fake"], { type: "audio/webm" }), "sample.webm");
    form.append("npcId", "bankManager");
    form.append("sourceMomentId", "manager-cigarette-6_15");
    form.append("emotion", "calm");
    const r = await fetch("/api/clone", { method: "POST", body: form });
    return { status: r.status, body: await r.json() };
  });
  check("/api/clone returned 200", cloneRes.status === 200, JSON.stringify(cloneRes.body));
  check("voice id is mock", cloneRes.body.voiceId.startsWith("mock_voice_"));

  // Add the voice card to the store the way recordingManager does
  await page.evaluate((data) => {
    const card = {
      id: `card_test_${Date.now()}`,
      npcId: "bankManager",
      elevenLabsVoiceId: data.voiceId,
      capturedAtInGameTime: 18 * 3600 + 15 * 60,
      emotionalState: "calm",
      durationSeconds: 6,
      sourceMomentId: "manager-cigarette-6_15",
      mock: true,
    };
    window.__vt.getState().addVoiceCard(card);
  }, cloneRes.body);

  state = await getState(page);
  check("inventory has 1 card", state.voiceInventory.length === 1);
  check("card is calm-tagged manager", state.voiceInventory[0].emotionalState === "calm" && state.voiceInventory[0].npcId === "bankManager");

  // Open notebook and screenshot
  await page.keyboard.press("n");
  await page.waitForTimeout(500);
  await shoot(page, "02-notebook-with-card.png");
  await page.keyboard.press("n");
  await page.waitForTimeout(300);

  // Also add a stressed card and a wife card for later tests
  await page.evaluate(() => {
    const t = window.__vt.getState();
    t.addVoiceCard({
      id: "card_stressed_mgr",
      npcId: "bankManager",
      elevenLabsVoiceId: "mock_voice_bankManager_stressed",
      capturedAtInGameTime: 18 * 3600 + 45 * 60,
      emotionalState: "stressed",
      durationSeconds: 5,
      sourceMomentId: "manager-phone-fight-6_45",
      mock: true,
    });
    t.addVoiceCard({
      id: "card_wife_calm",
      npcId: "wife",
      elevenLabsVoiceId: "mock_voice_wife_calm",
      capturedAtInGameTime: 18 * 3600 + 30 * 60,
      emotionalState: "calm",
      durationSeconds: 7,
      sourceMomentId: "wife-gossip-6_30",
      mock: true,
    });
  });

  // ── 3. Phone diversion call ─────────────────────────────────────────
  console.log("\n=== Phase 3: phone diversion ===");
  // open phone
  await page.keyboard.press("p");
  await page.waitForTimeout(700);
  await shoot(page, "03-phone-open.png");

  // place a call: wife voice, target = bank manager, "break-in" line
  // Pick the wife voice card from the dropdown by its option value (card id).
  const wifeCardId = await vt(page, () => {
    return window.__vt.getState().voiceInventory.find((c) => c.npcId === "wife")?.id;
  });
  await page.locator("select").nth(1).selectOption(wifeCardId);
  await page.locator("textarea").fill("Honey, there's been a break-in at the house. Come home now.");
  await page.locator("text=Place Call").first().click();
  await page.waitForTimeout(1200);
  await shoot(page, "04-phone-call-active.png");

  // wait for branch flip
  const branchFlipped = await waitFor(
    page,
    () => window.__vt.getState().npcs.bankManager.branch === "rushedHome",
    "manager branch flips to rushedHome",
    4000,
  );
  check("manager branch flipped to rushedHome via wife→manager call", branchFlipped);

  state = await getState(page);
  check("hallway unlocked as side effect", state.bankHallwayUnlocked === true);

  // wait for auto-hangup to close the phone
  await waitFor(page, () => window.__vt.getState().phoneOpen === false, "phone auto-closes", 4000);
  state = await getState(page);
  check("phone auto-closed after hangup", state.phoneOpen === false);

  // ── 4. Voice auth — fail with stressed, pass with calm ─────────────
  console.log("\n=== Phase 4: voice authentication ===");
  // Position the player near the bank intercom (in the bank lobby)
  await page.evaluate(() => window.__vt.getState().setPlayerLocation("bankLobby"));
  await page.waitForTimeout(800);
  await shoot(page, "05-bank-lobby.png");

  // Open vault auth dialog
  await page.evaluate(() => {
    window.__vt.getState().setActiveAuth({ device: "vault", voiceCardId: "", result: "pending" });
  });
  await page.waitForTimeout(500);
  await shoot(page, "06-vault-auth-open.png");

  // Try the stressed card first → should fail
  // Find the button labeled "stressed"
  const stressedBtn = page.locator("button", { hasText: /stressed/ }).first();
  if (await stressedBtn.count()) {
    await stressedBtn.click();
    await page.waitForTimeout(1500);
    state = await getState(page);
    check("stressed voice fails vault", state.vaultOpen === false);
    check("suspicion increased after fail", state.suspicion > 0, `suspicion=${state.suspicion}`);
    await shoot(page, "07-vault-auth-stressed-fail.png");
  } else {
    check("stressed card visible in dialog", false, "button not found");
  }

  // Now try the calm card → should pass
  const calmBtn = page.locator("button", { hasText: /calm/ }).first();
  if (await calmBtn.count()) {
    await calmBtn.click();
    await page.waitForTimeout(2000);
    state = await getState(page);
    check("calm voice opens vault", state.vaultOpen === true);
    await shoot(page, "08-vault-auth-calm-pass.png");
  } else {
    check("calm card visible in dialog", false, "button not found");
  }

  // ── 5. Briefcase pickup ─────────────────────────────────────────────
  console.log("\n=== Phase 5: briefcase + win ===");
  // Move to vault scene
  await page.evaluate(() => window.__vt.getState().setPlayerLocation("vault"));
  await page.waitForTimeout(1000);
  await shoot(page, "09-vault-open.png");

  // Take the briefcase via store action
  await page.evaluate(() => window.__vt.getState().takeBriefcase());
  await page.waitForTimeout(500);
  state = await getState(page);
  check("briefcase taken", state.briefcaseTaken === true);
  check("player has briefcase", state.player.hasBriefcase === true);

  // Walk to street and onto the train station marker (12, 0, 8)
  await page.evaluate(() => {
    const s = window.__vt.getState();
    s.setPlayerLocation("street");
    s.setPlayerPosition({ x: 12, y: 0, z: 8 });
    s.setPlayerTarget(null);
  });
  await page.waitForTimeout(1500);

  // Nudge subscriber by pushing a toast (any state delta re-evaluates win)
  await page.evaluate(() => window.__vt.getState().pushToast("at station"));
  await page.waitForTimeout(1200);

  state = await getState(page);
  check("phase = won after reaching station with briefcase", state.phase === "won", `got ${state.phase}`);
  await shoot(page, "10-win.png");

  // ── 6. Reset and run failure path ───────────────────────────────────
  console.log("\n=== Phase 6: failure path ===");
  await page.evaluate(() => window.__vt.getState().reset());
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__vt.getState().setPhase("playing"));
  await page.waitForTimeout(500);

  state = await getState(page);
  check("reset back to playing/start state", state.phase === "playing" && state.suspicion === 0 && state.voiceInventory.length === 0);

  // Pile on suspicion
  for (let i = 0; i < 7; i++) {
    await page.evaluate(() => window.__vt.getState().raiseSuspicion(15, `failed test ${Date.now()}`));
    await page.waitForTimeout(150);
  }
  // Wait for tick to flip phase to lost
  await page.waitForTimeout(800);
  state = await getState(page);
  check("alarm triggered after suspicion ≥ 100", state.alarmTriggered === true, `susp=${state.suspicion}`);

  await waitFor(
    page,
    () => window.__vt.getState().phase === "lost",
    "phase flips to lost on alarm",
    4000,
  );
  state = await getState(page);
  check("phase = lost on alarm", state.phase === "lost", `got ${state.phase}`);
  await shoot(page, "11-lost.png");

  // ── 7. Time-out failure ─────────────────────────────────────────────
  console.log("\n=== Phase 7: time-out failure ===");
  await page.evaluate(() => window.__vt.getState().reset());
  await page.evaluate(() => window.__vt.getState().setPhase("playing"));
  await page.waitForTimeout(400);

  // Set time to 8:59:50 PM and let tick advance to 9 PM
  await page.evaluate(() =>
    window.__vt.setState({ inGameTime: 21 * 3600 - 10 }),
  );
  await waitFor(
    page,
    () => window.__vt.getState().phase === "lost",
    "time-out triggers loss",
    8000,
  );
  state = await getState(page);
  check("phase = lost at 9 PM", state.phase === "lost", `got ${state.phase}`);
  await shoot(page, "12-lost-timeout.png");

  // ── 8. Solution C primitive: secretary→manager ledger call ─────────
  console.log("\n=== Phase 8: Solution C primitive ===");
  await page.evaluate(() => window.__vt.getState().reset());
  await page.evaluate(() => window.__vt.getState().setPhase("playing"));
  await page.evaluate(() => {
    window.__vt.getState().addVoiceCard({
      id: "card_sec_calm",
      npcId: "secretary",
      elevenLabsVoiceId: "mock_voice_secretary",
      capturedAtInGameTime: 18 * 3600,
      emotionalState: "calm",
      durationSeconds: 6,
      sourceMomentId: "secretary-cafe-6_00",
      mock: true,
    });
  });

  await page.keyboard.press("p");
  await page.waitForTimeout(700);
  // The PhoneUI's caller-voice dropdown defaults to inventory[0]; we just
  // added one secretary card, so it's already selected. Type and call.
  await page.locator("textarea").fill("Sir, I left the safe-deposit ledger at the cafe. Could you grab it on your way back?");
  await page.locator("text=Place Call").first().click();
  await waitFor(
    page,
    () => window.__vt.getState().npcs.bankManager.branch === "atCafe",
    "manager branch flips to atCafe via secretary call",
    4000,
  );
  state = await getState(page);
  check("Solution C: manager branch flipped to atCafe", state.npcs.bankManager.branch === "atCafe");
  await page.waitForTimeout(2000);
  await shoot(page, "13-solution-c-call.png");

  // ── 9. API direct contracts (smoke) ────────────────────────────────
  console.log("\n=== Phase 9: direct API smoke ===");
  const apiTests = [
    { name: "bootstrap returns mock agents", url: "/api/bootstrap", method: "GET", expect: (r) => r.mock === true && Object.keys(r.agents).length === 4 },
    { name: "TTS returns audio/mpeg", url: "/api/tts", method: "POST", body: { text: "hello", voiceId: "mock" }, raw: true },
    { name: "auth-voice rejects wrong NPC", url: "/api/auth-voice", method: "POST", body: { device: "vault", voiceCard: { elevenLabsVoiceId: "v", npcId: "wife", emotionalState: "calm" } }, expect: (r) => r.passes === false },
    { name: "auth-voice accepts calm bankManager", url: "/api/auth-voice", method: "POST", body: { device: "vault", voiceCard: { elevenLabsVoiceId: "v", npcId: "bankManager", emotionalState: "calm" } }, expect: (r) => r.passes === true },
    { name: "auth-voice rejects panicked bankManager", url: "/api/auth-voice", method: "POST", body: { device: "vault", voiceCard: { elevenLabsVoiceId: "v", npcId: "bankManager", emotionalState: "panicked" } }, expect: (r) => r.passes === false && r.reason.includes("panicked") },
    { name: "conversation: wife→manager break-in triggers hangup", url: "/api/conversation", method: "POST", body: { npcId: "bankManager", callerVoiceId: "v", callerVoiceNpcId: "wife", callerText: "Honey there's been a break-in" }, expect: (r) => r.hangUp === true && r.npcText.includes("Maggie") },
    { name: "conversation: manager voice + 'Harold' raises suspicion", url: "/api/conversation", method: "POST", body: { npcId: "wife", callerVoiceId: "v", callerVoiceNpcId: "bankManager", callerText: "Margaret darling, this is Harold" }, expect: (r) => r.raisedSuspicion >= 15 },
    { name: "conversation: vault code probe → +30 susp + hangup", url: "/api/conversation", method: "POST", body: { npcId: "bankManager", callerVoiceId: "v", callerVoiceNpcId: "secretary", callerText: "What is the vault code 7-7-1" }, expect: (r) => r.raisedSuspicion === 30 && r.hangUp === true },
    { name: "cleanup no-ops on mock voice ids", url: "/api/cleanup", method: "POST", body: { voiceIds: ["mock_voice_a", "mock_voice_b"] }, expect: (r) => r.deleted === 2 },
  ];

  for (const t of apiTests) {
    try {
      // Pass only serializable args; do the expect() back here on the Node side.
      const args = { url: t.url, method: t.method, body: t.body || null, raw: !!t.raw };
      const r = await page.evaluate(async (a) => {
        const res = await fetch(a.url, {
          method: a.method,
          headers: a.body ? { "Content-Type": "application/json" } : undefined,
          body: a.body ? JSON.stringify(a.body) : undefined,
        });
        if (a.raw) return { status: res.status, contentType: res.headers.get("content-type"), bytes: (await res.blob()).size };
        return { status: res.status, body: await res.json() };
      }, args);

      if (t.raw) {
        check(t.name, r.status === 200 && r.contentType.includes("audio/mpeg") && r.bytes > 0, `status=${r.status} bytes=${r.bytes}`);
      } else {
        const ok = r.status === 200 && t.expect(r.body);
        check(t.name, ok, `status=${r.status} body=${JSON.stringify(r.body).slice(0, 120)}`);
      }
    } catch (e) {
      check(t.name, false, e.message);
    }
  }

  await browser.close();

  // ── Report ─────────────────────────────────────────────────────────
  console.log("\n========== REPORT ==========");
  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;
  console.log(`Total: ${checks.length} · Passed: ${passed} · Failed: ${failed}`);
  if (failed > 0) {
    console.log("\nFailures:");
    for (const c of checks.filter((c) => !c.ok)) {
      console.log(`  ✗ ${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }
  console.log(`\nScreenshots in: ${OUT}/`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});

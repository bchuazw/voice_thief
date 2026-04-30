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

  check("default view mode is first-person", state.viewMode === "fp", `got ${state.viewMode}`);
  check("first-person HUD advertises WASD", (await page.locator("text=WASD").count()) > 0);
  await shoot(page, "00-first-person-street.png");
  const fpStart = state.player.position;
  await page.keyboard.down("w");
  await page.waitForTimeout(700);
  await page.keyboard.up("w");
  state = await getState(page);
  check(
    "first-person WASD moves the player",
    Math.hypot(state.player.position.x - fpStart.x, state.player.position.z - fpStart.z) > 0.3,
    `from ${JSON.stringify(fpStart)} to ${JSON.stringify(state.player.position)}`,
  );

  // Force diorama for the long route. Pointer lock is not reliable in headless,
  // so first-person gets its own smoke coverage above and the full route uses
  // click-to-walk.
  await page.evaluate(() => window.__vt.setState({
    viewMode: "diorama",
    player: { ...window.__vt.getState().player, position: { x: 0, y: 0, z: 6 }, target: null },
  }));
  await page.waitForTimeout(500);
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
    t.addVoiceCard({
      id: "card_secretary_calm_route",
      npcId: "secretary",
      elevenLabsVoiceId: "mock_voice_secretary_calm_route",
      capturedAtInGameTime: 18 * 3600,
      emotionalState: "calm",
      durationSeconds: 6,
      sourceMomentId: "secretary-cafe-6_00",
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
  check("family diversion does not unlock records hallway", state.bankHallwayUnlocked === false);

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

  // Open hallway auth dialog. The hallway is Lillian's records intercom, not Harold's vault.
  await page.evaluate(() => {
    window.__vt.getState().setActiveAuth({ device: "bankHallway", voiceCardId: "", result: "pending" });
  });
  await page.waitForTimeout(500);
  await shoot(page, "06-hallway-auth-open.png");

  const secretaryHallwayBtn = page.locator("button", { hasText: /Lillian Park/ }).first();
  if (await secretaryHallwayBtn.count()) {
    await secretaryHallwayBtn.click();
    const hallwayUnlocked = await waitFor(
      page,
      () => window.__vt.getState().bankHallwayUnlocked === true,
      "secretary hallway auth unlocks",
      8000,
    );
    state = await getState(page);
    check("secretary records voice opens hallway", hallwayUnlocked && state.bankHallwayUnlocked === true);
    await shoot(page, "07-hallway-auth-pass.png");
  } else {
    check("secretary card visible in hallway dialog", false, "button not found");
  }

  // Open vault auth dialog
  await page.evaluate(() => {
    window.__vt.getState().setActiveAuth({ device: "vault", voiceCardId: "", result: "pending" });
  });
  await page.waitForTimeout(500);
  await shoot(page, "08-vault-auth-open.png");

  // Try the stressed card first → should fail
  // Find the button labeled "stressed"
  const stressedBtn = page.locator("button", { hasText: /stressed/ }).first();
  if (await stressedBtn.count()) {
    await stressedBtn.click();
    await page.waitForTimeout(1500);
    state = await getState(page);
    check("stressed voice fails vault", state.vaultOpen === false);
    check("suspicion increased after fail", state.suspicion > 0, `suspicion=${state.suspicion}`);
    await shoot(page, "09-vault-auth-stressed-fail.png");
  } else {
    check("stressed card visible in dialog", false, "button not found");
  }

  // Now try the calm card → should pass
  const calmBtn = page.locator("button", { hasText: /calm/ }).first();
  if (await calmBtn.count()) {
    await calmBtn.click();
    await page.waitForTimeout(2000);
    state = await getState(page);
    check("calm manager voice is blocked while Lillian watches ledger", state.vaultOpen === false);
    const lillianReasonVisible = await page.locator("text=Lillian").count();
    check("vault rejection explains Lillian ledger blocker", lillianReasonVisible > 0);
    await shoot(page, "10-vault-auth-lillian-block.png");
  } else {
    check("calm card visible in dialog", false, "button not found");
  }

  // Clear the counter with Harold's voice, then try the vault again.
  await page.evaluate(() => window.__vt.getState().setActiveAuth(null));
  await page.keyboard.press("p");
  await page.waitForTimeout(500);
  await page.locator("select").nth(0).selectOption("secretary");
  const managerCalmCardId = await vt(page, () => {
    return window.__vt.getState().voiceInventory.find(
      (c) => c.npcId === "bankManager" && c.emotionalState === "calm",
    )?.id;
  });
  await page.locator("select").nth(1).selectOption(managerCalmCardId);
  await page.locator("textarea").fill("Lillian, please go upstairs and check the supply ledger.");
  await page.locator("text=Place Call").first().click();
  await waitFor(
    page,
    () => window.__vt.getState().npcs.secretary.branch === "runningErrand",
    "secretary branch flips to runningErrand",
    4000,
  );
  state = await getState(page);
  check("Harold voice sends Lillian on errand", state.npcs.secretary.branch === "runningErrand");
  await shoot(page, "11-secretary-errand-call.png");
  await waitFor(page, () => window.__vt.getState().phoneOpen === false, "secretary phone auto-closes", 5000);

  await page.evaluate(() => {
    window.__vt.getState().setActiveAuth({ device: "vault", voiceCardId: "", result: "pending" });
  });
  await page.waitForTimeout(500);
  const finalCalmBtn = page.locator("button", { hasText: /calm/ }).first();
  if (await finalCalmBtn.count()) {
    await finalCalmBtn.click();
    await page.waitForTimeout(2000);
    state = await getState(page);
    check("calm manager voice opens vault after Lillian leaves", state.vaultOpen === true);
    await shoot(page, "12-vault-auth-calm-pass.png");
  } else {
    check("calm card visible for final vault auth", false, "button not found");
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
  const familyEmergencyChip = await page.locator("text=Family Emergency").count();
  check("win card shows Family Emergency achievement", familyEmergencyChip > 0);

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
  await waitFor(page, () => window.__vt.getState().phoneOpen === false, "solution C phone auto-closes", 5000);

  // Extra regression coverage: failed calls, alternate routes, and visible recording risk.
  console.log("\n=== Phase 9: phone-rule regressions + recording bust ===");
  await page.evaluate(() => window.__vt.getState().reset());
  await page.evaluate(() => window.__vt.getState().setPhase("playing"));
  await page.evaluate(() => window.__vt.setState({ viewMode: "diorama" }));
  await page.evaluate(() => {
    const s = window.__vt.getState();
    s.addVoiceCard({
      id: "card_wife_edge",
      npcId: "wife",
      elevenLabsVoiceId: "mock_voice_wife_edge",
      capturedAtInGameTime: 18 * 3600 + 30 * 60,
      emotionalState: "calm",
      durationSeconds: 6,
      sourceMomentId: "wife-gossip-6_30",
      mock: true,
    });
    s.addVoiceCard({
      id: "card_guard_edge",
      npcId: "bankGuard",
      elevenLabsVoiceId: "mock_voice_bankGuard_edge",
      capturedAtInGameTime: 18 * 3600 + 30 * 60,
      emotionalState: "calm",
      durationSeconds: 6,
      sourceMomentId: "guard-patrol-6_30",
      mock: true,
    });
  });

  await page.keyboard.press("p");
  await page.waitForTimeout(500);
  await page.locator("select").nth(1).selectOption("card_wife_edge");
  await page.locator("textarea").fill("Break-in.");
  await page.locator("text=Place Call").first().click();
  await waitFor(
    page,
    () => (window.__vt.getState().activeCall?.transcript ?? []).some((t) => t.role === "npc"),
    "weak wife call gets an NPC response",
    4000,
  );
  await shoot(page, "14-phone-weak-call-fail.png");
  state = await getState(page);
  const weakReply = state.activeCall?.transcript.find((t) => t.role === "npc")?.text ?? "";
  check("weak wife call does not move manager", state.npcs.bankManager.branch === "default");
  check("weak wife call keeps hallway locked", state.bankHallwayUnlocked === false);
  check("weak wife call raises suspicion", state.suspicion >= 4, `suspicion=${state.suspicion}`);
  check("weak wife call reply is not a false success", !/leaving now|stay on the line/i.test(weakReply), weakReply);

  await page.locator("text=Hang up").first().click();
  await page.waitForTimeout(300);
  await page.keyboard.press("p");
  await page.waitForTimeout(500);
  await page.locator("select").nth(1).selectOption("card_guard_edge");
  await page.locator("textarea").fill("Cole checking in from the beat. Patrol is quiet, round is clear.");
  await page.locator("text=Place Call").first().click();
  await waitFor(
    page,
    () => window.__vt.getState().bankBackExitUnlocked === true,
    "guard beat call unlocks back exit",
    4000,
  );
  await shoot(page, "15-phone-guard-back-exit.png");
  state = await getState(page);
  const guardReply = state.activeCall?.transcript.find((t) => t.role === "npc")?.text ?? "";
  check("guard beat call unlocks back exit", state.bankBackExitUnlocked === true);
  check("guard beat call reply matches success", /alley gate|keep moving/i.test(guardReply), guardReply);

  await page.evaluate(() => window.__vt.getState().reset());
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__vt.getState().setPhase("playing"));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__vt.setState({ viewMode: "diorama", inGameTime: 18 * 3600 + 50 * 60 }));
  await page.evaluate(() => {
    const s = window.__vt.getState();
    s.setPlayerLocation("bankLobby");
    s.setPlayerPosition({ x: -6, y: 0, z: -2 });
  });
  await page.waitForTimeout(1500);
  await page.keyboard.down("e");
  await page.waitForTimeout(8500);
  await page.keyboard.up("e");
  await waitFor(
    page,
    () => window.__vt.getState().recordingsBust >= 1,
    "recording bust counter increments",
    4000,
  );
  await shoot(page, "16-recording-awareness-bust.png");
  state = await getState(page);
  check("visible recording can bust the player", state.recordingsBust >= 1, `busts=${state.recordingsBust}`);
  check("recording bust adds serious heat", state.suspicion >= 25, `suspicion=${state.suspicion}`);
  check(
    "busted recording still yields stressed manager card",
    state.voiceInventory.some((c) => c.npcId === "bankManager" && c.emotionalState === "stressed"),
  );

  // ── 9. API direct contracts (smoke) ────────────────────────────────
  console.log("\n=== Phase 10: direct API smoke ===");
  const apiTests = [
    { name: "bootstrap returns mock agents", url: "/api/bootstrap", method: "GET", expect: (r) => r.mock === true && Object.keys(r.agents).length === 4 },
    { name: "TTS returns audio/mpeg", url: "/api/tts", method: "POST", body: { text: "hello", voiceId: "mock" }, raw: true },
    { name: "auth-voice rejects wrong NPC", url: "/api/auth-voice", method: "POST", body: { device: "vault", voiceCard: { elevenLabsVoiceId: "v", npcId: "wife", emotionalState: "calm" } }, expect: (r) => r.passes === false },
    { name: "auth-voice accepts calm bankManager", url: "/api/auth-voice", method: "POST", body: { device: "vault", voiceCard: { elevenLabsVoiceId: "v", npcId: "bankManager", emotionalState: "calm" } }, expect: (r) => r.passes === true },
    { name: "auth-voice rejects manager at records hallway", url: "/api/auth-voice", method: "POST", body: { device: "bankHallway", voiceCard: { elevenLabsVoiceId: "v", npcId: "bankManager", emotionalState: "calm" } }, expect: (r) => r.passes === false },
    { name: "auth-voice accepts secretary at records hallway", url: "/api/auth-voice", method: "POST", body: { device: "bankHallway", voiceCard: { elevenLabsVoiceId: "v", npcId: "secretary", emotionalState: "calm" } }, expect: (r) => r.passes === true },
    { name: "auth-voice rejects panicked bankManager", url: "/api/auth-voice", method: "POST", body: { device: "vault", voiceCard: { elevenLabsVoiceId: "v", npcId: "bankManager", emotionalState: "panicked" } }, expect: (r) => r.passes === false && r.reason.includes("panicked") },
    { name: "conversation: wife manager emergency succeeds", url: "/api/conversation", method: "POST", body: { npcId: "bankManager", callerVoiceId: "v", callerVoiceNpcId: "wife", callerText: "Maggie here. There is a stranger at the house, please hurry home now." }, expect: (r) => r.hangUp === true && /leaving now/i.test(r.npcText) },
    { name: "conversation: manager gives Lillian records errand", url: "/api/conversation", method: "POST", body: { npcId: "secretary", callerVoiceId: "v", callerVoiceNpcId: "bankManager", callerText: "Lillian, please go upstairs and check the supply ledger." }, expect: (r) => r.hangUp === true && /go check now/i.test(r.npcText) },
    { name: "conversation: weak wife call stays suspicious", url: "/api/conversation", method: "POST", body: { npcId: "bankManager", callerVoiceId: "v", callerVoiceNpcId: "wife", callerText: "Break-in." }, expect: (r) => r.hangUp === false && r.raisedSuspicion === 4 && !/leaving now/i.test(r.npcText) },
    { name: "conversation: guard beat call acknowledges back exit", url: "/api/conversation", method: "POST", body: { npcId: "bankManager", callerVoiceId: "v", callerVoiceNpcId: "bankGuard", callerText: "Cole checking in from the beat. Patrol is quiet." }, expect: (r) => r.hangUp === true && /alley gate|keep moving/i.test(r.npcText) },
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

  // ── 11. Doubt accumulator (multi-turn bluff system) ──────────────────
  console.log("\n=== Phase 11: doubt accumulator ===");
  // Reset to a clean playing state with a wife voice card to test multi-turn flow.
  await page.evaluate(() => window.__vt.getState().reset());
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__vt.getState().setPhase("playing"));
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const s = window.__vt.getState();
    s.addVoiceCard({
      id: "card_wife_doubt",
      npcId: "wife",
      elevenLabsVoiceId: "mock_voice_wife_doubt",
      capturedAtInGameTime: 18 * 3600,
      emotionalState: "calm",
      durationSeconds: 6,
      sourceMomentId: "wife-gossip-6_30",
      mock: true,
    });
  });

  // Test 1: Weak opener spikes doubt above the branch-block threshold.
  await page.keyboard.press("p");
  await page.waitForTimeout(400);
  await page.locator("select").nth(1).selectOption("card_wife_doubt");
  await page.locator("textarea").fill("hi");
  await page.locator("text=Place Call").first().click();
  await waitFor(
    page,
    () => (window.__vt.getState().activeCall?.transcript ?? []).some((t) => t.role === "npc"),
    "weak opener gets a reply",
    4000,
  );
  let doubtState = await page.evaluate(() => ({
    doubt: window.__vt.getState().activeCall?.doubt ?? 0,
    branch: window.__vt.getState().npcs.bankManager.branch,
  }));
  check("weak opener raises doubt above 0", doubtState.doubt > 0, `doubt=${doubtState.doubt}`);
  check("weak opener does NOT flip branch", doubtState.branch === "default");

  // Test 2: Send another weak follow-up to push doubt past 30 (block-flip
  // threshold). Then a "winning" emergency message should NOT flip the
  // branch because prior doubt was already too high.
  await page.locator("textarea").fill("yes");
  await page.locator("text=Place Call").first().click();
  await page.waitForTimeout(800);
  doubtState = await page.evaluate(() => ({
    doubt: window.__vt.getState().activeCall?.doubt ?? 0,
    branch: window.__vt.getState().npcs.bankManager.branch,
  }));
  check("two weak turns push doubt over branch-block threshold", doubtState.doubt >= 30, `doubt=${doubtState.doubt}`);

  // The winning emergency phrase, but with priorDoubt already >= 30 — should be blocked.
  await page.locator("textarea").fill("Maggie here. Stranger at the house, please hurry home now.");
  await page.locator("text=Place Call").first().click();
  await page.waitForTimeout(800);
  doubtState = await page.evaluate(() => ({
    doubt: window.__vt.getState().activeCall?.doubt ?? 0,
    branch: window.__vt.getState().npcs.bankManager.branch,
    npcReplies: (window.__vt.getState().activeCall?.transcript ?? [])
      .filter((t) => t.role === "npc")
      .map((t) => t.text),
  }));
  check(
    "branch flip blocked when prior doubt was high",
    doubtState.branch === "default",
    `branch=${doubtState.branch}, last npc reply=${doubtState.npcReplies.slice(-1)[0]}`,
  );
  check(
    "blocked turn shows pushback text",
    doubtState.npcReplies.some((r) => /sound off|slow down/i.test(r)),
    `replies=${JSON.stringify(doubtState.npcReplies)}`,
  );

  // Test 3 (out-of-character vocabulary): wife saying "ledger, vault,
  // patrol" — high noun density but ALL foreign to Margaret — should spike
  // doubt instead of lowering it. This is the imsim purist's specific
  // regression: the old analyzer rewarded keyword density regardless of
  // who was speaking.
  await page.evaluate(() => {
    window.__vt.getState().setActiveCall(null);
    window.__vt.getState().togglePhone(false);
  });
  await page.waitForTimeout(300);
  await page.keyboard.press("p");
  await page.waitForTimeout(400);
  await page.locator("select").nth(1).selectOption("card_wife_doubt");
  await page.locator("textarea").fill("Harry the ledger and vault and patrol records combination teller alley");
  await page.locator("text=Place Call").first().click();
  await waitFor(
    page,
    () => (window.__vt.getState().activeCall?.transcript ?? []).some((t) => t.role === "npc"),
    "out-of-character vocab gets a reply",
    4000,
  );
  doubtState = await page.evaluate(() => ({
    doubt: window.__vt.getState().activeCall?.doubt ?? 0,
    branch: window.__vt.getState().npcs.bankManager.branch,
  }));
  check(
    "out-of-character vocab from wife spikes doubt above 30",
    doubtState.doubt >= 30,
    `doubt=${doubtState.doubt}`,
  );
  check(
    "out-of-character vocab does NOT flip branch",
    doubtState.branch === "default",
    `branch=${doubtState.branch}`,
  );

  // Test 4: Fresh call with strong opener should flip branch normally.
  // Wait past the prev call's 4200ms auto-hangup setTimeout so it can't
  // close the phone mid-fill below.
  await page.waitForTimeout(4500);
  await page.evaluate(() => {
    window.__vt.getState().setActiveCall(null);
    window.__vt.getState().togglePhone(false);
  });
  await page.waitForTimeout(300);
  await page.keyboard.press("p");
  await page.waitForTimeout(400);
  await page.locator("select").nth(1).selectOption("card_wife_doubt");
  await page.locator("textarea").fill(
    "Harry, please listen. There is a stranger at the bedroom window. I am scared and I need you to come home now.",
  );
  await page.locator("text=Place Call").first().click();
  await waitFor(
    page,
    () => window.__vt.getState().npcs.bankManager.branch === "rushedHome",
    "strong opener flips branch normally",
    4000,
  );
  doubtState = await page.evaluate(() => ({
    doubt: window.__vt.getState().activeCall?.doubt ?? 0,
    branch: window.__vt.getState().npcs.bankManager.branch,
  }));
  check("strong specific opener keeps doubt low", doubtState.doubt < 30, `doubt=${doubtState.doubt}`);
  check("strong specific opener flips branch", doubtState.branch === "rushedHome");

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

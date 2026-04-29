// @ts-nocheck
const { chromium } = require("playwright");
const fs = require("fs");

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
    ],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

  const out = "docs/screenshots";

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/01-landing.png` });

  await page.goto("http://localhost:3000/play", { waitUntil: "networkidle" });
  await page.waitForTimeout(2400);
  await page.screenshot({ path: `${out}/02-title.png` });

  await page.locator("text=Start").first().click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${out}/03-intro.png` });

  const skip = page.locator("text=Skip");
  if (await skip.count()) await skip.click();
  await page.waitForTimeout(2500);

  // Fake pointer-locked so the "click to look around" hint doesn't
  // appear in every shot (headless can't actually engage pointer lock)
  await page.evaluate(() => {
    window.__vt.setState({ pointerLocked: true });
  });
  await page.waitForTimeout(300);

  // Helper: position the player + aim the FP camera
  async function fp(pos, look, scene) {
    await page.evaluate(
      ({ pos, look, scene }) => {
        const s = window.__vt.getState();
        if (scene) s.setPlayerLocation(scene);
        s.setPlayerPosition({ x: pos[0], y: 0, z: pos[1] });
        const cam = window.__vtCamera;
        if (cam) {
          cam.position.set(pos[0], 1.62, pos[1]);
          cam.lookAt(look[0], 1.4, look[1]);
        }
      },
      { pos, look, scene: scene ?? null },
    );
  }

  // FP — looking down the block from sidewalk near payphone toward the bank
  await fp([4, 6], [-6, -1]);
  await page.waitForTimeout(900);
  await fp([4, 6], [-6, -1]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/04-fp-street.png` });

  // FP — payphone close-up
  await fp([4, 6], [2, 3]);
  await page.waitForTimeout(300);
  await fp([4, 6], [2, 3]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/05-fp-payphone.png` });

  // FP — bank facade head-on
  await fp([-10, 5], [-10, 0]);
  await page.waitForTimeout(300);
  await fp([-10, 5], [-10, 0]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/06-fp-bank-facade.png` });

  // FP — looking up at apartments fire escape
  await fp([14, 4], [18, 0]);
  await page.waitForTimeout(300);
  await fp([14, 4], [18, 0]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/06b-fp-apartments.png` });

  await fp([0, 4], [0, -5], "bankLobby");
  await page.waitForTimeout(2400);
  await fp([0, 4], [0, -5], "bankLobby");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/07-fp-bank-lobby.png` });

  await page.evaluate(() => {
    window.__vt.setState({ vaultOpen: true });
  });
  // Stand inside the vault chamber, off-axis from the door, looking at
  // the deposit-box wall + briefcase pedestal.
  await fp([-1.5, -13], [1, -16], "vault");
  await page.waitForTimeout(2400);
  await fp([-1.5, -13], [1, -16], "vault");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/08-fp-vault.png` });

  await fp([2, 2], [-3, -3], "apartment");
  await page.waitForTimeout(2400);
  await fp([2, 2], [-3, -3], "apartment");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/09-fp-apartment.png` });

  await fp([1, 0.5], [-3, -3.5], "cafe");
  await page.waitForTimeout(2400);
  await fp([1, 0.5], [-3, -3.5], "cafe");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/10-fp-cafe.png` });

  // Diorama view
  await page.evaluate(() => {
    const s = window.__vt.getState();
    s.setPlayerLocation("street");
    window.__vt.setState({ viewMode: "diorama" });
  });
  await page.waitForTimeout(2400);
  await page.screenshot({ path: `${out}/11-diorama-street.png` });

  // Notebook
  await page.evaluate(() => {
    const s = window.__vt.getState();
    s.addVoiceCard({
      id: "shot_mgr_calm",
      npcId: "bankManager",
      elevenLabsVoiceId: "mock_voice_bankManager_calm",
      capturedAtInGameTime: 18 * 3600 + 15 * 60,
      emotionalState: "calm",
      durationSeconds: 6,
      sourceMomentId: "manager-cigarette-6_15",
      mock: true,
    });
    s.addVoiceCard({
      id: "shot_wife",
      npcId: "wife",
      elevenLabsVoiceId: "mock_voice_wife_calm",
      capturedAtInGameTime: 18 * 3600 + 30 * 60,
      emotionalState: "calm",
      durationSeconds: 5,
      sourceMomentId: "wife-gossip-6_30",
      mock: true,
    });
    window.__vt.setState({
      inGameTime: 18 * 3600 + 40 * 60,
      vaultOpen: false,
      briefcaseTaken: false,
      bankHallwayUnlocked: false,
      notebookOpen: true,
      phoneOpen: false,
      menuOpen: false,
    });
  });
  await page.waitForTimeout(500);
  const leads = page.locator("text=leads").first();
  if (await leads.count()) {
    await leads.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/12-notebook-leads.png` });
  }
  const voices = page.locator("text=voices").first();
  if (await voices.count()) {
    await voices.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/13-notebook-voices.png` });
  }
  const sched = page.locator("text=schedule").first();
  if (await sched.count()) {
    await sched.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/14-notebook-schedule.png` });
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  // Phone
  await page.evaluate(() => {
    window.__vt.setState({ phoneOpen: true, notebookOpen: false, menuOpen: false });
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/15-phone.png` });

  // Pause menu
  await page.evaluate(() => {
    window.__vt.setState({
      inGameTime: 19 * 3600 + 5 * 60,
      suspicion: 15,
      phoneOpen: false,
      menuOpen: true,
    });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/16-pause-menu.png` });

  // Ending card
  await page.evaluate(() => {
    const state = window.__vt.getState();
    window.__vt.setState({
      phase: "won",
      inGameTime: 20 * 3600 + 52 * 60,
      suspicion: 15,
      menuOpen: false,
      phoneOpen: false,
      notebookOpen: false,
      briefcaseTaken: true,
      vaultOpen: true,
      bankHallwayUnlocked: true,
      npcs: {
        ...state.npcs,
        bankManager: {
          ...state.npcs.bankManager,
          branch: "rushedHome",
        },
      },
      player: {
        ...state.player,
        hasBriefcase: true,
      },
    });
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/17-ending-win.png` });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});

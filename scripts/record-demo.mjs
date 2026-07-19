import { chromium } from "@playwright/test";
import { mkdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const BASE_URL = process.env.DEMO_URL ?? "http://127.0.0.1:5173";
const OUT_DIR = join(process.cwd(), "recordings");
const TEMP_DIR = join(OUT_DIR, "temp");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pauseOn(page, testId, ms = 1800) {
  const locator = page.getByTestId(testId);
  await locator.scrollIntoViewIfNeeded();
  await locator.hover().catch(() => undefined);
  await sleep(ms);
}

async function main() {
  mkdirSync(TEMP_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    slowMo: 60,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: TEMP_DIR,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  // 1. Landing
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await sleep(2200);
  await page.getByTestId("landing-tab-solutions").click();
  await sleep(1600);
  await page.getByTestId("landing-tab-product").click();
  await sleep(1400);

  // 2. Enter app
  await page.getByTestId("enter-app").click();
  await page.getByRole("heading", { name: "Truth gate for voice negotiators." }).waitFor();
  await sleep(2000);

  // 3. Job spec + hero
  await page.getByLabel("Confirmed job specification").scrollIntoViewIfNeeded();
  await sleep(2000);

  // 4. Honesty gate
  await pauseOn(page, "truth-gate-panel", 2200);
  await pauseOn(page, "truth-gate-fabricated-1700", 1600);
  await pauseOn(page, "truth-gate-supported-1850", 1600);

  // 5. Evidence inspection
  await page.getByTestId("inspect-evidence-b-all-in").scrollIntoViewIfNeeded();
  await sleep(900);
  await page.getByTestId("inspect-evidence-b-all-in").click();
  await page.getByTestId("evidence-drawer").waitFor();
  await sleep(2600);
  await page.getByRole("button", { name: "Close evidence drawer" }).click();
  await sleep(800);

  // 6. Quote ledger
  await page.getByLabel("Quote delta ledger").scrollIntoViewIfNeeded();
  await sleep(2400);

  // 7. Call console + recommendation
  await pauseOn(page, "call-console", 2000);
  await pauseOn(page, "recommendation-report", 2400);

  // 8. Scroll back to hero for closing beat
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2200);

  const video = page.video();
  await context.close();
  await browser.close();

  const webmPath = video ? await video.path() : null;
  if (!webmPath) {
    throw new Error("Playwright did not produce a video file.");
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const finalWebm = join(OUT_DIR, `oacto-demo-${stamp}.webm`);
  const finalMp4 = join(OUT_DIR, `oacto-demo-${stamp}.mp4`);
  renameSync(webmPath, finalWebm);

  const ffmpeg = spawnSync(
    "ffmpeg",
    ["-y", "-i", finalWebm, "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "faststart", finalMp4],
    { stdio: "inherit" },
  );

  if (ffmpeg.status !== 0) {
    console.log(`WebM saved (ffmpeg failed): ${finalWebm}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Demo video ready: ${finalMp4}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

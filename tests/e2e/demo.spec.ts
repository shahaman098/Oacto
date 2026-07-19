import { expect, test, type Page } from "@playwright/test";

async function enterApp(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("landing-page")).toBeVisible();
  await page.getByTestId("enter-app").click();
  await expect(page.getByRole("heading", { name: "Truth gate for voice negotiators." })).toBeVisible();
}

test("shows the Oacto landing gate before the app", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("landing-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Verify every quote/i })).toBeVisible();
  await expect(page.getByText("Unlock every dollar.")).toBeVisible();
  await expect(page.getByTestId("landing-delta")).toHaveText("$50", { timeout: 4000 });
  await expect(page.getByText(/call-b · 18–21/)).toBeVisible();

  await page.getByTestId("landing-tab-solutions").click();
  await expect(page.getByTestId("landing-panel-solutions")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Live calls with/i })).toBeVisible();

  await page.getByTestId("landing-tab-customers").click();
  await expect(page.getByTestId("landing-panel-customers")).toBeVisible();
  await expect(page.getByText("Who it serves")).toBeVisible();

  await page.getByTestId("landing-tab-resources").click();
  await expect(page.getByTestId("landing-panel-resources")).toBeVisible();
  await expect(page.getByText("Truth gate panel")).toBeVisible();

  await page.getByTestId("landing-tab-product").click();
  await page.getByTestId("enter-app").click();
  await expect(page.getByTestId("landing-page")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Truth gate for voice negotiators." })).toBeVisible();
});

test("shows the quote delta ledger demo", async ({ page }) => {
  await enterApp(page);

  const ledger = page.getByLabel("Quote delta ledger");
  await expect(page.getByLabel("Confirmed job specification")).toContainText("Rock Hill, SC");
  await expect(page.getByLabel("Confirmed job specification")).toContainText("Charlotte, NC");
  await expect(ledger.getByRole("heading", { name: "Carolina Quick Move" })).toBeVisible();
  await expect(ledger.getByRole("heading", { name: "Queen City Movers" })).toBeVisible();
  await expect(ledger.getByRole("heading", { name: "Metro Van Line" })).toBeVisible();
  await expect(page.getByText("Potential delta", { exact: true })).toBeVisible();
  await expect(page.getByText("Allowed: leverage cites call-b lines 18-21.")).toBeVisible();
  await expect(page.getByTestId("call-console")).toBeVisible();
  await expect(page.getByTestId("start-voice-call")).toBeVisible();
  await expect(page.getByTestId("truth-gate-panel")).toBeVisible();
  await expect(page.getByTestId("truth-gate-fabricated-1700")).toContainText("blocked");
  await expect(page.getByTestId("truth-gate-supported-1850")).toContainText("allowed");
  await expect(page.getByTestId("recommendation-report")).toBeVisible();
});

test("reports live voice startup failures without falling back", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => new AudioContext().createMediaStreamDestination().stream,
      },
    });
  });
  await page.route("**/api/elevenlabs/session", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "ELEVENLABS_API_KEY is required for a live voice call" }),
    });
  });
  await enterApp(page);

  await page.getByTestId("start-voice-call").click();
  const eventLog = page.getByTestId("call-event-log");
  await expect(eventLog).toContainText("Microphone permission granted");
  await expect(eventLog).toContainText("HTTP 503");
  await expect(eventLog).toContainText("ELEVENLABS_API_KEY is required");
  await expect(page.getByText("Live-only · no fallback")).toBeVisible();
  await expect(page.getByTestId("call-transcript")).toHaveCount(0);
});

test("opens the transcript span evidence inspector", async ({ page }) => {
  await enterApp(page);

  await page.getByTestId("inspect-evidence-b-all-in").click();

  const drawer = page.getByTestId("evidence-drawer");
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "All-in move" })).toBeVisible();
  await expect(drawer.getByText("Queen City Movers")).toBeVisible();
  await expect(drawer.getByText("confirmed", { exact: true })).toBeVisible();
  await expect(drawer.getByText("$1,850")).toBeVisible();
  await expect(drawer.getByText("call-b", { exact: true })).toBeVisible();
  await expect(drawer.getByText("18-21", { exact: true })).toBeVisible();
  await expect(drawer.getByTestId("evidence-drawer-quote")).toHaveText(
    "That is eighteen fifty all-in, stairs included.",
  );

  await page.getByRole("button", { name: "Close evidence drawer" }).click();
  await expect(drawer).toHaveCount(0);
});

test("opens the live negotiation and exports the recommendation report", async ({ page }) => {
  await enterApp(page);

  await expect(page.getByTestId("hero-delta")).toHaveText("$0");
  await page.getByTestId("run-negotiation").click();
  await expect(page.getByTestId("call-console")).toBeInViewport();
  await expect(page.getByTestId("live-call-status")).toContainText("ready for live call");
  await expect(page.getByTestId("send-verified-ask")).toBeDisabled();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-report").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("quote-delta-recommendation.md");
});

test("runs AI extraction panel with fixture-backed OpenAI and Tavily results", async ({ page }) => {
  await enterApp(page);

  const panel = page.getByTestId("extraction-panel");
  await expect(panel).toBeVisible();
  await panel.getByTestId("run-extraction").click();

  await expect(page.getByTestId("extraction-mode")).toHaveText("mode: fixture");
  await expect(page.getByTestId("extracted-assertions")).toContainText("transcript evidence");
  await expect(page.getByTestId("verification-findings")).toContainText("web evidence");
  await expect(page.getByTestId("verification-findings")).toContainText("warning");

  await page.getByTestId("merge-extraction").click();
  await expect(page.getByTestId("merge-success")).toBeVisible();
  await expect(page.getByLabel("Quote delta ledger").getByRole("heading", { name: "Piedmont Haulers" })).toBeVisible();
});

test("judge path covers honesty gate, evidence, live call entry, and recommendation", async ({ page }) => {
  await enterApp(page);

  await expect(page.getByLabel("Confirmed job specification")).toContainText("2-bedroom apartment");
  await expect(page.getByText("vague", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("hidden", { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("truth-gate-fabricated-1700")).toContainText("blocked");
  await expect(page.getByTestId("truth-gate-supported-1850")).toContainText("allowed");

  await page.getByTestId("inspect-evidence-a-stairs").click();
  await expect(page.getByTestId("evidence-drawer")).toContainText("vague");
  await page.getByRole("button", { name: "Close evidence drawer" }).click();

  await page.getByTestId("run-negotiation").click();
  await expect(page.getByTestId("start-voice-call")).toBeInViewport();
  await expect(page.getByText("Real ElevenLabs call", { exact: true })).toBeVisible();
  await expect(page.getByText("Live-only · no fallback")).toBeVisible();
  await expect(page.getByTestId("recommendation-report")).toContainText("Carolina Quick Move");
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps landing and live-call entry within the mobile viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("landing-page")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    ).toBe(true);

    await page.getByTestId("enter-app").click();
    await expect(page.getByRole("heading", { name: "Truth gate for voice negotiators." })).toBeVisible();
    await page.getByTestId("run-negotiation").click();
    await expect(page.getByTestId("start-voice-call")).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    ).toBe(true);
  });
});

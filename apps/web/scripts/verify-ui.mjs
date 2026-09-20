import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  computeNatalChart, computeSynastry, computeTransitsToChart,
  computeSecondaryProgression, computeHellenisticProfile, findAspects,
} from "../../../packages/astro-engine/src/index.ts";

const require = createRequire(import.meta.url);
const origin = process.env.UI_BASE_URL ?? "http://127.0.0.1:5173";
const output = fileURLToPath(new URL("../../../docs/ui-evidence/", import.meta.url));
const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
await mkdir(output, { recursive: true });

let people = [
  { id: "alex", name: "Alex Morgan", localDateTime: "1990-06-15T10:30:00", locationName: "London, United Kingdom", timezone: "Europe/London", latitude: 51.5, longitude: -0.12 },
  { id: "jordan", name: "Jordan Lee", localDateTime: "1992-03-11T14:00:00", locationName: "Portland, Oregon", timezone: "America/Los_Angeles", latitude: 45.52, longitude: -122.68 },
  { id: "casey", name: "Casey Taylor", localDateTime: "1988-09-22T12:00:00", locationName: "Bristol, United Kingdom", timezone: "Europe/London", latitude: 51.45, longitude: -2.59, timeUnknown: true },
  { id: "river", name: "River Chen", localDateTime: "1995-01-04T09:15:00", locationName: "Toronto, Canada", timezone: "America/Toronto", latitude: 43.65, longitude: -79.38 },
].map(person => ({ timeUnknown: false, createdAt: "2026-09-20T12:00:00Z", ...person }));
const initialPeople = [...people];
const chartA = computeNatalChart(people[0]);
const chartB = computeNatalChart(people[1]);
let report = { ...computeSynastry(chartA, chartB), id: "example", personAName: "Alex Morgan", personBName: "Jordan Lee", zodiacMode: "tropical", ayanamsa: "lahiri", relationshipType: "romantic", readingStyle: "clever", customStyleText: "", archetypeName: null };
let failSave = true;
let failPeople = false;
let failTransits = false;
let submittedComparison;
const evidence = { environment: {}, matrix: [], accessibility: [], interactions: [], errors: [] };
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
await page.clock.setFixedTime(new Date("2026-09-20T12:00:00Z"));
page.on("pageerror", error => evidence.errors.push(error.message));
await page.route(`${origin}/api/**`, async route => {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;
  const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  if (path.startsWith("/api/ai/")) return route.fulfill({ contentType: "text/event-stream", body: 'event: done\ndata: {"text":"A thoughtful balance of curiosity and connection. This sample reading is used only for interface verification."}\n\n' });
  if (path.startsWith("/api/geo/")) return json([{ locationName: "London, United Kingdom", latitude: 51.5, longitude: -0.12, timezone: "Europe/London" }]);
  if (path === "/api/people") {
    if (request.method() === "POST") {
      if (failSave) { failSave = false; return json({ error: "Sample save failed. Please try again." }, 503); }
      const person = { ...request.postDataJSON(), id: "new-person", createdAt: "2026-09-20T12:00:00Z" };
      people = [...people, person];
      return json(person, 201);
    }
    return failPeople ? json({ error: "Sample people service unavailable." }, 503) : json(people);
  }
  if (path.startsWith("/api/people/")) {
    const id = path.split("/")[3];
    if (request.method() === "DELETE") { people = people.filter(person => person.id !== id); return route.fulfill({ status: 204 }); }
    return json(people.find(person => person.id === id));
  }
  if (path.startsWith("/api/charts/")) {
    const [, , , id, kind] = path.split("/");
    const person = people.find(person => person.id === id);
    if (!person) return json({ error: "Person not found" }, 404);
    const chart = computeNatalChart(person, "placidus", url.searchParams.get("zodiacMode") ?? "tropical", url.searchParams.get("ayanamsa") ?? "lahiri");
    const date = new Date(url.searchParams.get("date") ?? "2026-09-20T12:00:00Z");
    if (kind === "transits") return failTransits ? json({ error: "Unavailable" }, 503) : json(computeTransitsToChart(chart, date));
    if (kind === "progressions") { const progression = computeSecondaryProgression(chart, date); return json({ ...progression, crossAspectsToNatal: findAspects(progression.chart.points, chart.points) }); }
    if (kind === "hellenistic") { const profile = computeHellenisticProfile(chart, date); return profile ? json(profile) : json({ error: "Birth time unknown" }, 422); }
    return json(chart);
  }
  if (path === "/api/synastry" && request.method() === "POST") { submittedComparison = request.postDataJSON(); report = { ...report, ...submittedComparison }; return json(report); }
  if (path.endsWith("/transits") && path.startsWith("/api/synastry/")) {
    if (failTransits) return json({ error: "Unavailable" }, 503);
    const date = new Date("2026-09-20T12:00:00Z");
    const transitA = computeTransitsToChart(chartA, date);
    return json({ transitingChart: transitA.transitingChart, hitsToPersonA: transitA.hits, hitsToPersonB: computeTransitsToChart(chartB, date).hits, hitsToComposite: computeTransitsToChart(report.compositeChart, date).hits });
  }
  if (path.startsWith("/api/synastry/")) return json(report);
  return json({ error: "Unmapped verification API" }, 404);
});

async function geometry(label) {
  const measured = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    wheels: [...document.querySelectorAll('svg[aria-label="Astrology chart wheel"]')].map(wheel => {
      const rect = wheel.getBoundingClientRect();
      return { width: rect.width, height: rect.height, shapes: wheel.querySelectorAll("path,line,circle").length };
    }),
  }));
  assert.ok(measured.overflow <= 1, `${label}: document overflow ${measured.overflow}`);
  for (const wheel of measured.wheels) assert.ok(wheel.width > 0 && Math.abs(wheel.width - wheel.height) < 1 && wheel.shapes > 12, `${label}: invalid wheel`);
  evidence.matrix.push({ label, ...measured });
}

async function accessibility(label) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    const scan = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
    return { violations: scan.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })), incomplete: scan.incomplete.map(({ id }) => id) };
  });
  evidence.accessibility.push({ label, ...result });
  assert.deepEqual(result.violations, [], `${label}: accessibility violations`);
}

async function capture(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${output}/${name}.png` });
}

try {
  evidence.environment = { browser: browser.version(), origin, syntheticData: true, deviceScaleFactor: 1 };
  for (const [name, route, heading] of [
    ["workspace", "/", "Your people"], ["natal", "/chart/alex", "Element balance"],
    ["natal-now", "/chart/alex/now", "Transit timeline"],
    ["synastry", "/synastry/example", "Cross-aspect grid"],
    ["synastry-now", "/synastry/example/now", "Today's sky: element balance"], ["wiki", "/wiki", "Key terms"],
  ]) {
    await page.goto(`${origin}${route}`);
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const [width, height] of [[320, 700], [375, 812], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1728, 1000], [667, 375]]) {
      await page.setViewportSize({ width, height });
      await geometry(name);
      if (width === 375) { await accessibility(`${name}-mobile`); if (["workspace", "natal"].includes(name)) await capture(`${name}-mobile`); }
      if (width === 1440) await capture(`${name}-wide`);
    }
  }

  await page.goto(origin);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Add a person", exact: true }).click();
  await capture("person-dialog-mobile");
  await accessibility("person-dialog");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Sample Person");
  await page.getByLabel("Birth date & time (local)").fill("1991-05-20T10:30");
  await page.getByRole("combobox", { name: "Birth location" }).fill("London");
  await page.getByRole("option").first().waitFor();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  assert.equal(await page.getByRole("textbox", { name: "Latitude", exact: true }).inputValue(), "51.5");
  await page.getByRole("button", { name: "Save person" }).click();
  await page.getByRole("alert").filter({ hasText: "Sample save failed" }).waitFor();
  assert.equal(await page.getByRole("textbox", { name: "Name", exact: true }).inputValue(), "Sample Person");
  await page.getByRole("button", { name: "Save person" }).click();
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Remove Sample Person", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(await page.getByRole("link", { name: "View Sample Person's chart" }).count(), 1);
  await page.getByRole("button", { name: "Remove Sample Person", exact: true }).click();
  await page.getByRole("button", { name: "Remove person", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "detached" });
  evidence.interactions.push("Geocoder keyboard selection, save failure/draft/retry/success, remove cancel/confirmation");

  await page.getByRole("combobox", { name: "Person A", exact: true }).selectOption("alex");
  await page.getByRole("combobox", { name: "Person B", exact: true }).selectOption("jordan");
  await page.getByRole("button", { name: "Sidereal", exact: true }).click();
  await page.getByLabel("Ayanamsa").selectOption("fagan_bradley");
  await page.getByLabel("Friendship", { exact: true }).check();
  await page.getByRole("combobox", { name: "Reading style", exact: true }).selectOption("other");
  await page.getByLabel("Custom reading style").fill("Reflective");
  await page.getByRole("button", { name: "Generate synastry report" }).click();
  await page.waitForURL("**/synastry/example");
  assert.equal(submittedComparison.zodiacMode, "sidereal");
  assert.equal(submittedComparison.ayanamsa, "fagan_bradley");
  assert.equal(submittedComparison.relationshipType, "friendship");
  assert.equal(submittedComparison.customStyleText, "Reflective");
  evidence.interactions.push("Comparison settings and report navigation");

  await page.goto(`${origin}/chart/alex`);
  await page.locator("button.placement").first().focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  assert.ok(await page.locator("button.placement").first().evaluate(element => element === document.activeElement));
  await page.getByRole("button", { name: "Sun", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Sun", exact: true }).getAttribute("aria-pressed"), "false");
  await page.getByRole("button", { name: "Sun", exact: true }).click();
  await page.getByRole("button", { name: "Sidereal", exact: true }).click();
  await page.getByLabel("Ayanamsa").waitFor();
  await geometry("sidereal-mobile");
  await page.getByRole("button", { name: "Ask AI", exact: true }).click();
  await page.getByRole("region", { name: "Conversation" }).getByText(/A thoughtful balance/).waitFor();
  for (let step = 0; step < 12; step++) { await page.keyboard.press("Tab"); assert.ok(await page.getByRole("dialog").evaluate(dialog => dialog.contains(document.activeElement))); }
  await page.setViewportSize({ width: 667, height: 375 });
  await geometry("drawer-landscape");
  await accessibility("drawer-landscape");
  await capture("drawer-landscape");
  await page.keyboard.press("Escape");
  assert.ok(await page.getByRole("button", { name: "Ask AI" }).evaluate(element => element === document.activeElement));
  evidence.interactions.push("Placement Enter/Escape/focus return, point toggles, sidereal controls, drawer Tab containment/Escape");

  await page.getByRole("link", { name: "Current sky", exact: true }).click();
  await page.getByRole("heading", { name: "Transit timeline" }).waitFor();
  await page.getByLabel("Transit date", { exact: true }).fill("2026-10-01");
  await page.getByRole("heading", { name: "Transit timeline" }).waitFor();
  failTransits = true;
  await page.getByLabel("Transit date", { exact: true }).fill("2026-10-02");
  await page.getByRole("alert").filter({ hasText: "Transits are unavailable" }).waitFor();
  evidence.interactions.push("Current-sky date refresh and explicit transit failure");
  failTransits = false;

  await page.goto(`${origin}/chart/alex`);
  await page.locator(".placement").first().waitFor();
  await page.setViewportSize({ width: 320, height: 700 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; document.querySelector("h1").textContent = "AlexandriaVeryLongUnbrokenExampleName"; });
  await geometry("enlarged-text-200-percent");
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.getByRole("link", { name: "Dashboard", exact: true }).focus();
  assert.ok(await page.getByRole("link", { name: "Dashboard", exact: true }).evaluate(element => getComputedStyle(element).outlineStyle !== "none"));
  await geometry("forced-colors-reduced-motion");
  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "none" });
  evidence.interactions.push("200% root-text enlargement with long name, forced colors, reduced motion, focus outline");

  people = [];
  await page.goto(origin);
  await page.getByRole("button", { name: "Add your first person" }).waitFor();
  failPeople = true;
  await page.reload();
  await page.getByRole("alert").filter({ hasText: "Sample people service unavailable" }).waitFor();
  evidence.interactions.push("Empty people and API error states");
  people = initialPeople;
  assert.deepEqual(evidence.errors, [], "Browser runtime errors");
  await writeFile(`${output}/results.json`, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ geometryChecks: evidence.matrix.length, accessibilityScans: evidence.accessibility.length, interactions: evidence.interactions, runtimeErrors: evidence.errors, screenshots: output }, null, 2));
} finally {
  await browser.close();
}
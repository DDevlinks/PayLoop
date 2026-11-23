import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Issue #73: every top-level route has its own <title>. The pages are client
// components, so the titles live in route-segment layout.tsx files (or, for
// /help and /pay/[id], in the page itself).

const app = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app");

const routeFiles = {
  create: "create/layout.tsx",
  dashboard: "dashboard/layout.tsx",
  history: "history/layout.tsx",
  activity: "activity/layout.tsx",
  withdraw: "withdraw/layout.tsx",
  pitch: "pitch/layout.tsx",
  statement: "statement/layout.tsx",
  help: "help/page.tsx",
};

function titleOf(file) {
  const src = readFileSync(join(app, file), "utf8");
  assert.match(src, /export const metadata/, `${file} must export metadata`);
  const m = /title:\s*"([^"]+)"/.exec(src);
  assert.ok(m, `${file} must set a string title`);
  return m[1];
}

test("every route sets its own title", () => {
  for (const [route, file] of Object.entries(routeFiles)) {
    assert.ok(existsSync(join(app, file)), `${route}: ${file} is missing`);
    assert.ok(titleOf(file).length > 0, `${route} has an empty title`);
  }
});

test("route titles are unique and differ from the site default", () => {
  const titles = Object.values(routeFiles).map(titleOf);
  assert.equal(new Set(titles).size, titles.length, `duplicate titles: ${titles}`);
  const layout = readFileSync(join(app, "layout.tsx"), "utf8");
  const def = /default:\s*"([^"]+)"/.exec(layout)?.[1];
  assert.ok(def, "root layout must declare a default title");
  assert.ok(!titles.includes(def));
});

test("the root layout appends the site name through a title template", () => {
  const layout = readFileSync(join(app, "layout.tsx"), "utf8");
  assert.match(layout, /template:\s*"%s · PayLoop"/);
});

test("route layouts render their children unchanged", () => {
  for (const [route, file] of Object.entries(routeFiles)) {
    if (!file.endsWith("layout.tsx")) continue;
    const src = readFileSync(join(app, file), "utf8");
    assert.match(src, /return children;/, `${route} layout must not wrap its children`);
  }
});

test("the pay page keeps its dynamic per-invoice metadata", () => {
  const src = readFileSync(join(app, "pay", "[id]", "page.tsx"), "utf8");
  assert.match(src, /generateMetadata/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPreviewServer } from "../tools/preview.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index.html", "resume.html"];

for (const page of pages) {
  test(`${page}: semantic structure, local links, assets, and privacy`, async () => {
    const html = await readFile(resolve(root, page), "utf8");
    assert.match(html, /<html lang="en">/);
    assert.equal(
      [...html.matchAll(/<h1(?:\s|>)/g)].length,
      1,
      "One primary heading",
    );
    assert.match(html, /<main\s/);
    assert.match(html, /class="skip-link"/);
    assert.match(html, /name="description"/);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, "Unique IDs");
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = match[1];
      if (target.startsWith("#"))
        assert.ok(ids.includes(target.slice(1)), `Missing anchor: ${target}`);
      else if (!/^(https?:|mailto:)/.test(target))
        await access(resolve(root, target));
    }
    for (const match of html.matchAll(
      /aria-(?:labelledby|controls)="([^"]+)"/g,
    )) {
      for (const id of match[1].split(" "))
        assert.ok(ids.includes(id), `Missing ARIA target: ${id}`);
    }
    for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
      assert.match(match[0], /rel="noopener noreferrer"/);
    }
    assert.doesNotMatch(
      html,
      /gitlab\.phonepe|phonepecs\.com|\/Users\/|ADI-\d+|Username\s*-|Password\s*-/i,
    );
    assert.doesNotMatch(
      html,
      /<script[^>]+src="https?:/i,
      "No remote script dependencies",
    );
    assert.match(html, /PhonePe/);
    assert.match(html, /configuration-cache/);
    assert.match(html, /JUnit 5/);
  });
}

test("work controls preserve a readable, no-JavaScript baseline", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  assert.equal([...html.matchAll(/class="work-card"/g)].length, 6);
  assert.equal([...html.matchAll(/class="personal-project"/g)].length, 6);
  assert.match(html, /class="work-filters"[^>]*hidden/);
  assert.match(html, /class="menu-toggle"[^>]*hidden/);
  assert.doesNotMatch(html, /class="work-card"[^>]*hidden/);
  assert.equal([...html.matchAll(/class="work-detail"/g)].length, 6);
  const css = await readFile(
    resolve(root, "static/assets/css/portfolio.css"),
    "utf8",
  );
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /:focus-visible/);
});

test("public-only preview routes and HTTP behavior", async () => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const page of ["/", "/index.html", "/resume.html"]) {
      const response = await fetch(origin + page);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /text\/html/);
      assert.match(await response.text(), /Vishrut Goyal/);
    }
    for (const path of [
      "/.git/config",
      "/.env",
      "/app.py",
      "/requirements.txt",
      "/unknown",
      "/%2e%2e/.git/config",
    ]) {
      assert.equal((await fetch(origin + path)).status, 404, path);
    }
    assert.equal((await fetch(origin, { method: "POST" })).status, 405);
    const head = await fetch(origin + "/resume.html", { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    for (const path of [
      "css/portfolio.css",
      "css/resume.css",
      "js/portfolio.js",
      "img/monogram.svg",
      "img/profile-img.jpg",
    ]) {
      const response = await fetch(`${origin}/static/assets/${path}`);
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      await response.arrayBuffer();
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

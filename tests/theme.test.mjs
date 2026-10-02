import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(
  new URL("../static/assets/js/theme.js", import.meta.url),
  "utf8",
);
const css = await readFile(
  new URL("../static/assets/css/theme.css", import.meta.url),
  "utf8",
);
const key = "vg-portfolio-theme";

function page({
  saved = null,
  dark = false,
  blocked = false,
  loading = false,
} = {}) {
  const storage = new Map(saved === null ? [] : [[key, saved]]);
  const root = { dataset: {} };
  const meta = {
    setAttribute(name, value) {
      this[name] = value;
    },
  };
  const button = {
    hidden: true,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    addEventListener(name, handler) {
      this[name] = handler;
    },
  };
  const documentEvents = {};
  const windowEvents = {};
  const system = {
    matches: dark,
    addEventListener(name, handler) {
      this[name] = handler;
    },
  };
  const document = {
    documentElement: root,
    readyState: loading ? "loading" : "interactive",
    querySelector: () => meta,
    querySelectorAll: () => [button],
    addEventListener(name, handler) {
      documentEvents[name] = handler;
    },
  };
  const window = {
    matchMedia(query) {
      assert.equal(query, "(prefers-color-scheme: dark)");
      return system;
    },
    localStorage: {
      getItem(name) {
        if (blocked) throw new Error("Storage unavailable");
        return storage.get(name) ?? null;
      },
      setItem(name, value) {
        if (blocked) throw new Error("Storage unavailable");
        storage.set(name, value);
      },
    },
    addEventListener(name, handler) {
      windowEvents[name] = handler;
    },
  };
  vm.runInNewContext(source, { document, window });
  return { root, meta, button, storage, system, documentEvents, windowEvents };
}

test("theme is applied before DOM readiness and controls initialize later", () => {
  const state = page({ dark: true, loading: true });
  assert.equal(state.root.dataset.theme, "dark");
  assert.equal(state.meta.content, "#151c18");
  assert.equal(state.button.hidden, true);
  state.documentEvents.DOMContentLoaded();
  assert.equal(state.button.hidden, false);
  assert.equal(state.button.attributes["aria-pressed"], "true");
  assert.equal(state.button.title, "Switch to light mode");
});

test("system changes are followed until the visitor makes an explicit choice", () => {
  const state = page();
  assert.equal(state.root.dataset.theme, "light");
  state.system.matches = true;
  state.system.change();
  assert.equal(state.root.dataset.theme, "dark");
  state.button.click();
  assert.equal(state.root.dataset.theme, "light");
  assert.equal(state.storage.get(key), "light");
  state.system.change();
  assert.equal(state.root.dataset.theme, "light");
});

test("toggle saves the preference and synchronizes its accessible state", () => {
  const state = page();
  state.button.click();
  assert.equal(state.storage.get(key), "dark");
  assert.equal(state.button.attributes["aria-pressed"], "true");
  const revisit = page({ saved: state.storage.get(key) });
  assert.equal(revisit.root.dataset.theme, "dark");
  revisit.button.click();
  assert.equal(revisit.storage.get(key), "light");
  assert.equal(revisit.meta.content, "#f6f5ef");
  assert.equal(revisit.button.attributes["aria-pressed"], "false");
});

test("saved light preference overrides a dark system, including later changes", () => {
  const state = page({ saved: "light", dark: true });
  assert.equal(state.root.dataset.theme, "light");
  state.system.change();
  assert.equal(state.root.dataset.theme, "light");
});

test("invalid preferences fall back to the system", () => {
  assert.equal(
    page({ saved: "invalid", dark: true }).root.dataset.theme,
    "dark",
  );
  assert.equal(page({ saved: "invalid" }).root.dataset.theme, "light");
});

test("unavailable storage does not break initial rendering or toggling", () => {
  const state = page({ blocked: true });
  state.button.click();
  assert.equal(state.root.dataset.theme, "dark");
  state.button.click();
  assert.equal(state.root.dataset.theme, "light");
});

test("tabs synchronize preference changes and clearing restores system behavior", () => {
  const state = page();
  state.windowEvents.storage({ key: "unrelated", newValue: "dark" });
  assert.equal(state.root.dataset.theme, "light");
  state.windowEvents.storage({ key, newValue: "dark" });
  assert.equal(state.root.dataset.theme, "dark");
  state.windowEvents.storage({ key: null, newValue: null });
  assert.equal(state.root.dataset.theme, "light");
  state.system.matches = true;
  state.system.change();
  assert.equal(state.root.dataset.theme, "dark");
});

test("both pages load the pre-paint initializer and accessible theme control", async () => {
  for (const file of ["index.html", "resume.html"]) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.ok(
      html.indexOf('src="static/assets/js/theme.js"') <
        html.indexOf('rel="stylesheet"'),
    );
    assert.match(
      html,
      /<button\b[^>]*data-theme-toggle[^>]*aria-label="Dark mode"[^>]*aria-pressed="false"[^>]*hidden/,
    );
    assert.match(html, /href="static\/assets\/css\/theme.css"/);
  }
  assert.match(css, /@media screen\s*\{\s*:root\[data-theme="dark"\]/);
  assert.match(css, /@media print\s*\{[\s\S]*color-scheme: light/);
  assert.match(
    css,
    /@media print\s*\{[\s\S]*\.theme-toggle\s*\{\s*display: none !important/,
  );
});

function contrast(a, b) {
  const luminance = (hex) => {
    const rgb = hex
      .match(/[\da-f]{2}/gi)
      .map((value) => parseInt(value, 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("dark text colors meet WCAG AA normal-text contrast on their surfaces", () => {
  const tokens = Object.fromEntries(
    [...css.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  const pairs = [
    ["--ink", "--paper"],
    ["--muted", "--paper"],
    ["--green", "--paper"],
    ["--ink", "--feedback-surface"],
    ["--mobile-ink", "--mobile-surface"],
    ["--lifecycle-ink", "--lifecycle-surface"],
    ["--signal-ink", "--signal-surface"],
    ["--lab-ink", "--lab-surface"],
    ["--muted", "--experience-surface"],
    ["--badge-ink", "--badge-surface"],
    ["--muted", "--about-surface"],
    ["--muted", "--resume-surface"],
    ["--diagram-label", "--hero-surface"],
  ];
  for (const [foreground, background] of pairs)
    assert.ok(
      contrast(tokens[foreground], tokens[background]) >= 4.5,
      `${foreground} on ${background}`,
    );
});

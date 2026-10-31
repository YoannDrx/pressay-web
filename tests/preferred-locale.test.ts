import assert from "node:assert/strict";
import test from "node:test";
import { acceptedLocale, isAutomatedAgent, preferredLocale } from "../lib/preferred-locale.ts";
import { brandIconFiles, brandIconSVG } from "../lib/brand-icons.ts";

const chrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

test("Accept-Language picks the best supported language by quality", () => {
  assert.equal(acceptedLocale("en-US,en;q=0.9"), "en");
  assert.equal(acceptedLocale("fr-FR,fr;q=0.9,en;q=0.8"), "fr");
  assert.equal(acceptedLocale("de-DE,de;q=0.9,en;q=0.8,fr;q=0.5"), "en");
  assert.equal(acceptedLocale("en;q=0.4,fr-CA;q=0.7"), "fr");
  assert.equal(acceptedLocale("fr;q=0,en"), "en");
  assert.equal(acceptedLocale("de,es"), null);
  assert.equal(acceptedLocale("*"), null);
  assert.equal(acceptedLocale(""), null);
  assert.equal(acceptedLocale(null), null);
});

test("an explicit language cookie wins over the browser", () => {
  assert.equal(preferredLocale({ cookie: "fr", acceptLanguage: "en-US", userAgent: chrome }), "fr");
  assert.equal(preferredLocale({ cookie: "en", acceptLanguage: "fr-FR", userAgent: chrome }), "en");
  assert.equal(preferredLocale({ cookie: "de", acceptLanguage: "en-GB", userAgent: chrome }), "en");
});

test("first visits follow the browser, unknown languages get the fallback", () => {
  assert.equal(preferredLocale({ acceptLanguage: "en-GB,en;q=0.9", userAgent: chrome }), "en");
  assert.equal(preferredLocale({ acceptLanguage: "fr-BE", userAgent: chrome }), "fr");
  assert.equal(preferredLocale({ acceptLanguage: "ja", userAgent: chrome }), "fr");
  assert.equal(preferredLocale({ acceptLanguage: "ja", userAgent: chrome, fallback: "en" }), "en");
});

test("crawlers and link previews always get the x-default page", () => {
  for (const agent of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "facebookexternalhit/1.1",
    "Twitterbot/1.0",
    "curl/8.7.1",
  ]) {
    assert.equal(isAutomatedAgent(agent), true, agent);
    assert.equal(preferredLocale({ acceptLanguage: "en-US", userAgent: agent }), "fr", agent);
  }
  assert.equal(isAutomatedAgent(chrome), false);
});

test("marquee logos are served as standalone SVG files", () => {
  const files = brandIconFiles();
  assert.ok(files.includes("logos-slack-icon.svg"));
  assert.ok(files.includes("simple-cursor.svg"));
  for (const file of files) assert.match(brandIconSVG(file) ?? "", /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+">/, file);
  assert.equal(brandIconSVG("logos-not-listed.svg"), null);
  assert.equal(brandIconSVG("../package.json"), null);
});

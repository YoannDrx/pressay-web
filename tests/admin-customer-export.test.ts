import assert from "node:assert/strict";
import test from "node:test";
import { fill, missingTranslations } from "../lib/admin-i18n.ts";
import { customerExportMessages } from "../lib/admin-messages/customer-export.ts";

test("access-request export messages exist in French and English", () => {
  assert.deepEqual(missingTranslations(customerExportMessages), []);
  assert.deepEqual(
    missingTranslations({ fr: { a: "x" }, en: { a: "x", b: "y" } }),
    ["fr:b"],
  );
  assert.equal(
    fill(customerExportMessages.fr.failed, { status: 503 }),
    "Export indisponible (503).",
  );
});

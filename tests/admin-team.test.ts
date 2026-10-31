import assert from "node:assert/strict";
import test from "node:test";
import { fill, missingTranslations } from "../lib/admin-i18n.ts";
import { teamMessages } from "../lib/admin-messages/team.ts";

test("member and role messages exist in French and English", () => {
  assert.deepEqual(missingTranslations(teamMessages), []);
  assert.equal(
    fill(teamMessages.fr.sidebar.role, { role: teamMessages.fr.roles.readonly }),
    "Rôle : Lecture seule",
  );
  assert.equal(
    fill(teamMessages.en.sidebar.role, { role: teamMessages.en.roles.support }),
    "Role: Support",
  );
  for (const locale of ["fr", "en"] as const)
    assert.deepEqual(Object.keys(teamMessages[locale].roles), [
      "owner",
      "support",
      "readonly",
    ]);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  auditDetails,
  auditFilters,
  auditSearchParams,
} from "../lib/admin-audit.ts";

test("audit details read as one line, in French, without the replay flag when false", () => {
  assert.equal(auditDetails(null), "—");
  assert.equal(auditDetails({}), "—");
  assert.equal(
    auditDetails({ days: 30, replayed: false, platform: "windows", changed: true }),
    "jours 30 · plateforme Windows · modifié oui",
  );
  assert.equal(auditDetails({ replayed: true }), "rejoué oui");
  assert.match(auditDetails({ endsAt: "2027-01-01T12:00:00Z" }), /^fin 1 janv\. 2027$/);
  assert.equal(
    auditDetails({ webSessions: 2, oauthRefreshTokens: 1 }),
    "sessions web 2 · autorisations d’apps 1",
  );
});

test("audit filters drop values the API would refuse and hide reads by default", () => {
  assert.deepEqual(auditFilters({}), {
    action: "",
    target: "",
    from: "",
    to: "",
    reads: "exclude",
    cursor: "",
  });
  assert.deepEqual(
    auditFilters({
      action: "Grant.Create",
      target: " 00000000-0000-4000-8000-000000000001 ",
      from: "2026-10-01",
      to: "01/10/2026",
      reads: "include",
      cursor: "119",
    }),
    {
      action: "grant.create",
      target: "00000000-0000-4000-8000-000000000001",
      from: "2026-10-01",
      to: "",
      reads: "include",
      cursor: "119",
    },
  );
  assert.equal(auditFilters({ action: "drop table" }).action, "");
  assert.equal(auditFilters({ cursor: "1;2" }).cursor, "");
  assert.equal(auditFilters({ action: ["grant", "device"] }).action, "grant");
});

test("audit query strings omit empty filters and take the next cursor", () => {
  const filters = auditFilters({ action: "grant", cursor: "50" });
  assert.equal(auditSearchParams(filters).toString(), "action=grant&reads=exclude&cursor=50");
  assert.equal(auditSearchParams(filters, "12").toString(), "action=grant&reads=exclude&cursor=12");
  assert.equal(auditSearchParams(filters, "").toString(), "action=grant&reads=exclude");
});

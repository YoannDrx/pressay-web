-- Better Auth 1.7.0-rc / 1.7.0-1.7.2 required auth_accounts.issuer and a unique
-- (issuer, "accountId") index. Better Auth 1.7.3+ never writes that column:
-- without this migration every new Google/Apple account insert fails.
-- Apply on the Neon branch BEFORE deploying the web app on Better Auth 1.7.7.
-- Reference: https://www.better-auth.com/docs/guides/1-7-upgrade-guide

-- 1. Must return no rows (accounts are matched on providerId + accountId again).
SELECT "providerId", "accountId", count(*)
FROM auth_accounts
GROUP BY 1, 2
HAVING count(*) > 1;

-- 2. Relax the RC constraint. Drop the index before touching the column.
BEGIN;
-- Production names the RC index auth_accounts_issuer_account_id_uq (checked 2026-10-11);
-- the second name covers databases created from the upstream RC schema.
DROP INDEX IF EXISTS "auth_accounts_issuer_account_id_uq";
DROP INDEX IF EXISTS "auth_accounts_issuer_accountId_uidx";
ALTER TABLE auth_accounts ALTER COLUMN issuer DROP NOT NULL;
COMMIT;

-- 3. Optional later cleanup, once 1.7.7 is confirmed in production:
-- ALTER TABLE auth_accounts DROP COLUMN issuer;

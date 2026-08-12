import { DataType, newDb } from "pg-mem";
import { betterAuth } from "better-auth";
import { authOptions } from "../lib/auth";

// The Better Auth CLI introspects its database before compiling SQL. A fresh,
// in-memory Postgres instance keeps schema generation deterministic and makes
// it impossible for this command to alter staging or production.
const memoryDatabase = newDb();
memoryDatabase.public.registerOperator({
  operator: "!~",
  left: DataType.text,
  right: DataType.text,
  returns: DataType.bool,
  implementation: (value: string, pattern: string) => !new RegExp(pattern).test(value)
});
memoryDatabase.public.registerFunction({
  name: "has_schema_privilege",
  args: [DataType.text, DataType.text],
  returns: DataType.bool,
  implementation: () => true
});
memoryDatabase.public.registerFunction({
  name: "col_description",
  args: [DataType.integer, DataType.integer],
  returns: DataType.text,
  implementation: () => null,
  allowNullArguments: true
});
memoryDatabase.public.registerFunction({
  name: "pg_get_serial_sequence",
  args: [DataType.text, DataType.text],
  returns: DataType.text,
  implementation: () => null,
  allowNullArguments: true
});
memoryDatabase.public.registerFunction({
  name: "quote_ident",
  args: [DataType.text],
  returns: DataType.text,
  implementation: (value: string) => value
});
const { Pool } = memoryDatabase.adapters.createPg();

export const auth = betterAuth({
  ...authOptions,
  database: new Pool()
});

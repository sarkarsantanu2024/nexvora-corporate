// Creates (or resets) the owner login in Neon.
//
//   OWNER_NAME="Santanu Sarkar" OWNER_PHONE=98042xxxxx OWNER_PASSWORD=... npm run nx:seed-owner
//
// Reads .env if present. Needs DATABASE_URL.

import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const envFile = path.join(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { DATABASE_URL, OWNER_PHONE, OWNER_PASSWORD, OWNER_NAME = "Nexvora" } = process.env;
if (!DATABASE_URL || !OWNER_PHONE || !OWNER_PASSWORD) {
  console.error("Set DATABASE_URL, OWNER_PHONE and OWNER_PASSWORD in .env first.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
await sql`CREATE TABLE IF NOT EXISTS nx_users (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'client',
  sites text[] NOT NULL DEFAULT '{}',
  must_change_password boolean NOT NULL DEFAULT true,
  failed_logins int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
)`;
const phone = OWNER_PHONE.replace(/\D/g, "").slice(-10);
const hash = await bcrypt.hash(OWNER_PASSWORD, 10);
await sql`INSERT INTO nx_users (name, phone, password_hash, role, sites, must_change_password)
  VALUES (${OWNER_NAME}, ${phone}, ${hash}, 'owner', '{}', false)
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = 'owner', must_change_password = false`;
console.log(`Owner ${OWNER_NAME} (${phone}) is ready. Log in at /panel.`);

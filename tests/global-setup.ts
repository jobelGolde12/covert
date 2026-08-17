import { execSync } from "node:child_process";

export default function globalSetup() {
  const env = { ...process.env, DATABASE_URL: "file:./tests/test.db" };
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env,
    stdio: "pipe",
  });
}

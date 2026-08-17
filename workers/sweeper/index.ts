import "dotenv/config";
import { runRetentionSweep } from "./sweep";

/** Run once and exit — schedule via cron in production. */
runRetentionSweep()
  .then((n) => {
    console.log(`[sweeper] removed ${n} expired records`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("[sweeper] failed:", err);
    process.exit(1);
  });

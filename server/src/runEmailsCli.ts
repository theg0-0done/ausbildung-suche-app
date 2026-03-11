/**
 * runEmailsCli.ts
 *
 * This script serves as the entry point for running the daily email job
 * from a CLI or a headless environment (like GitHub Actions), without
 * starting the Express web server.
 */

import "dotenv/config";
import { runDailyEmailJob } from "./dailyEmailJob.js";

async function main() {
  console.log("Starting daily email job via CLI...");
  try {
    const result = await runDailyEmailJob();
    console.log("Job finished successfully:", result);
    process.exit(0);
  } catch (error) {
    console.error("Job failed with error:", error);
    process.exit(1);
  }
}

main();

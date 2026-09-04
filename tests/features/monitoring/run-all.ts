import { runMonitoringTests } from "./monitoring.test";

async function main() {
  try {
    await runMonitoringTests();
    console.log("Monitoring test suite passed.");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

main();

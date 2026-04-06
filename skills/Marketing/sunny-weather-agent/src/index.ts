import { loadConfig } from "./config.js";
import { runOrchestrator } from "./orchestrator.js";

async function main() {
  const config = loadConfig();
  await runOrchestrator(config);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});

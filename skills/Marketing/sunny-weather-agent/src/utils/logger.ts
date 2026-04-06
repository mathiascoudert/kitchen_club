import { mkdirSync, appendFileSync } from "fs";
import { join } from "path";

export class Logger {
  private logPath: string;
  private entries: string[] = [];

  constructor(projectRoot: string, timezone: string) {
    const dir = join(projectRoot, "logs");
    mkdirSync(dir, { recursive: true });

    const now = new Date().toLocaleDateString("en-CA", { timeZone: timezone });
    this.logPath = join(dir, `${now}.log`);
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}`;
    this.entries.push(line);
    console.log(line);
  }

  warn(message: string): void {
    this.log(`WARN: ${message}`);
  }

  error(message: string): void {
    this.log(`ERROR: ${message}`);
  }

  flush(): void {
    if (this.entries.length > 0) {
      appendFileSync(this.logPath, this.entries.join("\n") + "\n", "utf-8");
      this.entries = [];
    }
  }
}

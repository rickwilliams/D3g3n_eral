import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "url";

// Override the DEFAULT_CHARACTER environment variable
process.env.DEFAULT_CHARACTER = "D3g3n_eral";

// Import and run the test1.mjs file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testProcess = spawn("node", ["test1.mjs"], {
  cwd: __dirname,
  stdio: "inherit",
  env: { ...process.env, DEFAULT_CHARACTER: "D3g3n_eral" }
});

testProcess.on("close", (code) => {
  process.exit(code);
}); 
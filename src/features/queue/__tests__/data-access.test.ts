import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

function walk(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      if (entry !== "__tests__") files.push(...walk(fullPath));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

const featureFiles = walk("src/features/queue");
const queuePage = "src/app/(app)/queue/page.tsx";

test("the queue feature reads only through the approved RPC", () => {
  const service = readFileSync("src/features/queue/services.ts", "utf8");
  assert.match(service, /\.rpc\(\s*[\s\n]*"list_waitlist_entries"/);

  for (const file of [...featureFiles, queuePage]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(
      source,
      /\.from\(\s*["']waitlist_entries["']\s*\)/,
      `${file} must not select from waitlist_entries`,
    );
  }
});

test("the cashier phone value is never duplicated into tooltips or data attributes", () => {
  const card = readFileSync("src/features/queue/components/queue-entry-card.tsx", "utf8");

  assert.doesNotMatch(card, /title=\{?[^}\n]*contactPhone/);
  assert.doesNotMatch(card, /data-[a-z-]+=\{?[^}\n]*contactPhone/);
  assert.doesNotMatch(card, /copy|clipboard/i);
});

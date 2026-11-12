import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pagePath = "src/app/(app)/queue/page.tsx";
const screenPath = "src/features/queue/components/queue-screen.tsx";

test("the queue page seeds the snapshot from generatedAt, not a server clock", () => {
  const page = readFileSync(pagePath, "utf8");

  assert.doesNotMatch(page, /new Date\(\)/);
  assert.doesNotMatch(page, /initialLoadedAt/);
  assert.match(page, /initialData=\{result\.data\}/);
});

test("the queue screen seeds and refreshes its snapshot from the backend generatedAt", () => {
  const screen = readFileSync(screenPath, "utf8");

  assert.match(screen, /useState\(\(\) => queueSnapshotFromResponse\(initialData, 1\)\)/);
  assert.match(screen, /queueSnapshotForResult\(current, result, target\.page\)/);
  assert.doesNotMatch(screen, /new Date\(/);
});

test("live/not-live labels and pagination derive from the applied snapshot, not the requested page", () => {
  const screen = readFileSync(screenPath, "utf8");

  assert.match(screen, /const \{ data, lastRefreshed, page: displayedPage \} = snapshot;/);
  assert.match(screen, /isLiveQueueSnapshot\(snapshot\)/);
  assert.doesNotMatch(screen, /const \[page, setPage\]/);
  assert.doesNotMatch(screen, /isLiveSnapshot = page === 1/);
  assert.doesNotMatch(screen, /changePage\(page [+-] 1\)/);
});

test("automatic polling in the queue screen uses the live offset-0 target only", () => {
  const screen = readFileSync(screenPath, "utf8");

  assert.match(screen, /shouldAutoPollQueuePage\(targetRef\.current\.page\)/);
  assert.match(screen, /queuePollTarget\(targetRef\.current\)/);
  assert.doesNotMatch(screen, /refreshRef\.current\(targetRef\.current, "poll"\)/);
});

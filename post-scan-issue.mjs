#!/usr/bin/env node
/**
 * post-scan-issue.mjs — Post a GitHub Issue with scan results.
 *
 * Usage: node post-scan-issue.mjs <github-token> < scan-output.txt
 *
 * Reads scan.mjs stdout from stdin, extracts new offers, and posts
 * a GitHub Issue to dignoryluna/career-ops-dig if any were found.
 * Exits 0 in all cases (no matches = no issue, not an error).
 */

import { createInterface } from 'readline';

const token = process.argv[2];
const repo = 'dignoryluna/career-ops-dig';

if (!token) {
  console.error('Usage: node post-scan-issue.mjs <github-token>');
  process.exit(1);
}

const lines = [];
const rl = createInterface({ input: process.stdin });
for await (const line of rl) lines.push(line);

const matches = lines
  .filter(l => l.startsWith('  + '))
  .map(l => '- ' + l.slice(4).trim());

if (matches.length === 0) {
  console.log('No new matches — skipping issue.');
  process.exit(0);
}

const date = new Date().toISOString().slice(0, 10);
const title = `Job Scan — ${date} — ${matches.length} new match${matches.length === 1 ? '' : 'es'}`;
const body = `## Job Scan Results — ${date}\n\n${matches.length} new match${matches.length === 1 ? '' : 'es'} found:\n\n${matches.join('\n')}\n\nRun \`/career-ops pipeline\` to evaluate these offers.`;

const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
  method: 'POST',
  headers: {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ title, body }),
});

const json = await res.json();
if (res.ok) {
  console.log(`Issue posted: ${json.html_url}`);
} else {
  console.error('Failed to post issue:', json.message);
  process.exit(1);
}

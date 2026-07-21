const assert = require('node:assert/strict');
const { formatDuration, scoreRun, lakeTotals, buildShareText } = require('../race.js');

assert.equal(formatDuration(0), '0:00');
assert.equal(formatDuration(125), '2:05');
assert.deepEqual(scoreRun({ durationSeconds: 60, parSeconds: 90 }), { score: 5, timePenalty: 0, deductions: 0 });
assert.equal(scoreRun({ durationSeconds: 100, parSeconds: 90, hintsUsed: 1, mistakes: 1 }).score, 2);
assert.equal(scoreRun({ hintsUsed: 20 }).score, 1, 'a completed puzzle always earns one feather');

const totals = lakeTotals([
  { durationSeconds: 60, hintsUsed: 1, mistakes: 0, score: 4 },
  { durationSeconds: 90, hintsUsed: 0, mistakes: 2, score: 3 }
], 'Lake Itasca');
assert.deepEqual(totals, { lakeName: 'Lake Itasca', durationSeconds: 150, hintsUsed: 1, mistakes: 2, feathers: 7, puzzles: 2 });
assert.match(buildShareText(totals, 'https://example.com'), /2:30/);
assert.match(buildShareText(totals, 'https://example.com'), /Think you can beat my flock/);

console.log('Verified race scoring, lake totals, and share text.');

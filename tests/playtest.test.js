const assert = require('node:assert/strict');
const { summarize, eventsCsv } = require('../playtest.js');

const sample = {
  events: [
    { sessionId: 'a', type: 'tutorial_started' },
    { sessionId: 'a', type: 'tutorial_completed' },
    { sessionId: 'a', type: 'puzzle_started', puzzleId: '1-1' },
    { sessionId: 'a', type: 'hint_used', puzzleId: '1-1' },
    { sessionId: 'a', type: 'puzzle_completed', puzzleId: '1-1', durationSeconds: 60 },
    { sessionId: 'b', type: 'tutorial_started' },
    { sessionId: 'b', type: 'puzzle_started', puzzleId: '1-1' },
    { sessionId: 'b', type: 'puzzle_abandoned', puzzleId: '1-1' },
    { sessionId: 'b', type: 'puzzle_reset', puzzleId: '1-1' }
  ],
  feedback: [{ fun: 5 }, { fun: 3 }],
  issues: [{}],
  prompts: []
};

const report = summarize(sample);
assert.equal(report.sessions, 2);
assert.equal(report.tutorialRate, 50);
assert.equal(report.firstPuzzleRate, 50);
assert.equal(report.completions, 1);
assert.equal(report.averageSolveSeconds, 60);
assert.equal(report.hints, 1);
assert.equal(report.resets, 1);
assert.equal(report.topQuitPuzzle, '1-1');
assert.equal(report.averageFun, 4);
assert.match(eventsCsv(sample), /puzzle_completed/);

console.log('Verified playtest analytics summaries and CSV export.');

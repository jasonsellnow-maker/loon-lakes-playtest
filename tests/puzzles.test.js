const assert = require('node:assert/strict');
const { LAKES, LEVELS, findConflicts, isSolved } = require('../puzzles.js');

function countSolutions(level, limit = 2) {
  const usedColumns = Array(level.size).fill(false);
  const usedRegions = Array(level.size).fill(false);
  const columns = Array(level.size).fill(-1);
  let count = 0;
  function search(row) {
    if (count >= limit) return;
    if (row === level.size) { count++; return; }
    for (let col = 0; col < level.size; col++) {
      const region = level.regions[row][col];
      if (usedColumns[col] || usedRegions[region]) continue;
      if (row && Math.abs(columns[row - 1] - col) <= 1) continue;
      usedColumns[col] = usedRegions[region] = true;
      columns[row] = col;
      search(row + 1);
      usedColumns[col] = usedRegions[region] = false;
    }
  }
  search(0);
  return count;
}

for (const level of LEVELS) {
  assert.equal(level.regions.length, level.size, `${level.name}: correct row count`);
  assert.ok(level.regions.every(row => row.length === level.size), `${level.name}: square region map`);
  assert.equal(new Set(level.regions.flat()).size, level.size, `${level.name}: one region per loon`);
  assert.equal(countSolutions(level), 1, `${level.name}: exactly one solution`);
  const solved = Array(level.size ** 2).fill(0);
  level.solution.forEach((col, row) => { solved[row * level.size + col] = 2; });
  assert.equal(findConflicts(solved, level).size, 0, `${level.name}: stored solution has no conflicts`);
  assert.equal(isSolved(solved, level), true, `${level.name}: stored solution completes puzzle`);
  assert.ok(level.starterMarks.every(index => solved[index] !== 2), `${level.id}: starter ripples never cover the solution`);
}

assert.equal(LAKES.length, 7, 'seven lake journeys');
assert.equal(LEVELS.length, 35, 'five puzzles per lake');
for (const lake of LAKES) {
  assert.equal(lake.puzzles.length, 5, `${lake.name}: five difficulty tiers`);
  const layouts = new Set(lake.puzzles.map(level => JSON.stringify(level.regions)));
  assert.equal(layouts.size, 5, `${lake.name}: five distinct board orientations`);
}
assert.equal(LAKES.at(-1).puzzles[0].size, 8, 'weekly lake introduces an 8 by 8 challenge');

console.log(`Verified ${LEVELS.length} unique Loon Lakes puzzles.`);

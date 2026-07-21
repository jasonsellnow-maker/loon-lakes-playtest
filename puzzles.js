(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LoonPuzzle = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const BASE_LAKES = [
    { id: 1, name: 'Lake Itasca', fact: "The Mississippi begins here as a shallow stream, and visitors can walk across its headwaters from rock to rock.", sourceName: 'Minnesota DNR', sourceUrl: 'https://www.dnr.state.mn.us/state_parks/virtual_tour/itasca/dialup.html', shape: 'M9 35C16 15 35 8 53 17s20 3 31-4 24 8 25 23-14 25-30 19-27 14-40 3C13 64 3 52 9 35Z', size: 5, regions: [[0,1,1,1,1],[0,1,1,1,1],[2,2,1,1,1],[2,2,3,3,3],[2,4,4,3,3]], solution: [0,3,1,4,2] },
    { id: 2, name: 'Lake Minnetonka', fact: "Prince made Lake Minnetonka pop-culture famous in Purple Rain, but the famous water scene was actually filmed in the Minnesota River.", sourceName: 'Explore Minnesota', sourceUrl: 'https://www.exploreminnesota.com/minnesota-icons/prince-themed-tour-minnesota', shape: 'M8 41c9-6 12-22 25-22 8 0 10 8 18 5 9-4 9-14 23-12 12 2 8 14 18 17 12 3 23 8 18 20-6 11-25 5-38 10-17 7-27 20-44 9C10 67-4 55 8 41Z', size: 5, regions: [[1,1,0,0,0],[1,1,0,0,2],[1,1,2,2,2],[4,4,3,4,2],[4,4,4,4,4]], solution: [3,1,4,2,0] },
    { id: 3, name: 'Mille Lacs', fact: "A premier walleye lake with phenomenal catch rates, Mille Lacs also produces trophy smallmouth bass, muskies, and northern pike.", sourceName: 'Minnesota DNR', sourceUrl: 'https://www.dnr.state.mn.us/millelacslake/index.html', shape: 'M11 43C9 24 27 9 52 8c27-1 49 13 50 34 2 23-20 36-49 35C25 77 13 63 11 43Z', size: 6, regions: [[0,2,1,1,1,1],[0,2,1,1,1,1],[2,2,3,1,1,1],[2,3,3,3,3,3],[4,4,4,4,5,3],[4,4,4,5,5,3]], solution: [0,3,1,5,2,4] },
    { id: 4, name: 'Leech Lake', fact: "Leech Lake hosts the wonderfully weird International Eelpout Festival, complete with an ice bar, eelpout curling, and a giant fishing trophy.", sourceName: 'Minnesota DNR', sourceUrl: 'https://files.dnr.state.mn.us/education_safety/education/minnaqua/leadersguide/appendix_1/7_6_fish_facts.pdf', shape: 'M6 40c12-6 19-23 33-19 10 3 7 14 17 15 8 1 11-11 21-8 8 3 5 13 17 13 17-1 25 13 17 23-8 11-27 1-42 5-20 5-24 20-41 9C15 73-9 60 6 40Z', size: 6, regions: [[1,1,0,3,3,3],[1,1,1,3,3,3],[1,1,1,3,2,2],[1,4,4,3,5,5],[4,4,4,5,5,5],[4,4,4,5,5,5]], solution: [2,0,5,3,1,4] },
    { id: 5, name: 'Lake Vermilion', fact: "Vermilion stretches 37 miles end to end and boasts 365 islands, one for every day of the year, plus 341 miles of shoreline.", sourceName: 'Minnesota DNR', sourceUrl: 'https://www.dnr.state.mn.us/vermilionlake/index.html', shape: 'M7 42c11-11 25-8 36-16 13-10 21-23 34-18 11 5 1 17 11 24 9 7 28 7 25 20-4 14-27 8-43 13-20 7-29 20-45 10C10 76-16 59 7 42Z', size: 6, regions: [[1,1,1,0,1,2],[1,1,1,1,1,2],[1,3,3,3,1,2],[3,3,3,3,2,2],[4,3,3,3,3,5],[3,3,3,3,5,5]], solution: [3,1,5,2,0,4] },
    { id: 6, name: 'Lake Superior', fact: "The world's largest freshwater lake by surface area has a wild side: Duluth surfers ride its biggest waves during icy fall and winter storms.", sourceName: 'Minnesota DNR', sourceUrl: 'https://www.dnr.state.mn.us/mcvmagazine/issues/2026/may-jun/qa.html', shape: 'M4 51C25 43 39 21 63 17c21-4 41 6 61 2-12 10-21 21-31 31-18 18-39 27-65 23C19 72 9 64 4 51Z', size: 7, regions: [[3,2,2,2,0,0,0],[3,3,2,0,0,1,1],[3,3,2,4,4,4,4],[3,3,3,4,4,4,4],[3,3,4,4,4,4,4],[3,3,4,4,4,5,4],[3,6,4,4,4,4,4]], solution: [4,6,2,0,3,5,1] },
    { id: 7, name: 'Lake of the Woods', fact: "Nearly one third of this 951,337-acre northwoods lake lies in Minnesota, making it the state's largest lake and a year-round home for walleye, pike, sturgeon, sauger, and more.", sourceName: 'Minnesota DNR', sourceUrl: 'https://www.dnr.state.mn.us/lakeofthewoods/index.html', releaseDate: '2026-07-21', weekly: true, shape: 'M5 45C12 23 29 11 47 15c13 3 17-9 31-7 15 2 14 13 27 15 13 2 30-2 38 12 8 14-8 25-24 27-19 3-32 14-52 13C22 80-5 67 5 45Z', size: 8, regions: [[0,0,0,0,0,1,1,1],[0,0,2,2,2,1,1,1],[7,0,2,2,2,2,1,1],[7,7,3,4,2,4,1,1],[7,7,7,4,4,4,4,1],[5,7,7,4,4,4,4,4],[7,7,7,7,4,4,4,6],[7,7,7,4,4,4,4,4]], solution: [3,6,4,2,5,0,7,1] }
  ];

  const TIERS = [
    { name: 'Easy', starterCount: 4, maxHints: 3, note: 'Training ripples included' },
    { name: 'Breezy', starterCount: 2, maxHints: 3, note: 'A little help from shore' },
    { name: 'Tricky', starterCount: 1, maxHints: 2, note: 'Watch those diagonals' },
    { name: 'Oh Fer Tough', starterCount: 0, maxHints: 1, note: 'No training ripples' },
    { name: 'North Star', starterCount: 0, maxHints: 0, note: 'The biggest race on the water' }
  ];

  function transformGrid(grid, transform) {
    const size = grid.length;
    return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => {
      if (transform === 1) return grid[size - 1 - col][row];
      if (transform === 2) return grid[size - 1 - row][size - 1 - col];
      if (transform === 3) return grid[col][row];
      if (transform === 4) return grid[row][size - 1 - col];
      return grid[row][col];
    }));
  }

  function transformSolution(solution, transform) {
    const size = solution.length;
    const result = Array(size).fill(-1);
    solution.forEach((col, row) => {
      if (transform === 1) result[col] = size - 1 - row;
      else if (transform === 2) result[size - 1 - row] = size - 1 - col;
      else if (transform === 3) result[col] = row;
      else if (transform === 4) result[row] = size - 1 - col;
      else result[row] = col;
    });
    return result;
  }

  function starterMarks(solution, count) {
    const size = solution.length;
    return Array.from({ length: count }, (_, index) => {
      const row = size - 1 - index;
      return row * size + ((solution[row] + 1) % size);
    });
  }

  const LAKES = BASE_LAKES.map(base => {
    const lake = { id: base.id, name: base.name, fact: base.fact, sourceName: base.sourceName, sourceUrl: base.sourceUrl, shape: base.shape, releaseDate: base.releaseDate || '', weekly: base.weekly === true };
    lake.puzzles = TIERS.map((tier, index) => {
      const solution = transformSolution(base.solution, index);
      return {
        id: `${base.id}-${index + 1}`,
        lakeId: base.id,
        puzzleNumber: index + 1,
        name: base.name,
        difficulty: tier.name,
        difficultyNote: tier.note,
        size: base.size,
        fact: base.fact,
        sourceName: base.sourceName,
        sourceUrl: base.sourceUrl,
        shape: base.shape,
        regions: transformGrid(base.regions, index),
        solution,
        starterMarks: starterMarks(solution, Math.min(tier.starterCount, base.size - 1)),
        maxHints: tier.maxHints,
        parSeconds: base.size * 35 + index * 35
      };
    });
    return lake;
  });

  const LEVELS = LAKES.flatMap(lake => lake.puzzles);

  function findConflicts(board, level) {
    const conflict = new Set();
    const loons = [];
    board.forEach((value, index) => { if (value === 2) loons.push(index); });
    for (let i = 0; i < loons.length; i++) {
      const a = loons[i], ar = Math.floor(a / level.size), ac = a % level.size;
      for (let j = i + 1; j < loons.length; j++) {
        const b = loons[j], br = Math.floor(b / level.size), bc = b % level.size;
        const sameRegion = level.regions[ar][ac] === level.regions[br][bc];
        const touching = Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1;
        if (ar === br || ac === bc || sameRegion || touching) { conflict.add(a); conflict.add(b); }
      }
    }
    return conflict;
  }

  function isSolved(board, level) {
    const loons = board.reduce((sum, value) => sum + (value === 2 ? 1 : 0), 0);
    return loons === level.size && findConflicts(board, level).size === 0;
  }

  return { LAKES, LEVELS, TIERS, findConflicts, isSolved };
});

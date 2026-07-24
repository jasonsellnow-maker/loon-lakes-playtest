(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LoonPuzzle = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const BASE_LAKES = [
    { id: 1, name: 'Lake Itasca', fact: "The Mississippi begins here as a shallow stream, and visitors can walk across its headwaters from rock to rock.", sourceName: 'Minnesota DNR', sourceUrl: 'https://www.dnr.state.mn.us/state_parks/virtual_tour/itasca/dialup.html', shape: 'M65.2 7.3L70.1 17.7L68.1 29.4L63.2 32.6L63.2 39.8L65.9 40.0L71.1 34.2L76.3 42.1L87.9 45.2L90.8 65.7L95.8 75.7L95.8 80.0L92.9 79.3L91.4 72.1L86.2 70.4L88.0 60.0L85.8 58.3L88.0 54.2L82.9 53.3L79.9 48.3L64.2 44.1L54.2 43.9L53.3 47.9L51.3 48.2L51.9 52.8L46.9 57.0L46.7 64.8L36.2 72.6L32.2 70.4L37.9 65.2L38.1 61.9L44.9 53.4L56.6 26.1L61.5 23.4L61.2 13.3L58.0 4.0Z', size: 5, regions: [[0,1,1,1,1],[0,1,1,1,1],[2,2,1,1,1],[2,2,3,3,3],[2,4,4,3,3]], solution: [0,3,1,4,2] },
    { id: 2, name: 'Lake Minnetonka', fact: "Prince made Lake Minnetonka pop-culture famous in Purple Rain, but the famous water scene was actually filmed in the Minnesota River.", sourceName: 'Explore Minnesota', sourceUrl: 'https://www.exploreminnesota.com/minnesota-icons/prince-themed-tour-minnesota', shape: 'M54.7 14.6L60.8 15.2L65.1 19.5L60.3 17.9L60.8 21.2L69.8 25.1L71.3 30.3L79.1 21.3L84.7 26.5L83.9 15.1L87.8 13.2L96.4 16.4L99.1 21.5L105.0 11.2L107.9 11.3L116.8 15.3L116.8 25.9L117.3 20.8L124.0 21.4L119.2 27.9L109.6 23.3L107.6 26.3L108.3 19.6L103.5 20.4L105.3 30.4L99.7 30.8L98.9 35.0L101.9 48.5L95.0 46.3L99.7 41.5L89.6 45.1L82.3 56.5L83.5 60.4L85.1 56.4L90.4 56.9L87.8 62.3L81.0 61.9L77.4 57.8L72.5 62.6L66.1 60.3L64.4 53.8L75.6 53.7L71.1 51.0L71.1 45.4L66.7 46.9L69.1 44.0L64.8 42.7L67.1 49.0L61.8 48.8L59.6 57.4L47.3 59.6L44.9 56.1L39.1 69.1L39.5 77.1L24.2 67.3L18.6 58.9L24.8 49.3L17.6 52.2L13.0 48.9L17.5 53.8L15.7 61.9L8.0 58.4L11.5 55.4L7.5 53.2L10.4 51.8L4.0 51.7L12.0 46.6L15.9 46.3L15.2 49.8L21.9 47.1L25.0 41.2L32.8 42.2L35.7 33.2L30.6 34.6L25.7 29.0L39.7 33.1L36.6 25.9L27.3 26.5L29.6 20.4L26.4 15.8L37.5 24.5L47.4 26.6L46.4 32.8L49.2 29.9L52.3 31.5L52.4 26.2L48.6 24.8L41.8 7.3L55.0 22.8L54.6 14.8L48.8 9.4L52.2 6.9Z', size: 5, regions: [[1,1,0,0,0],[1,1,0,0,2],[1,1,2,2,2],[4,4,3,4,2],[4,4,4,4,4]], solution: [3,1,4,2,0] },
    { id: 3, name: 'Mille Lacs', fact: "A premier walleye lake with phenomenal catch rates, Mille Lacs also produces trophy smallmouth bass, muskies, and northern pike.", sourceName: 'Minnesota DNR', sourceUrl: 'https://www.dnr.state.mn.us/millelacslake/index.html', shape: 'M70.5 4.0L81.1 6.1L87.3 11.4L88.5 15.7L86.0 24.0L85.9 36.2L87.1 35.4L88.2 45.7L86.7 48.9L92.7 49.6L92.7 53.4L95.7 56.0L94.6 60.4L97.6 60.1L100.8 70.6L96.1 71.6L96.3 68.6L92.1 67.9L88.7 70.1L90.6 71.8L87.1 73.6L89.1 75.4L86.9 78.0L82.8 77.0L81.8 71.2L75.5 72.5L67.6 75.7L71.7 76.8L69.1 80.0L61.5 78.7L50.6 70.1L41.7 66.4L40.7 60.4L46.7 58.7L40.6 56.4L39.2 52.3L40.5 49.5L37.1 51.6L34.0 50.2L35.7 46.0L31.9 41.6L32.5 38.9L30.3 39.8L27.6 36.5L28.7 28.4L27.2 26.6L34.8 16.1L53.1 7.6Z', size: 6, regions: [[0,2,1,1,1,1],[0,2,1,1,1,1],[2,2,3,1,1,1],[2,3,3,3,3,3],[4,4,4,4,5,3],[4,4,4,5,5,3]], solution: [0,3,1,5,2,4] },
    { id: 4, name: 'Leech Lake', fact: "Leech Lake hosts the wonderfully weird International Eelpout Festival, complete with an ice bar, eelpout curling, and a giant fishing trophy.", sourceName: 'Minnesota DNR', sourceUrl: 'https://files.dnr.state.mn.us/education_safety/education/minnaqua/leadersguide/appendix_1/7_6_fish_facts.pdf', shape: 'M96.0 4.0L97.5 7.0L94.5 9.3L101.6 12.3L101.8 19.5L99.5 19.5L94.3 28.2L88.9 31.6L86.6 42.9L88.7 45.9L96.7 39.5L107.7 37.4L105.6 44.5L100.5 44.6L100.8 47.8L96.7 52.3L101.3 59.4L100.4 63.8L94.0 63.3L93.6 61.4L90.3 73.8L82.3 71.9L80.8 76.4L77.4 76.8L71.3 73.9L70.0 71.6L73.1 72.8L72.7 71.0L61.2 70.7L62.3 67.5L59.7 66.9L58.9 62.2L62.0 52.1L49.9 55.7L46.4 49.8L51.6 46.1L44.6 44.9L38.2 52.8L43.7 61.7L42.7 64.8L47.7 61.9L43.6 61.1L45.6 55.6L52.0 59.9L51.1 63.6L48.3 62.2L44.4 65.8L44.5 71.4L41.2 72.9L39.7 62.0L32.2 58.3L29.5 51.7L31.2 47.6L34.7 46.5L27.4 46.7L30.8 45.5L28.5 38.6L33.2 35.2L34.7 28.9L41.0 28.6L38.1 42.9L43.8 43.2L51.1 31.7L57.5 29.8L65.8 20.3L67.5 12.6L72.5 20.6L70.6 26.0L66.6 29.0L65.3 35.7L61.8 35.4L63.7 40.4L67.4 32.0L76.2 29.2L87.8 16.2L94.4 13.0L93.0 8.6ZM21.1 49.6L29.8 53.3L25.7 54.3L20.3 51.2ZM40.3 72.4L42.3 75.3L37.9 80.0Z', size: 6, regions: [[1,1,0,3,3,3],[1,1,1,3,3,3],[1,1,1,3,2,2],[1,4,4,3,5,5],[4,4,4,5,5,5],[4,4,4,5,5,5]], solution: [2,0,5,3,1,4] },
    { id: 5, name: 'Lake Vermilion', fact: "Vermilion stretches 37 miles end to end and boasts 365 islands, one for every day of the year, plus 341 miles of shoreline.", sourceName: 'Minnesota DNR', sourceUrl: 'https://www.dnr.state.mn.us/vermilionlake/index.html', shape: 'M19.8 17.3L17.5 21.2L31.5 18.2L33.1 14.7L40.1 16.7L21.9 26.2L24.6 30.0L29.4 29.7L31.9 34.8L32.6 32.0L39.6 33.2L42.6 24.8L45.0 27.3L51.1 24.2L50.5 14.1L59.6 20.8L52.3 24.6L54.9 26.7L52.3 32.2L64.3 33.4L58.0 38.4L68.7 35.1L69.3 32.1L72.9 31.6L73.1 34.2L74.2 30.9L86.1 29.0L91.4 32.8L84.9 37.1L111.8 37.0L106.5 37.8L108.4 42.1L103.4 43.5L122.1 44.0L116.7 48.5L124.0 52.2L109.4 55.3L107.2 60.8L98.6 57.5L98.5 60.1L93.2 60.5L91.5 63.3L96.4 68.8L93.9 67.2L92.6 70.8L89.5 67.5L75.6 71.7L94.6 58.5L91.3 56.7L90.4 60.1L83.6 59.0L83.3 61.7L79.5 60.2L83.2 58.9L79.8 56.1L69.4 52.5L81.2 46.8L71.5 51.0L62.7 48.6L75.8 45.9L73.6 38.7L67.1 41.0L70.6 44.7L66.5 45.4L64.7 39.3L64.3 42.6L57.2 42.7L58.9 46.9L54.1 47.7L44.1 42.6L50.6 38.3L49.0 34.1L52.1 32.5L49.0 29.2L44.6 34.7L34.2 37.6L27.5 36.0L27.9 32.4L19.9 34.3L4.0 24.1L7.5 22.4L6.3 19.6L9.4 20.8L6.3 18.8L9.3 16.3L16.0 17.4L13.7 20.1L15.9 21.0ZM21.6 15.6L25.0 12.3L28.4 15.8Z', size: 6, regions: [[1,1,1,0,1,2],[1,1,1,1,1,2],[1,3,3,3,1,2],[3,3,3,3,2,2],[4,3,3,3,3,5],[3,3,3,3,5,5]], solution: [3,1,5,2,0,4] },
    { id: 6, name: 'Lake Superior', fact: "The world's largest freshwater lake by surface area has a wild side: Duluth surfers ride its biggest waves during icy fall and winter storms.", sourceName: 'Minnesota DNR', sourceUrl: 'https://www.dnr.state.mn.us/mcvmagazine/issues/2026/may-jun/qa.html', shape: 'M4.0 67.4L22.7 46.8L41.8 37.1L46.4 26.2L52.2 23.7L49.9 29.9L52.7 28.7L56.1 17.3L58.9 19.1L55.5 27.2L58.5 21.6L60.7 22.7L59.0 13.3L62.4 12.9L74.4 17.9L86.8 16.7L97.9 34.3L114.5 33.9L110.3 41.2L117.9 47.1L115.6 54.6L121.9 54.7L119.6 64.1L124.0 64.9L120.9 67.8L113.1 66.3L113.3 59.7L95.1 63.7L88.1 70.3L76.7 69.1L69.5 60.9L61.5 63.0L63.8 59.3L58.6 64.4L56.4 56.0L59.6 54.4L59.7 59.4L69.0 47.9L59.7 50.0L56.4 55.8L55.9 53.9L46.3 64.7L45.6 62.4L38.6 64.0L30.6 71.1L23.8 67.2L20.7 69.8L21.9 61.3L12.6 67.3Z', size: 7, regions: [[3,2,2,2,0,0,0],[3,3,2,0,0,1,1],[3,3,2,4,4,4,4],[3,3,3,4,4,4,4],[3,3,4,4,4,4,4],[3,3,4,4,4,5,4],[3,6,4,4,4,4,4]], solution: [4,6,2,0,3,5,1] },
    { id: 7, name: 'Lake of the Woods', fact: "Nearly one third of this 951,337-acre northwoods lake lies in Minnesota, making it the state's largest lake and a year-round home for walleye, pike, sturgeon, sauger, and more.", sourceName: 'Minnesota DNR', sourceUrl: 'https://www.dnr.state.mn.us/lakeofthewoods/index.html', releaseDate: '2026-07-21', weekly: true, shape: 'M49.6 36.4L51.2 36.7L51.6 36.3L54.4 36.2L58.4 38.4L58.5 38.9L58.8 38.7L61.8 40.3L58.8 38.6L61.7 36.7L58.1 37.3L58.4 38.4L54.4 36.2L51.6 36.3L53.6 34.2L56.9 34.4L55.3 32.5L57.2 31.2L54.7 30.5L58.8 28.1L60.3 29.8L60.2 25.8L62.1 25.2L58.3 24.2L63.2 23.9L62.1 26.0L71.5 20.6L68.6 19.7L73.1 17.9L71.2 16.7L73.7 14.1L69.7 14.7L77.7 11.8L78.6 9.4L75.3 5.9L79.9 4.0L82.2 9.5L86.8 7.4L85.9 10.8L86.6 9.5L88.9 13.1L90.2 12.0L88.5 14.6L85.6 11.6L83.1 14.4L88.4 14.8L88.4 14.9L89.7 16.4L83.7 15.7L93.9 18.9L86.8 18.0L85.8 20.0L84.7 17.3L82.8 18.5L89.3 22.1L87.9 25.1L94.2 24.3L92.4 25.6L94.4 26.2L91.4 28.1L86.0 27.6L86.1 31.4L84.4 30.4L86.0 27.7L76.3 28.6L74.0 32.7L75.4 28.9L73.2 30.8L71.8 28.2L68.1 32.4L68.1 37.3L69.4 34.6L69.9 37.2L75.7 37.0L74.9 40.3L71.8 39.3L70.9 41.1L74.6 41.4L73.5 42.6L78.3 45.5L77.0 46.9L80.4 46.3L80.7 48.2L83.5 44.3L84.8 45.7L88.9 43.9L89.4 49.0L92.0 46.4L90.9 50.1L93.1 51.6L93.9 49.0L94.4 53.3L91.8 57.0L88.8 55.9L87.2 59.5L85.0 59.6L86.8 60.9L85.7 63.9L82.2 67.5L80.5 66.9L79.8 69.8L73.6 70.7L67.9 80.0L59.1 77.3L52.3 68.0L47.6 69.5L44.0 74.7L38.0 75.6L33.6 70.9L33.9 66.0L43.0 66.3L43.4 51.8L45.2 50.9L43.6 54.0L45.0 54.5L53.0 50.7L56.2 42.9L53.6 37.6L50.3 38.2L47.1 36.6ZM43.4 51.8L43.0 66.3L36.0 66.1L38.8 66.1L39.8 63.7L36.6 61.1L36.7 54.6Z', size: 8, regions: [[0,0,0,0,0,1,1,1],[0,0,2,2,2,1,1,1],[7,0,2,2,2,2,1,1],[7,7,3,4,2,4,1,1],[7,7,7,4,4,4,4,1],[5,7,7,4,4,4,4,4],[7,7,7,7,4,4,4,6],[7,7,7,4,4,4,4,4]], solution: [3,6,4,2,5,0,7,1] }
  ];

  const TIERS = [
    { name: 'Easy', size: 5, starterCount: 0, maxHints: 3, note: 'A 5 × 5 warm-up' },
    { name: 'Breezy', size: 6, starterCount: 0, maxHints: 3, note: 'A 6 × 6 crossing' },
    { name: 'Tricky', size: 8, starterCount: 0, maxHints: 2, note: 'An 8 × 8 course—watch those diagonals' },
    { name: 'Oh Fer Tough', size: 10, starterCount: 0, maxHints: 1, note: 'A 10 × 10 lake with no training ripples' },
    { name: 'North Star', size: 12, starterCount: 0, maxHints: 0, note: 'A 12 × 12 North Star endurance race' }
  ];

  const LEVEL_FACTS = {
    1: [
      'Lake Itasca is the headwaters of the Mississippi River, where visitors can cross the young river on stepping stones.',
      'Itasca State Park was established in 1891 to protect the old-growth pines around the lake and the Mississippi headwaters.',
      'The lake sits within Itasca State Park, Minnesota’s oldest state park.',
      'Itasca’s name comes from “veritas caput,” a Latin phrase meaning “true head” of the Mississippi.',
      'The Mississippi leaves Lake Itasca as a narrow stream before beginning its 2,300-mile trip to the Gulf of Mexico.'
    ],
    2: [
      'Lake Minnetonka is a sprawling chain of bays and channels west of Minneapolis, not one simple round lake.',
      'Its Dakota name, Mde Wakáŋ, is commonly translated as “spirit water.”',
      'Prince made Lake Minnetonka famous in Purple Rain, though the movie’s water scene was filmed on the Minnesota River.',
      'The lake has more than 100 miles of shoreline, so a short outing can feel like a real expedition.',
      'Excelsior, Wayzata, and other lakeside towns make Minnetonka a classic Minnesota boating destination.'
    ],
    3: [
      'Mille Lacs is a premier walleye lake that also produces trophy smallmouth bass, muskies, and northern pike.',
      '“Mille Lacs” is French for “a thousand lakes,” a name that stuck long before Minnesota became the Land of 10,000 Lakes.',
      'At more than 130,000 acres, Mille Lacs is Minnesota’s second-largest inland lake.',
      'The lake’s big, open water can build waves quickly—one reason anglers treat weather checks as part of the trip.',
      'Mille Lacs has long been central to Ojibwe culture, recreation, and the state’s fishing story.'
    ],
    4: [
      'Leech Lake hosts the wonderfully weird International Eelpout Festival, with an ice bar, eelpout curling, and a giant fishing trophy.',
      'Leech Lake is Minnesota’s third-largest lake entirely within the state.',
      'Deep, clear Walker Bay reaches far below the lake’s broad, wind-swept main basin.',
      'Much of the shoreline lies within Chippewa National Forest, giving Leech Lake a distinctly northwoods feel.',
      'The lake is part of the homeland of the Leech Lake Band of Ojibwe.'
    ],
    5: [
      'Lake Vermilion stretches 37 miles end to end and boasts 365 islands—one for every day of the year.',
      'Vermilion has roughly 341 miles of shoreline, enough coast for countless quiet coves.',
      'The lake is a popular gateway to Minnesota’s Iron Range and the Boundary Waters region.',
      '“Vermilion” refers to a vivid red color, a fitting name in a landscape shaped by iron-rich country.',
      'Lake Vermilion’s island maze makes navigation part of the adventure, even before the fishing starts.'
    ],
    6: [
      'Lake Superior is the world’s largest freshwater lake by surface area.',
      'Duluth surfers chase Lake Superior’s biggest waves during icy fall and winter storms.',
      'Superior holds about 10 percent of the planet’s surface fresh water.',
      'The lake’s deepest point is more than 1,300 feet below the surface.',
      'Storms on Superior have inspired countless shipwreck stories, including the Edmund Fitzgerald.'
    ],
    7: [
      'Nearly one third of Lake of the Woods’ 951,337 acres lies in Minnesota, making it the state’s largest lake.',
      'Lake of the Woods has more than 14,000 islands scattered across the U.S.–Canada border.',
      'The lake is famous for walleye, sauger, northern pike, sturgeon, and year-round fishing adventures.',
      'The Rainy River feeds Lake of the Woods and is a well-known spring run for walleye and sturgeon.',
      'The Northwest Angle on Lake of the Woods is the northernmost point of the contiguous United States.'
    ]
  };

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function courseSolution(size, variant) {
    const odds = Array.from({ length: size }, (_, index) => index).filter(index => index % 2);
    const evens = Array.from({ length: size }, (_, index) => index).filter(index => !(index % 2));
    const course = [...odds, ...evens];
    return variant % 2 ? [...course].reverse() : course;
  }

  function countSolutions(regions, limit = 2) {
    const size = regions.length;
    const usedColumns = Array(size).fill(false);
    const usedRegions = Array(size).fill(false);
    const columns = Array(size).fill(-1);
    let count = 0;
    function search(row) {
      if (count >= limit) return;
      if (row === size) { count++; return; }
      for (let column = 0; column < size; column++) {
        const region = regions[row][column];
        if (usedColumns[column] || usedRegions[region] || (row && Math.abs(columns[row - 1] - column) <= 1)) continue;
        usedColumns[column] = usedRegions[region] = true;
        columns[row] = column;
        search(row + 1);
        usedColumns[column] = usedRegions[region] = false;
      }
    }
    search(0);
    return count;
  }

  const ORTHOGONAL_STEPS = [[-1,0],[1,0],[0,-1],[0,1]];

  function orthogonalNeighbors(grid, row, column) {
    const size = grid.length;
    return ORTHOGONAL_STEPS.map(([rowDelta, columnDelta]) => [row + rowDelta, column + columnDelta])
      .filter(([nextRow, nextColumn]) => nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size);
  }

  function validateContiguousRegions(grid) {
    if (!Array.isArray(grid) || !grid.length || grid.some(row => !Array.isArray(row) || row.length !== grid.length)) return false;
    const visited = new Set();
    const completedColors = new Set();
    for (let row = 0; row < grid.length; row++) for (let column = 0; column < grid.length; column++) {
      const start = row * grid.length + column;
      if (visited.has(start)) continue;
      const color = grid[row][column];
      if (completedColors.has(color)) return false;
      completedColors.add(color);
      const queue = [[row, column]];
      visited.add(start);
      for (let pointer = 0; pointer < queue.length; pointer++) {
        const [currentRow, currentColumn] = queue[pointer];
        orthogonalNeighbors(grid, currentRow, currentColumn).forEach(([nextRow, nextColumn]) => {
          const index = nextRow * grid.length + nextColumn;
          if (!visited.has(index) && grid[nextRow][nextColumn] === color) {
            visited.add(index);
            queue.push([nextRow, nextColumn]);
          }
        });
      }
    }
    return visited.size === grid.length ** 2;
  }

  function weightedPick(options, random) {
    const total = options.reduce((sum, option) => sum + option.weight, 0);
    let threshold = random() * total;
    for (const option of options) {
      threshold -= option.weight;
      if (threshold <= 0) return option;
    }
    return options.at(-1);
  }

  function growRegion(regions, region, background, solutionCells, random, targetCells) {
    let cells = 1;
    while (cells < targetCells) {
      const frontier = [];
      for (let row = 0; row < regions.length; row++) for (let column = 0; column < regions.length; column++) {
        if (regions[row][column] !== region) continue;
        orthogonalNeighbors(regions, row, column).forEach(([nextRow, nextColumn]) => {
          const index = nextRow * regions.length + nextColumn;
          if (regions[nextRow][nextColumn] !== background || solutionCells.has(index)) return;
          const sameColorNeighbors = orthogonalNeighbors(regions, nextRow, nextColumn)
            .filter(([neighborRow, neighborColumn]) => regions[neighborRow][neighborColumn] === region).length;
          frontier.push({ row: nextRow, column: nextColumn, weight: 1 + sameColorNeighbors * 2 + random() * .8 });
        });
      }
      let placed = false;
      while (frontier.length && !placed) {
        const choice = weightedPick(frontier, random);
        frontier.splice(frontier.indexOf(choice), 1);
        regions[choice.row][choice.column] = region;
        if (validateContiguousRegions(regions) && countSolutions(regions) === 1) {
          cells++;
          placed = true;
        } else {
          regions[choice.row][choice.column] = background;
        }
      }
      if (!placed) return;
    }
  }

  function buildRegions(size, solution, seed) {
    const solutionCells = new Set(solution.map((column, row) => row * size + column));
    for (let attempt = 0; attempt < 40; attempt++) {
      const random = seededRandom(seed + attempt * 7919);
      const background = (seed + attempt) % size;
      const regions = Array.from({ length: size }, () => Array(size).fill(background));
      solution.forEach((column, row) => { if (row !== background) regions[row][column] = row; });
      for (let region = 0; region < size; region++) {
        if (region === background) continue;
        const targetCells = Math.max(2, Math.floor(size * (.45 + random() * .3)));
        growRegion(regions, region, background, solutionCells, random, targetCells);
      }
      if (validateContiguousRegions(regions) && countSolutions(regions) === 1) return regions;
    }
    throw new Error(`Unable to generate contiguous regions for ${size}×${size} puzzle.`);
  }

  function starterMarks(solution, count) {
    const size = solution.length;
    return Array.from({ length: count }, (_, index) => {
      const row = size - 1 - index;
      return row * size + ((solution[row] + 1) % size);
    });
  }

  const LAKES = BASE_LAKES.map(base => {
    const facts = LEVEL_FACTS[base.id];
    const lake = { id: base.id, name: base.name, fact: facts[0], sourceName: base.sourceName, sourceUrl: base.sourceUrl, shape: base.shape, releaseDate: base.releaseDate || '', weekly: base.weekly === true };
    lake.puzzles = TIERS.map((tier, index) => {
      const solution = courseSolution(tier.size, base.id * 3 + index);
      return {
        id: `${base.id}-${index + 1}`,
        lakeId: base.id,
        puzzleNumber: index + 1,
        name: base.name,
        difficulty: tier.name,
        difficultyNote: tier.note,
        size: tier.size,
        fact: facts[index],
        sourceName: base.sourceName,
        sourceUrl: base.sourceUrl,
        shape: base.shape,
        regions: buildRegions(tier.size, solution, base.id * 100 + index),
        solution,
        starterMarks: starterMarks(solution, Math.min(tier.starterCount, tier.size - 1)),
        maxHints: tier.maxHints,
        parSeconds: tier.size * 45 + index * 30
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

  return { LAKES, LEVELS, TIERS, findConflicts, isSolved, validateContiguousRegions };
});

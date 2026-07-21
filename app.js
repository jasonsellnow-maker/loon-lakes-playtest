const { LAKES, LEVELS, findConflicts, isSolved } = window.LoonPuzzle;
const Playtest = window.LoonPlaytest;
const STORAGE_KEY = 'loon-lakes-progress-v1';
const REGION_COLORS = ['#b9dfd5','#d8e7bd','#f1d4a8','#b9d7ea','#d8c8e7','#f0bfc0','#c9ddd2','#e8d9a6'];
const VICTORY_LINES = [
  { cheer: 'Oh fer cute!', message: 'You gave every loon some elbow room. The Mississippi may proceed.', feather: 'Headwaters Feather' },
  { cheer: 'That deserves a loon call!', message: 'You purified yourself in the logic of Lake Minnetonka.', feather: 'Purple Ripple Feather' },
  { cheer: 'Walleye done!', message: 'The muskies are impressed. They will never admit it.', feather: 'Trophy Walleye Feather' },
  { cheer: 'Eelpoutstanding!', message: 'No eelpout were embarrassed during this puzzle. Probably.', feather: 'Eelpout Party Feather' },
  { cheer: 'Island hopping complete!', message: 'One puzzle down, only 365 islands left to visit.', feather: 'Island Explorer Feather' },
  { cheer: 'Superior work!', message: 'Cold waves, warm feathers, and absolutely flawless loon placement.', feather: 'Big Lake Feather' }
];

const state = {
  completed: new Set(), ratings: {}, boards: {}, hintState: {}, currentLake: null,
  level: null, board: [], lockedMarks: new Set(), tool: 'loon', hints: 3,
  sound: true, tutorialSeen: false, tutorial: null, view: 'map', puzzleStartedAt: 0,
  pendingFeedbackMilestone: 0, viewBeforeLab: 'map'
};

const els = Object.fromEntries([
  'map-view','test-view','level-view','game-view','back-button','lab-button','sound-button','lake-list','progress-label','progress-fill',
  'journey-title','journey-shape','journey-fact','journey-source','journey-progress','puzzle-list',
  'level-number','lake-title','difficulty-chip','lake-fact','fact-source','tutorial-button','tutorial-coach',
  'tutorial-step','tutorial-message','tutorial-skip','loon-count','rule-message','puzzle-grid','hint-button',
  'hint-count','reset-button','win-dialog','win-title','win-cheer','win-message','feather-name','feather-score',
  'next-button','map-button','game-issue-button','metric-sessions','metric-completions','metric-per-session','metric-fun',
  'metric-tutorial','metric-first-puzzle','bar-tutorial','bar-first-puzzle','metric-solve-time','metric-hints','metric-resets',
  'metric-quit','feedback-count','issue-count','copy-link-button','share-note','export-json-button','export-csv-button',
  'feedback-button','issue-button','feedback-dialog','feedback-form','feedback-fun','feedback-difficulty','feedback-return',
  'feedback-favorite','feedback-comments','feedback-skip','issue-dialog','issue-form','issue-context','issue-description','issue-cancel'
].map(id => [id, document.getElementById(id)]));

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const oldCompleted = saved.completed || [];
    oldCompleted.forEach(id => {
      if (typeof id === 'number') LAKES.find(lake => lake.id === id)?.puzzles.forEach(puzzle => state.completed.add(puzzle.id));
      else if (LEVELS.some(level => level.id === id)) state.completed.add(id);
    });
    state.ratings = saved.ratings || {};
    state.boards = saved.boards || {};
    state.hintState = saved.hintState || {};
    state.sound = saved.sound !== false;
    state.tutorialSeen = saved.tutorialSeen === true;
  } catch (_) { /* start fresh */ }
  updateSoundButton();
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    completed: [...state.completed], ratings: state.ratings, boards: state.boards,
    hintState: state.hintState, sound: state.sound, tutorialSeen: state.tutorialSeen
  }));
}

function lakeCompletedCount(lake) {
  return lake.puzzles.filter(puzzle => state.completed.has(puzzle.id)).length;
}

function isLakeComplete(lake) {
  return lakeCompletedCount(lake) === lake.puzzles.length;
}

function isLakeUnlocked(index) {
  return index === 0 || isLakeComplete(LAKES[index - 1]);
}

function ratingMarkup(rating = 0) {
  return `<span class="rating" aria-label="${rating} of 3 feathers">${[1,2,3].map(n => `<i class="${n <= rating ? 'earned' : ''}">◆</i>`).join('')}</span>`;
}

function loonMarkup() {
  return '<span class="cell-loon" aria-hidden="true"><i class="loon-body"></i><i class="loon-neck"></i><i class="loon-head"></i><i class="loon-eye"></i><i class="loon-beak"></i></span>';
}

function renderMap() {
  els['lake-list'].innerHTML = LAKES.map((lake, index) => {
    const done = lakeCompletedCount(lake);
    const unlocked = isLakeUnlocked(index);
    return `<button class="lake-card ${done === 4 ? 'complete' : ''} ${unlocked ? '' : 'locked'}" data-lake="${lake.id}" ${unlocked ? '' : 'disabled'}>
      <span class="lake-number">${done === 4 ? '✓' : String(index + 1).padStart(2, '0')}</span>
      <svg class="lake-shape" viewBox="0 0 128 84" aria-hidden="true"><path d="${lake.shape}"></path></svg>
      <span class="lake-copy"><strong>${lake.name}</strong><small>${done}/4 puzzles · ${done === 4 ? 'Lake complete' : unlocked ? 'Continue the journey' : 'Complete the previous lake'}</small><em>${lake.fact}</em></span>
      <span class="lake-arrow">${unlocked ? '›' : '●'}</span>
    </button>`;
  }).join('');
  const completed = LEVELS.filter(level => state.completed.has(level.id)).length;
  els['progress-label'].textContent = `${completed} of ${LEVELS.length} puzzles`;
  els['progress-fill'].style.width = `${(completed / LEVELS.length) * 100}%`;
}

function renderJourney() {
  const lake = state.currentLake;
  els['journey-title'].textContent = lake.name;
  els['journey-fact'].textContent = lake.fact;
  els['journey-source'].href = lake.sourceUrl;
  els['journey-source'].textContent = `${lake.sourceName} ↗`;
  els['journey-shape'].querySelector('path').setAttribute('d', lake.shape);
  els['journey-progress'].textContent = `${lakeCompletedCount(lake)} of ${lake.puzzles.length}`;
  els['puzzle-list'].innerHTML = lake.puzzles.map((puzzle, index) => {
    const complete = state.completed.has(puzzle.id);
    const unlocked = index === 0 || state.completed.has(lake.puzzles[index - 1].id);
    const inProgress = Boolean(state.boards[puzzle.id]) && !complete;
    return `<button class="puzzle-card ${complete ? 'complete' : ''} ${unlocked ? '' : 'locked'}" data-puzzle="${puzzle.id}" ${unlocked ? '' : 'disabled'}>
      <span class="puzzle-order">${complete ? '✓' : index + 1}</span>
      <span class="puzzle-copy"><strong>${puzzle.difficulty}</strong><small>${puzzle.difficultyNote}${inProgress ? ' · In progress' : ''}</small></span>
      ${ratingMarkup(state.ratings[puzzle.id] || 0)}
      <span class="puzzle-arrow">${unlocked ? '›' : '●'}</span>
    </button>`;
  }).join('');
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const minutes = Math.floor(seconds / 60), remainder = seconds % 60;
  return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

function renderLab() {
  const data = Playtest.getData();
  const report = Playtest.summarize(data);
  els['metric-sessions'].textContent = report.sessions;
  els['metric-completions'].textContent = report.completions;
  els['metric-per-session'].textContent = report.puzzlesPerSession;
  els['metric-fun'].textContent = report.averageFun ? `${report.averageFun}/5` : '—';
  els['metric-tutorial'].textContent = `${report.tutorialRate}%`;
  els['metric-first-puzzle'].textContent = `${report.firstPuzzleRate}%`;
  els['bar-tutorial'].style.width = `${report.tutorialRate}%`;
  els['bar-first-puzzle'].style.width = `${report.firstPuzzleRate}%`;
  els['metric-solve-time'].textContent = formatDuration(report.averageSolveSeconds);
  els['metric-hints'].textContent = report.hints;
  els['metric-resets'].textContent = report.resets;
  els['metric-quit'].textContent = report.topQuitCount ? `${report.topQuitPuzzle} · ${report.topQuitCount}` : 'None yet';
  els['feedback-count'].textContent = report.feedbackCount;
  els['issue-count'].textContent = report.issueCount;
}

function openLab() {
  state.viewBeforeLab = state.view === 'test' ? 'map' : state.view;
  renderLab();
  Playtest.track('playtest_lab_opened', { view: state.viewBeforeLab });
  showView('test');
}

function downloadFile(name, content, type) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function openFeedback(milestone = 0) {
  els['feedback-form'].dataset.milestone = String(milestone);
  els['feedback-form'].reset();
  els['feedback-dialog'].showModal();
}

function openIssue() {
  const context = state.level ? `${state.currentLake.name} · ${state.level.difficulty} · puzzle ${state.level.id}` : `${state.view} screen`;
  els['issue-context'].textContent = `We’ll attach: ${context}`;
  els['issue-form'].reset();
  els['issue-dialog'].showModal();
}

function maybeAskFeedback() {
  const milestone = state.pendingFeedbackMilestone;
  state.pendingFeedbackMilestone = 0;
  if (milestone && !Playtest.hasPrompt(milestone)) {
    Playtest.markPrompt(milestone);
    openFeedback(milestone);
  }
}

function showView(name) {
  state.view = name;
  els['map-view'].classList.toggle('active', name === 'map');
  els['test-view'].classList.toggle('active', name === 'test');
  els['level-view'].classList.toggle('active', name === 'levels');
  els['game-view'].classList.toggle('active', name === 'game');
  els['back-button'].classList.toggle('hidden', name === 'map' || name === 'test');
  els['lab-button'].setAttribute('aria-pressed', String(name === 'test'));
  els['lab-button'].setAttribute('aria-label', name === 'test' ? 'Close playtest lab' : 'Open playtest lab');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openLake(id) {
  state.currentLake = LAKES.find(lake => lake.id === Number(id));
  state.tutorial = null;
  renderJourney();
  showView('levels');
  Playtest.track('lake_opened', { lakeId: state.currentLake.id });
}

function starterBoard(level) {
  const board = Array(level.size ** 2).fill(0);
  level.starterMarks.forEach(index => { board[index] = 1; });
  return board;
}

function saveCurrentBoard() {
  if (!state.level || state.completed.has(state.level.id)) return;
  state.boards[state.level.id] = [...state.board];
  state.hintState[state.level.id] = state.hints;
  saveProgress();
}

function startPuzzle(id) {
  state.level = LEVELS.find(level => level.id === String(id));
  state.currentLake = LAKES.find(lake => lake.id === state.level.lakeId);
  state.lockedMarks = new Set(state.level.starterMarks);
  const savedBoard = state.boards[state.level.id];
  const resumed = Array.isArray(savedBoard);
  state.board = Array.isArray(savedBoard) && savedBoard.length === state.level.size ** 2 ? [...savedBoard] : starterBoard(state.level);
  state.level.starterMarks.forEach(index => { state.board[index] = 1; });
  state.hints = Number.isInteger(state.hintState[state.level.id]) ? state.hintState[state.level.id] : state.level.maxHints;
  state.tool = 'loon';
  state.tutorial = null;
  state.puzzleStartedAt = Date.now();
  els['level-number'].textContent = `${state.currentLake.name} · Puzzle ${state.level.puzzleNumber} of 4`;
  els['lake-title'].textContent = state.currentLake.name;
  els['difficulty-chip'].textContent = state.level.difficulty;
  els['lake-fact'].textContent = state.level.fact;
  els['fact-source'].href = state.level.sourceUrl;
  els['fact-source'].textContent = `${state.level.sourceName} ↗`;
  els['tutorial-button'].classList.toggle('hidden', state.level.id !== '1-1');
  setTool('loon');
  renderBoard();
  showView('game');
  Playtest.track('puzzle_started', { puzzleId: state.level.id, lakeId: state.level.lakeId, difficulty: state.level.difficulty, resumed });
  if (state.level.id === '1-1' && !state.tutorialSeen) startTutorial();
}

function tutorialSteps() {
  const size = state.level.size;
  return [
    { tool: 'loon', target: state.level.solution[0], message: 'Tap the glowing water to place your first loon. Every row needs exactly one.' },
    { tool: 'water', target: (state.level.solution[0] + 1) % size, message: 'That row already has its loon. Mark this impossible spot with a ripple.' },
    { tool: 'loon', target: size + state.level.solution[1], message: 'Place the next loon in a new row, column, and region—without touching the first.' }
  ];
}

function updateTutorial() {
  document.querySelectorAll('.puzzle-cell.tutorial-target').forEach(cell => cell.classList.remove('tutorial-target'));
  if (!state.tutorial || state.level?.id !== '1-1') {
    els['tutorial-coach'].hidden = true;
    return;
  }
  const steps = tutorialSteps();
  const step = steps[state.tutorial.step];
  els['tutorial-coach'].hidden = false;
  els['tutorial-step'].textContent = `Loon lesson · ${state.tutorial.step + 1} of ${steps.length}`;
  els['tutorial-message'].textContent = step.message;
  setTool(step.tool);
  document.querySelector(`[data-cell="${step.target}"]`)?.classList.add('tutorial-target');
}

function startTutorial() {
  state.board = starterBoard(state.level);
  state.hints = state.level.maxHints;
  state.tutorial = { step: 0 };
  renderBoard();
  els['rule-message'].textContent = 'Follow the glowing water. Your loon guide has this.';
  Playtest.track('tutorial_started', { puzzleId: state.level.id });
}

function finishTutorial(skipped = false) {
  state.tutorial = null;
  state.tutorialSeen = true;
  renderBoard();
  els['rule-message'].textContent = skipped ? 'Lesson skipped. You can replay it anytime.' : 'You’ve got it! Solve the remaining rows—and use a hint if you get stuck.';
  els['rule-message'].classList.add('success');
  saveCurrentBoard();
  Playtest.track(skipped ? 'tutorial_skipped' : 'tutorial_completed', { puzzleId: state.level.id });
}

function renderBoard() {
  const level = state.level;
  const conflicts = findConflicts(state.board, level);
  els['puzzle-grid'].style.setProperty('--size', level.size);
  els['puzzle-grid'].innerHTML = state.board.map((value, index) => {
    const row = Math.floor(index / level.size), col = index % level.size, region = level.regions[row][col];
    const borders = [
      row === 0 || level.regions[row - 1][col] !== region ? 'region-top' : '',
      col === level.size - 1 || level.regions[row][col + 1] !== region ? 'region-right' : '',
      row === level.size - 1 || level.regions[row + 1][col] !== region ? 'region-bottom' : '',
      col === 0 || level.regions[row][col - 1] !== region ? 'region-left' : ''
    ].join(' ');
    const given = state.lockedMarks.has(index);
    const content = value === 2 ? loonMarkup() : value === 1 ? '<span class="water-mark">×</span>' : '';
    return `<button class="puzzle-cell ${borders} ${given ? 'given' : ''} ${conflicts.has(index) ? 'conflict' : ''}" data-cell="${index}" style="--region:${REGION_COLORS[region % REGION_COLORS.length]}" aria-label="Row ${row + 1}, column ${col + 1}${value === 2 ? ', loon' : value === 1 ? given ? ', given ripple' : ', ruled out' : ''}">${content}</button>`;
  }).join('');
  const count = state.board.filter(value => value === 2).length;
  els['loon-count'].textContent = `${count}/${level.size}`;
  els['hint-count'].textContent = `${state.hints} left`;
  els['hint-button'].disabled = state.hints === 0;
  els['rule-message'].textContent = conflicts.size ? 'Those loons are too close or share a row, column, or region.' : 'Place one loon in every row, column, and region.';
  els['rule-message'].classList.toggle('warning', conflicts.size > 0);
  els['rule-message'].classList.remove('success');
  updateTutorial();
}

function useCell(index) {
  if (state.lockedMarks.has(index)) {
    els['rule-message'].textContent = 'That training ripple is anchored in place.';
    return;
  }
  if (state.tutorial) {
    const steps = tutorialSteps();
    const step = steps[state.tutorial.step];
    if (index !== step.target || state.tool !== step.tool) {
      els['rule-message'].textContent = 'Not that puddle—follow the glow, you betcha!';
      document.querySelector(`[data-cell="${step.target}"]`)?.classList.add('tutorial-nudge');
      return;
    }
    state.board[index] = step.tool === 'loon' ? 2 : 1;
    state.tutorial.step++;
    if (state.tutorial.step >= steps.length) finishTutorial();
    else { renderBoard(); saveCurrentBoard(); }
    return;
  }
  if (state.tool === 'loon') state.board[index] = state.board[index] === 2 ? 0 : 2;
  else state.board[index] = state.board[index] === 1 ? 0 : 1;
  renderBoard();
  if (isSolved(state.board, state.level)) completeLevel();
  else saveCurrentBoard();
}

function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll('[data-tool]').forEach(button => {
    const active = button.dataset.tool === tool;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function giveHint() {
  if (!state.hints) return;
  let target = -1;
  for (let row = 0; row < state.level.size; row++) {
    const index = row * state.level.size + state.level.solution[row];
    if (state.board[index] !== 2) { target = index; break; }
  }
  if (target < 0) return;
  const row = Math.floor(target / state.level.size);
  for (let col = 0; col < state.level.size; col++) {
    const index = row * state.level.size + col;
    if (state.board[index] === 2) state.board[index] = 0;
  }
  state.board[target] = 2;
  state.hints--;
  Playtest.track('hint_used', { puzzleId: state.level.id, lakeId: state.level.lakeId, remaining: state.hints });
  renderBoard();
  document.querySelector(`[data-cell="${target}"]`)?.classList.add('hinted');
  if (isSolved(state.board, state.level)) completeLevel();
  else saveCurrentBoard();
}

function completeLevel() {
  state.completed.add(state.level.id);
  const usedHints = state.level.maxHints - state.hints;
  const rating = Math.max(1, 3 - usedHints);
  state.ratings[state.level.id] = Math.max(state.ratings[state.level.id] || 0, rating);
  delete state.boards[state.level.id];
  delete state.hintState[state.level.id];
  saveProgress();
  const durationSeconds = Math.max(1, Math.round((Date.now() - state.puzzleStartedAt) / 1000));
  Playtest.track('puzzle_completed', {
    puzzleId: state.level.id, lakeId: state.level.lakeId, difficulty: state.level.difficulty,
    durationSeconds, hintsUsed: usedHints, rating
  });
  const completedCount = LEVELS.filter(level => state.completed.has(level.id)).length;
  const milestone = Math.floor(completedCount / 4) * 4;
  if (milestone >= 4 && !Playtest.hasPrompt(milestone)) state.pendingFeedbackMilestone = milestone;
  playCompletionSound();
  const victory = VICTORY_LINES[state.level.lakeId - 1];
  els['win-cheer'].textContent = victory.cheer;
  els['win-title'].textContent = `${state.level.difficulty} is peaceful!`;
  els['win-message'].textContent = victory.message;
  els['feather-name'].textContent = victory.feather;
  els['feather-score'].textContent = Array.from({ length: 3 }, (_, index) => index < rating ? '🪶' : '◇').join(' ');
  els['feather-score'].setAttribute('aria-label', `${rating} of 3 feather rating`);
  const nextPuzzle = state.currentLake.puzzles[state.level.puzzleNumber];
  const nextLake = LAKES[state.level.lakeId];
  els['next-button'].textContent = nextPuzzle ? 'Next puzzle' : nextLake ? `Visit ${nextLake.name}` : 'Celebrate the full trail';
  els['win-dialog'].classList.remove('celebrating');
  void els['win-dialog'].offsetWidth;
  els['win-dialog'].classList.add('celebrating');
  els['win-dialog'].showModal();
}

function resetBoard() {
  state.board = starterBoard(state.level);
  state.hints = state.level.maxHints;
  delete state.boards[state.level.id];
  delete state.hintState[state.level.id];
  Playtest.track('puzzle_reset', { puzzleId: state.level.id, lakeId: state.level.lakeId });
  if (state.tutorial) startTutorial();
  else { renderBoard(); saveProgress(); }
}

function playCompletionSound() {
  if (!state.sound) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  [392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ctx.currentTime + index * .12);
    gain.gain.linearRampToValueAtTime(.1, ctx.currentTime + index * .12 + .03);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + index * .12 + .5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + index * .12);
    osc.stop(ctx.currentTime + index * .12 + .52);
  });
}

function updateSoundButton() {
  els['sound-button'].textContent = state.sound ? '♪' : '×';
  els['sound-button'].setAttribute('aria-pressed', String(state.sound));
  els['sound-button'].setAttribute('aria-label', state.sound ? 'Turn sound off' : 'Turn sound on');
}

els['lake-list'].addEventListener('click', event => {
  const card = event.target.closest('[data-lake]');
  if (card && !card.disabled) openLake(card.dataset.lake);
});
els['puzzle-list'].addEventListener('click', event => {
  const card = event.target.closest('[data-puzzle]');
  if (card && !card.disabled) startPuzzle(card.dataset.puzzle);
});
els['puzzle-grid'].addEventListener('click', event => {
  const cell = event.target.closest('[data-cell]');
  if (cell) useCell(Number(cell.dataset.cell));
});
document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => setTool(button.dataset.tool)));
els['back-button'].addEventListener('click', () => {
  if (state.view === 'game') {
    if (!state.completed.has(state.level.id)) Playtest.track('puzzle_abandoned', { puzzleId: state.level.id, lakeId: state.level.lakeId, durationSeconds: Math.max(1, Math.round((Date.now() - state.puzzleStartedAt) / 1000)) });
    saveCurrentBoard();
    openLake(state.currentLake.id);
  }
  else { renderMap(); showView('map'); }
});
els['hint-button'].addEventListener('click', giveHint);
els['reset-button'].addEventListener('click', resetBoard);
els['tutorial-button'].addEventListener('click', startTutorial);
els['tutorial-skip'].addEventListener('click', () => finishTutorial(true));
els['sound-button'].addEventListener('click', () => { state.sound = !state.sound; updateSoundButton(); saveProgress(); });
els['lab-button'].addEventListener('click', () => {
  if (state.view !== 'test') openLab();
  else if (state.viewBeforeLab === 'game' && state.level) showView('game');
  else if (state.viewBeforeLab === 'levels' && state.currentLake) { renderJourney(); showView('levels'); }
  else { renderMap(); showView('map'); }
});
els['map-button'].addEventListener('click', () => { els['win-dialog'].close(); renderMap(); showView('map'); setTimeout(maybeAskFeedback); });
els['next-button'].addEventListener('click', () => {
  els['win-dialog'].close();
  const nextPuzzle = state.currentLake.puzzles[state.level.puzzleNumber];
  if (nextPuzzle) startPuzzle(nextPuzzle.id);
  else {
    const nextLake = LAKES[state.level.lakeId];
    if (nextLake) openLake(nextLake.id);
    else { renderMap(); showView('map'); }
  }
  setTimeout(maybeAskFeedback);
});

els['copy-link-button'].addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    els['share-note'].textContent = 'Tester link copied. Once hosted, anyone with the link can open the game.';
    Playtest.track('tester_link_copied', { view: state.view });
  } catch (_) { els['share-note'].textContent = `Copy this address: ${location.href}`; }
});
els['export-json-button'].addEventListener('click', () => {
  downloadFile(`loon-lakes-playtest-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(Playtest.getData(), null, 2), 'application/json');
  Playtest.track('report_exported', { format: 'json' });
});
els['export-csv-button'].addEventListener('click', () => {
  downloadFile(`loon-lakes-events-${new Date().toISOString().slice(0,10)}.csv`, Playtest.eventsCsv(), 'text/csv');
  Playtest.track('report_exported', { format: 'csv' });
});
els['feedback-button'].addEventListener('click', () => openFeedback(0));
els['issue-button'].addEventListener('click', openIssue);
els['game-issue-button'].addEventListener('click', openIssue);
els['feedback-skip'].addEventListener('click', () => els['feedback-dialog'].close());
els['issue-cancel'].addEventListener('click', () => els['issue-dialog'].close());
els['feedback-form'].addEventListener('submit', event => {
  event.preventDefault();
  Playtest.addFeedback({
    milestone: Number(event.currentTarget.dataset.milestone) || 0,
    fun: Number(els['feedback-fun'].value), difficulty: els['feedback-difficulty'].value,
    playAgain: els['feedback-return'].value, favorite: els['feedback-favorite'].value.trim(),
    comments: els['feedback-comments'].value.trim()
  });
  els['feedback-dialog'].close();
  if (state.view === 'test') renderLab();
});
els['issue-form'].addEventListener('submit', event => {
  event.preventDefault();
  Playtest.addIssue({
    description: els['issue-description'].value.trim(), view: state.view,
    puzzleId: state.level?.id || '', lakeId: state.level?.lakeId || '', difficulty: state.level?.difficulty || ''
  });
  els['issue-dialog'].close();
  if (state.view === 'test') renderLab();
});

loadProgress();
Playtest.startSession({ version: 'playtest-beta-1', puzzleCount: LEVELS.length });
renderMap();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));

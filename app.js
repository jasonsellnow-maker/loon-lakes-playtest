const { LAKES, LEVELS, findConflicts, isSolved } = window.LoonPuzzle;
const Playtest = window.LoonPlaytest;
const Race = window.LoonRace;
const STORAGE_KEY = 'loon-lakes-progress-v1';
const REGION_COLORS = ['#b9dfd5','#d8e7bd','#f1d4a8','#b9d7ea','#d8c8e7','#f0bfc0','#c9ddd2','#e8d9a6'];
const VICTORY_LINES = [
  { cheer: 'Oh fer cute!', message: 'You gave every loon some elbow room. The Mississippi may proceed.', feather: 'Headwaters Feather' },
  { cheer: 'That deserves a loon call!', message: 'You purified yourself in the logic of Lake Minnetonka.', feather: 'Purple Ripple Feather' },
  { cheer: 'Walleye done!', message: 'The muskies are impressed. They will never admit it.', feather: 'Trophy Walleye Feather' },
  { cheer: 'Eelpoutstanding!', message: 'No eelpout were embarrassed during this puzzle. Probably.', feather: 'Eelpout Party Feather' },
  { cheer: 'Island hopping complete!', message: 'One puzzle down, only 365 islands left to visit.', feather: 'Island Explorer Feather' },
  { cheer: 'Superior work!', message: 'Cold waves, warm feathers, and absolutely flawless loon placement.', feather: 'Big Lake Feather' },
  { cheer: 'Woods you look at that!', message: 'Eight rows of northwoods water and every loon found its own little kingdom.', feather: 'Northwoods Race Feather' }
];

const state = {
  completed: new Set(), ratings: {}, results: {}, boards: {}, runStates: {}, currentLake: null,
  level: null, board: [], lockedMarks: new Set(), tool: 'loon', hintTokens: 3, featherBank: 0,
  run: null, timerInterval: null, sound: true, music: true, haptics: true, tutorialSeen: false, tutorial: null, view: 'map',
  pendingFeedbackMilestone: 0, viewBeforeLab: 'map', lastShareMetrics: null
};

let feedbackAudioContext = null;
const NATURAL_SOUND_FILES = {
  wail: 'assets/loon-wail.m4a',
  tremolo: 'assets/loon-tremolo.m4a',
  yodel: 'assets/loon-yodel.m4a',
  splash: 'assets/splash.m4a'
};
const naturalSoundBuffers = new Map();
const naturalSoundLoads = new Map();
let backgroundMusicAudio = null;

const els = Object.fromEntries([
  'map-view','test-view','level-view','game-view','back-button','lab-button','settings-button','settings-dialog','sound-button','music-button',
  'haptic-button','reset-progress-button','reset-progress-dialog','confirm-reset-progress-button','lake-list','progress-label','progress-fill',
  'journey-title','journey-kicker','journey-shape','journey-fact','journey-source','journey-progress','puzzle-list',
  'level-number','lake-title','difficulty-chip','lake-fact','fact-source','tutorial-button','tutorial-coach',
  'tutorial-step','tutorial-message','tutorial-skip','loon-count','rule-message','puzzle-grid','hint-button',
  'hint-count','reset-button','race-timer','race-hints','race-mistakes','race-par','feather-bank','hint-bank',
  'weekly-drop','weekly-lake-name','weekly-lake-fact','win-dialog','win-title','win-cheer','win-message','feather-name','feather-score',
  'result-time','result-hints','result-mistakes','result-score','lake-result','lake-result-title','lake-total-time',
  'lake-total-hints','lake-total-mistakes','lake-total-feathers','share-race-button','copy-race-button','race-share-status',
  'hint-dialog','hint-dialog-balance','nudge-hint-button','reveal-hint-button','shop-feather-balance','buy-hint-button',
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
    state.results = saved.results || {};
    state.boards = saved.boards || {};
    state.runStates = saved.runStates || {};
    state.hintTokens = Number.isInteger(saved.hintTokens) ? saved.hintTokens : 3;
    state.featherBank = Number.isInteger(saved.featherBank) ? saved.featherBank : Object.values(state.ratings).reduce((sum, value) => sum + (Number(value) || 0), 0);
    state.sound = saved.sound !== false;
    state.music = saved.music !== false;
    state.haptics = saved.haptics !== false;
    state.tutorialSeen = saved.tutorialSeen === true;
  } catch (_) { /* start fresh */ }
  updateSoundButton();
  updateMusicButton();
  updateHapticButton();
  updateWallet();
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    completed: [...state.completed], ratings: state.ratings, results: state.results, boards: state.boards,
    runStates: state.runStates, hintTokens: state.hintTokens, featherBank: state.featherBank,
    sound: state.sound, music: state.music, haptics: state.haptics, tutorialSeen: state.tutorialSeen
  }));
}

function lakeCompletedCount(lake) {
  return lake.puzzles.filter(puzzle => state.completed.has(puzzle.id)).length;
}

function isLakeComplete(lake) {
  return lakeCompletedCount(lake) === lake.puzzles.length;
}

function isLakeUnlocked(index) {
  return index === 0 || LAKES[index].weekly || lakeCompletedCount(LAKES[index]) > 0 || isLakeComplete(LAKES[index - 1]);
}

function ratingMarkup(rating = 0) {
  return `<span class="rating" aria-label="${rating} of 5 feathers">${[1,2,3,4,5].map(n => `<i class="${n <= rating ? 'earned' : ''}">◆</i>`).join('')}</span>`;
}

function updateWallet() {
  els['feather-bank'].textContent = state.featherBank;
  els['hint-bank'].textContent = state.hintTokens;
}

function loonMarkup() {
  return '<span class="cell-loon" aria-hidden="true"><i class="loon-body"></i><i class="loon-neck"></i><i class="loon-head"></i><i class="loon-eye"></i><i class="loon-beak"></i></span>';
}

function renderMap() {
  els['lake-list'].innerHTML = LAKES.map((lake, index) => {
    const done = lakeCompletedCount(lake);
    const unlocked = isLakeUnlocked(index);
    return `<button class="lake-card ${done === lake.puzzles.length ? 'complete' : ''} ${unlocked ? '' : 'locked'}" data-lake="${lake.id}" ${unlocked ? '' : 'disabled'}>
      <span class="lake-number">${done === lake.puzzles.length ? '✓' : String(index + 1).padStart(2, '0')}</span>
      <svg class="lake-shape" viewBox="0 0 128 84" aria-hidden="true"><path d="${lake.shape}"></path></svg>
      <span class="lake-copy"><strong>${lake.name}${lake.weekly ? '<b class="new-badge">New</b>' : ''}</strong><small>${done}/${lake.puzzles.length} puzzles · ${done === lake.puzzles.length ? 'Lake complete' : unlocked ? 'Continue the journey' : 'Complete the previous lake'}</small><em>${lake.fact}</em></span>
      <span class="lake-arrow">${unlocked ? '›' : '●'}</span>
    </button>`;
  }).join('');
  const completed = LEVELS.filter(level => state.completed.has(level.id)).length;
  els['progress-label'].textContent = `${completed} of ${LEVELS.length} puzzles`;
  els['progress-fill'].style.width = `${(completed / LEVELS.length) * 100}%`;
  const weeklyLake = [...LAKES].reverse().find(lake => lake.weekly) || LAKES.at(-1);
  els['weekly-lake-name'].textContent = weeklyLake.name;
  els['weekly-lake-fact'].textContent = weeklyLake.fact;
  els['weekly-drop'].dataset.lake = weeklyLake.id;
  updateWallet();
}

function renderJourney() {
  const lake = state.currentLake;
  els['journey-title'].textContent = lake.name;
  els['journey-fact'].textContent = lake.fact;
  els['journey-source'].href = lake.sourceUrl;
  els['journey-source'].textContent = `${lake.sourceName} ↗`;
  els['journey-shape'].querySelector('path').setAttribute('d', lake.shape);
  els['journey-kicker'].textContent = `${lake.puzzles.length}-puzzle journey${lake.weekly ? ' · New this week' : ''}`;
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
  return seconds ? Race.formatDuration(seconds) : '—';
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
  if (state.viewBeforeLab === 'game') { stopTimer(); saveCurrentBoard(); }
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

function renderRaceHud() {
  const run = state.run || { elapsedSeconds: 0, hintsUsed: 0, mistakes: 0 };
  els['race-timer'].textContent = Race.formatDuration(run.elapsedSeconds);
  els['race-hints'].textContent = run.hintsUsed;
  els['race-mistakes'].textContent = run.mistakes;
  els['race-par'].textContent = Race.formatDuration(state.level?.parSeconds || 0);
  els['hint-count'].textContent = `${state.hintTokens} token${state.hintTokens === 1 ? '' : 's'}`;
  updateWallet();
}

function stopTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = null;
}

function startTimer() {
  stopTimer();
  renderRaceHud();
  state.timerInterval = setInterval(() => {
    if (state.view !== 'game' || !state.run || els['win-dialog'].open) return;
    state.run.elapsedSeconds++;
    els['race-timer'].textContent = Race.formatDuration(state.run.elapsedSeconds);
    if (state.run.elapsedSeconds % 5 === 0) saveCurrentBoard();
  }, 1000);
}

function updateHintDialog() {
  els['hint-dialog-balance'].textContent = state.hintTokens;
  els['shop-feather-balance'].textContent = state.featherBank;
  els['nudge-hint-button'].disabled = state.hintTokens < 1;
  els['reveal-hint-button'].disabled = state.hintTokens < 2;
  els['buy-hint-button'].disabled = state.featherBank < Race.HINT_COST;
  renderRaceHud();
}

function saveCurrentBoard() {
  if (!state.level || state.completed.has(state.level.id)) return;
  state.boards[state.level.id] = [...state.board];
  state.runStates[state.level.id] = { ...state.run, revealed: [...(state.run?.revealed || [])], nudged: [...(state.run?.nudged || [])] };
  saveProgress();
}

function startPuzzle(id) {
  state.level = LEVELS.find(level => level.id === String(id));
  state.currentLake = LAKES.find(lake => lake.id === state.level.lakeId);
  const savedBoard = state.boards[state.level.id];
  const resumed = Array.isArray(savedBoard);
  state.run = state.runStates[state.level.id] || { elapsedSeconds: 0, hintsUsed: 0, mistakes: 0, revealed: [], nudged: [] };
  if (!Array.isArray(state.run.revealed)) state.run.revealed = [];
  if (!Array.isArray(state.run.nudged)) state.run.nudged = [];
  state.lockedMarks = new Set([...state.level.starterMarks, ...state.run.revealed]);
  state.board = Array.isArray(savedBoard) && savedBoard.length === state.level.size ** 2 ? [...savedBoard] : starterBoard(state.level);
  state.level.starterMarks.forEach(index => { state.board[index] = 1; });
  state.run.revealed.forEach(index => { state.board[index] = 2; });
  state.tool = 'loon';
  state.tutorial = null;
  els['level-number'].textContent = `${state.currentLake.name} · Puzzle ${state.level.puzzleNumber} of ${state.currentLake.puzzles.length}`;
  els['lake-title'].textContent = state.currentLake.name;
  els['difficulty-chip'].textContent = state.level.difficulty;
  els['lake-fact'].textContent = state.level.fact;
  els['fact-source'].href = state.level.sourceUrl;
  els['fact-source'].textContent = `${state.level.sourceName} ↗`;
  els['tutorial-button'].classList.toggle('hidden', state.level.id !== '1-1');
  setTool('loon');
  renderBoard();
  showView('game');
  startTimer();
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
  els['hint-button'].disabled = false;
  els['rule-message'].textContent = conflicts.size ? 'Those loons are too close or share a row, column, or region.' : 'Place one loon in every row, column, and region.';
  els['rule-message'].classList.toggle('warning', conflicts.size > 0);
  els['rule-message'].classList.remove('success');
  renderRaceHud();
  updateTutorial();
}

function logMistake(kind, index) {
  if (!state.run) return;
  state.run.mistakes++;
  Playtest.track('mistake_made', { puzzleId: state.level.id, lakeId: state.level.lakeId, kind, cell: index, mistakes: state.run.mistakes });
}

function vibrate(pattern) {
  if (state.haptics && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
}

function getAudioContext() {
  if (!state.sound) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  feedbackAudioContext ||= new AudioContext();
  if (feedbackAudioContext.state === 'suspended') void feedbackAudioContext.resume();
  return feedbackAudioContext;
}

function getBackgroundMusic() {
  if (!backgroundMusicAudio) {
    backgroundMusicAudio = new Audio('assets/background-music.m4a');
    backgroundMusicAudio.loop = true;
    backgroundMusicAudio.preload = 'auto';
    backgroundMusicAudio.volume = .18;
  }
  return backgroundMusicAudio;
}

function startBackgroundMusic() {
  if (!state.music) return;
  const music = getBackgroundMusic();
  if (music.paused) void music.play().catch(() => { /* waits for the next user gesture */ });
}

function stopBackgroundMusic() {
  backgroundMusicAudio?.pause();
}

function preloadNaturalSounds() {
  if (!state.sound) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  Object.entries(NATURAL_SOUND_FILES).forEach(([name, url]) => {
    if (naturalSoundBuffers.has(name) || naturalSoundLoads.has(name)) return;
    const load = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Sound request failed: ${response.status}`);
        return response.arrayBuffer();
      })
      .then(data => ctx.decodeAudioData(data))
      .then(buffer => { naturalSoundBuffers.set(name, buffer); return buffer; })
      .catch(() => null);
    naturalSoundLoads.set(name, load);
  });
}

function playNaturalSound(ctx, name, { offset = 0, duration = 1, volume = .2, rate = 1 } = {}) {
  const buffer = naturalSoundBuffers.get(name);
  if (!buffer) { preloadNaturalSounds(); return false; }
  const startOffset = Math.min(offset, Math.max(0, buffer.duration - .05));
  const clipDuration = Math.min(duration, Math.max(.05, buffer.duration - startOffset));
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  gain.gain.setValueAtTime(.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + .025);
  gain.gain.setValueAtTime(volume, ctx.currentTime + Math.max(.03, clipDuration - .1));
  gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + clipDuration);
  source.connect(gain).connect(ctx.destination);
  source.start(ctx.currentTime, startOffset, clipDuration);
  return true;
}

function scheduleTone(ctx, { at = 0, from, to = from, duration = .2, volume = .055, type = 'sine' }) {
  const start = ctx.currentTime + at;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(.018, duration / 3));
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .02);
}

function scheduleSplash(ctx, { at = 0, duration = .14, volume = .045, frequency = 1250 } = {}) {
  const start = ctx.currentTime + at;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = .8;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
}

function playActionFeedback(kind) {
  const patterns = {
    tap: 7, loon: [16, 14, 22], ripple: 10, mistake: [42, 18, 48],
    hintNudge: [10, 28, 12], hintReveal: [14, 14, 18, 14, 28], reset: [24, 18, 24]
  };
  vibrate(patterns[kind] || patterns.tap);
  if (kind === 'tap' || !state.sound) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (kind === 'loon') {
    if (!playNaturalSound(ctx, 'wail', { duration: 4, volume: .24 })) {
      scheduleTone(ctx, { from: 520, to: 760, duration: .15, volume: .05 });
      scheduleTone(ctx, { at: .12, from: 710, to: 430, duration: .21, volume: .045, type: 'triangle' });
    }
  } else if (kind === 'ripple') {
    if (!playNaturalSound(ctx, 'splash', { duration: 6, volume: .34 })) {
      scheduleSplash(ctx, { duration: .24, volume: .075, frequency: 1750 });
      scheduleSplash(ctx, { at: .075, duration: .15, volume: .035, frequency: 3400 });
      scheduleTone(ctx, { from: 255, to: 72, duration: .2, volume: .055 });
      scheduleTone(ctx, { at: .055, from: 1150, to: 720, duration: .09, volume: .027 });
      scheduleTone(ctx, { at: .135, from: 860, to: 540, duration: .08, volume: .019 });
    }
  } else if (kind === 'mistake') {
    if (!playNaturalSound(ctx, 'tremolo', { duration: 4, volume: .29 })) {
      scheduleTone(ctx, { from: 980, to: 390, duration: .16, volume: .072, type: 'sawtooth' });
      scheduleTone(ctx, { at: .12, from: 760, to: 320, duration: .13, volume: .06, type: 'triangle' });
    }
  } else if (kind === 'hintNudge') {
    scheduleTone(ctx, { from: 587, duration: .14, volume: .035 });
    scheduleTone(ctx, { at: .1, from: 784, duration: .2, volume: .038 });
  } else if (kind === 'hintReveal') {
    [523, 659, 880].forEach((from, index) => scheduleTone(ctx, { at: index * .085, from, to: from * 1.04, duration: .25, volume: .04 }));
  } else if (kind === 'reset') {
    scheduleTone(ctx, { from: 330, to: 180, duration: .22, volume: .035, type: 'triangle' });
  }
}

function useCell(index) {
  if (state.lockedMarks.has(index)) {
    playActionFeedback('tap');
    els['rule-message'].textContent = state.board[index] === 2 ? 'That revealed loon is happily anchored in place.' : 'That training ripple is anchored in place.';
    return;
  }
  if (state.tutorial) {
    const steps = tutorialSteps();
    const step = steps[state.tutorial.step];
    if (index !== step.target || state.tool !== step.tool) {
      playActionFeedback('mistake');
      els['rule-message'].textContent = 'Not that puddle—follow the glow, you betcha!';
      document.querySelector(`[data-cell="${step.target}"]`)?.classList.add('tutorial-nudge');
      return;
    }
    state.board[index] = step.tool === 'loon' ? 2 : 1;
    playActionFeedback(step.tool === 'loon' ? 'loon' : 'ripple');
    state.tutorial.step++;
    if (state.tutorial.step >= steps.length) finishTutorial();
    else { renderBoard(); saveCurrentBoard(); }
    return;
  }
  const row = Math.floor(index / state.level.size);
  const solutionIndex = row * state.level.size + state.level.solution[row];
  let feedback = 'tap';
  if (state.tool === 'loon') {
    const placing = state.board[index] !== 2;
    if (placing && index !== solutionIndex) { logMistake('wrong_loon', index); feedback = 'mistake'; }
    else if (placing) feedback = 'loon';
    state.board[index] = placing ? 2 : 0;
  } else {
    const placing = state.board[index] !== 1;
    if (placing && index === solutionIndex) { logMistake('wrong_ripple', index); feedback = 'mistake'; }
    else if (placing) feedback = 'ripple';
    state.board[index] = placing ? 1 : 0;
  }
  playActionFeedback(feedback);
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

function giveHint(type) {
  const cost = type === 'reveal' ? 2 : 1;
  if (state.hintTokens < cost) return;
  let target = -1;
  const unresolved = [];
  for (let row = 0; row < state.level.size; row++) {
    const index = row * state.level.size + state.level.solution[row];
    if (state.board[index] !== 2) unresolved.push(index);
  }
  target = type === 'nudge' ? (unresolved.find(index => !state.run.nudged.includes(index)) ?? unresolved[0] ?? -1) : (unresolved[0] ?? -1);
  if (target < 0) return;
  state.hintTokens -= cost;
  state.run.hintsUsed++;
  if (type === 'reveal') {
    const row = Math.floor(target / state.level.size);
    for (let col = 0; col < state.level.size; col++) {
      const index = row * state.level.size + col;
      if (state.board[index] === 2) state.board[index] = 0;
    }
    state.board[target] = 2;
    if (!state.run.revealed.includes(target)) state.run.revealed.push(target);
    state.lockedMarks.add(target);
  } else if (!state.run.nudged.includes(target)) state.run.nudged.push(target);
  Playtest.track('hint_used', { puzzleId: state.level.id, lakeId: state.level.lakeId, hintType: type, tokenCost: cost, remaining: state.hintTokens });
  playActionFeedback(type === 'reveal' ? 'hintReveal' : 'hintNudge');
  els['hint-dialog'].close();
  renderBoard();
  document.querySelector(`[data-cell="${target}"]`)?.classList.add('hinted');
  els['rule-message'].textContent = type === 'reveal' ? 'A friendly loon landed and locked that square.' : 'That glowing square is a safe place for a loon.';
  els['rule-message'].classList.add('success');
  if (isSolved(state.board, state.level)) completeLevel();
  else saveCurrentBoard();
}

function isBetterResult(candidate, previous) {
  return !previous || candidate.score > previous.score || (candidate.score === previous.score && candidate.durationSeconds < previous.durationSeconds);
}

function completeLevel() {
  stopTimer();
  state.completed.add(state.level.id);
  const durationSeconds = Math.max(1, state.run.elapsedSeconds);
  const scoring = Race.scoreRun({ durationSeconds, hintsUsed: state.run.hintsUsed, mistakes: state.run.mistakes, parSeconds: state.level.parSeconds });
  const result = {
    puzzleId: state.level.id, lakeId: state.level.lakeId, lakeName: state.currentLake.name,
    durationSeconds, hintsUsed: state.run.hintsUsed, mistakes: state.run.mistakes,
    score: scoring.score, timePenalty: scoring.timePenalty, completedAt: new Date().toISOString()
  };
  const oldBestScore = state.ratings[state.level.id] || 0;
  const featherGain = Math.max(0, result.score - oldBestScore);
  state.featherBank += featherGain;
  state.ratings[state.level.id] = Math.max(oldBestScore, result.score);
  if (isBetterResult(result, state.results[state.level.id])) state.results[state.level.id] = result;
  delete state.boards[state.level.id];
  delete state.runStates[state.level.id];
  saveProgress();
  Playtest.track('puzzle_completed', {
    puzzleId: state.level.id, lakeId: state.level.lakeId, difficulty: state.level.difficulty,
    durationSeconds, hintsUsed: result.hintsUsed, mistakes: result.mistakes, rating: result.score,
    timePenalty: result.timePenalty, feathersBanked: featherGain
  });
  const completedCount = LEVELS.filter(level => state.completed.has(level.id)).length;
  const lakeComplete = isLakeComplete(state.currentLake);
  if (lakeComplete && !Playtest.hasPrompt(completedCount)) state.pendingFeedbackMilestone = completedCount;
  playCompletionSound();
  const victory = VICTORY_LINES[state.level.lakeId - 1];
  els['win-cheer'].textContent = victory.cheer;
  els['win-title'].textContent = `${state.level.difficulty} is peaceful!`;
  els['win-message'].textContent = `${victory.message}${result.timePenalty ? ' The sun dipped past par, costing one point.' : ''}`;
  els['feather-name'].textContent = `${victory.feather} · ${featherGain ? `+${featherGain} banked` : 'best score kept'}`;
  els['feather-score'].textContent = Array.from({ length: 5 }, (_, index) => index < result.score ? '🪶' : '◇').join(' ');
  els['feather-score'].setAttribute('aria-label', `${result.score} of 5 feather rating`);
  els['result-time'].textContent = Race.formatDuration(result.durationSeconds);
  els['result-hints'].textContent = result.hintsUsed;
  els['result-mistakes'].textContent = result.mistakes;
  els['result-score'].textContent = `${result.score}/5`;
  const puzzleMetrics = { ...result, puzzles: 1, feathers: result.score };
  state.lastShareMetrics = puzzleMetrics;
  els['lake-result'].hidden = !lakeComplete;
  if (lakeComplete) {
    const totals = Race.lakeTotals(state.currentLake.puzzles.map(puzzle => state.results[puzzle.id]).filter(Boolean), state.currentLake.name);
    els['lake-result-title'].textContent = `${state.currentLake.name} totals`;
    els['lake-total-time'].textContent = Race.formatDuration(totals.durationSeconds);
    els['lake-total-hints'].textContent = totals.hintsUsed;
    els['lake-total-mistakes'].textContent = totals.mistakes;
    els['lake-total-feathers'].textContent = totals.feathers;
    state.lastShareMetrics = totals;
  }
  els['race-share-status'].textContent = '';
  updateWallet();
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
  state.run.mistakes++;
  playActionFeedback('reset');
  state.run.revealed.forEach(index => { state.board[index] = 2; });
  state.lockedMarks = new Set([...state.level.starterMarks, ...state.run.revealed]);
  delete state.boards[state.level.id];
  Playtest.track('puzzle_reset', { puzzleId: state.level.id, lakeId: state.level.lakeId, mistakes: state.run.mistakes });
  if (state.tutorial) startTutorial();
  else { renderBoard(); saveCurrentBoard(); }
}

function playCompletionSound() {
  vibrate([20, 18, 20, 18, 48]);
  if (!state.sound) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (playNaturalSound(ctx, 'yodel', { duration: 6, volume: .25 })) return;
  [392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ctx.currentTime + index * .12);
    gain.gain.linearRampToValueAtTime(.055, ctx.currentTime + index * .12 + .03);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + index * .12 + .5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + index * .12);
    osc.stop(ctx.currentTime + index * .12 + .52);
  });
}

function updateSoundButton() {
  els['sound-button'].textContent = `Sound effects: ${state.sound ? 'On' : 'Off'}`;
  els['sound-button'].setAttribute('aria-pressed', String(state.sound));
  els['sound-button'].setAttribute('aria-label', state.sound ? 'Turn sound off' : 'Turn sound on');
}

function updateMusicButton() {
  els['music-button'].textContent = `Background music: ${state.music ? 'On' : 'Off'}`;
  els['music-button'].setAttribute('aria-pressed', String(state.music));
  els['music-button'].setAttribute('aria-label', state.music ? 'Turn background music off' : 'Turn background music on');
}

function updateHapticButton() {
  const supported = typeof navigator.vibrate === 'function';
  els['haptic-button'].disabled = !supported;
  els['haptic-button'].textContent = supported ? `Phone vibration: ${state.haptics ? 'On' : 'Off'}` : 'Phone vibration: Not supported';
  els['haptic-button'].setAttribute('aria-pressed', String(supported && state.haptics));
}

document.addEventListener('pointerdown', event => {
  startBackgroundMusic();
  if (event.pointerType === 'touch' && event.target.closest('button:not(:disabled)')) vibrate(7);
});

els['lake-list'].addEventListener('click', event => {
  const card = event.target.closest('[data-lake]');
  if (card && !card.disabled) openLake(card.dataset.lake);
});
els['weekly-drop'].addEventListener('click', event => openLake(event.currentTarget.dataset.lake));
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
    stopTimer();
    if (!state.completed.has(state.level.id)) Playtest.track('puzzle_abandoned', { puzzleId: state.level.id, lakeId: state.level.lakeId, durationSeconds: Math.max(1, state.run.elapsedSeconds), hintsUsed: state.run.hintsUsed, mistakes: state.run.mistakes });
    saveCurrentBoard();
    openLake(state.currentLake.id);
  }
  else { renderMap(); showView('map'); }
});
els['hint-button'].addEventListener('click', () => { updateHintDialog(); els['hint-dialog'].showModal(); });
els['nudge-hint-button'].addEventListener('click', () => giveHint('nudge'));
els['reveal-hint-button'].addEventListener('click', () => giveHint('reveal'));
els['buy-hint-button'].addEventListener('click', () => {
  if (state.featherBank < Race.HINT_COST) return;
  state.featherBank -= Race.HINT_COST;
  state.hintTokens++;
  saveProgress();
  Playtest.track('hint_purchased', { cost: Race.HINT_COST, remainingFeathers: state.featherBank, hintTokens: state.hintTokens });
  updateHintDialog();
});
els['reset-button'].addEventListener('click', resetBoard);
els['tutorial-button'].addEventListener('click', startTutorial);
els['tutorial-skip'].addEventListener('click', () => finishTutorial(true));
els['sound-button'].addEventListener('click', () => {
  state.sound = !state.sound;
  updateSoundButton();
  if (state.sound) preloadNaturalSounds();
  saveProgress();
});
els['music-button'].addEventListener('click', () => {
  state.music = !state.music;
  updateMusicButton();
  if (state.music) startBackgroundMusic();
  else stopBackgroundMusic();
  saveProgress();
});
els['settings-button'].addEventListener('click', () => els['settings-dialog'].showModal());
els['haptic-button'].addEventListener('click', () => {
  state.haptics = !state.haptics;
  updateHapticButton();
  if (state.haptics) vibrate([10, 12, 18]);
  saveProgress();
});
els['reset-progress-button'].addEventListener('click', () => {
  els['settings-dialog'].close();
  els['reset-progress-dialog'].showModal();
});
els['confirm-reset-progress-button'].addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(Playtest.STORAGE_KEY);
  location.reload();
});
els['lab-button'].addEventListener('click', () => {
  if (state.view !== 'test') openLab();
  else if (state.viewBeforeLab === 'game' && state.level) { showView('game'); startTimer(); }
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

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* use selection fallback */ }
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  const copied = document.execCommand('copy');
  area.remove();
  return copied;
}

async function shareRace(useNative) {
  if (!state.lastShareMetrics) return;
  const text = Race.buildShareText(state.lastShareMetrics, location.href.split('#')[0]);
  try {
    if (useNative && navigator.share) {
      await navigator.share({ title: 'Loon Lakes race', text });
      els['race-share-status'].textContent = 'Race card shared. Let the loon sprint begin!';
      Playtest.track('race_shared', { method: 'native', lakeId: state.lastShareMetrics.lakeId || state.currentLake.id });
    } else {
      const copied = await copyText(text);
      els['race-share-status'].textContent = copied ? 'Race metrics copied. Paste them anywhere.' : 'Select Share race to send your result.';
      if (copied) Playtest.track('race_shared', { method: 'clipboard', lakeId: state.lastShareMetrics.lakeId || state.currentLake.id });
    }
  } catch (error) {
    if (error?.name !== 'AbortError') els['race-share-status'].textContent = 'Sharing was blocked. Try Copy challenge instead.';
  }
}

els['share-race-button'].addEventListener('click', () => shareRace(true));
els['copy-race-button'].addEventListener('click', () => shareRace(false));

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
preloadNaturalSounds();
Playtest.startSession({ version: 'race-beta-3', puzzleCount: LEVELS.length });
renderMap();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));

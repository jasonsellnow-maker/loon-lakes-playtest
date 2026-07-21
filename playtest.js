(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LoonPlaytest = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE_KEY = 'loon-lakes-playtest-v1';
  let sessionId = '';

  function blankData() {
    return { events: [], feedback: [], issues: [], prompts: [] };
  }

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return parsed && Array.isArray(parsed.events) ? { ...blankData(), ...parsed } : blankData();
    } catch (_) { return blankData(); }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function startSession(details = {}) {
    if (sessionId) return sessionId;
    sessionId = makeId('session');
    track('session_started', details);
    return sessionId;
  }

  function track(type, details = {}) {
    if (!sessionId) sessionId = makeId('session');
    const data = load();
    data.events.push({ id: makeId('event'), sessionId, type, timestamp: new Date().toISOString(), ...details });
    data.events = data.events.slice(-2000);
    save(data);
  }

  function addFeedback(feedback) {
    const data = load();
    data.feedback.push({ id: makeId('feedback'), sessionId, timestamp: new Date().toISOString(), ...feedback });
    save(data);
    track('feedback_submitted', { milestone: feedback.milestone, fun: Number(feedback.fun) || 0 });
  }

  function addIssue(issue) {
    const data = load();
    data.issues.push({ id: makeId('issue'), sessionId, timestamp: new Date().toISOString(), ...issue });
    save(data);
    track('issue_reported', { puzzleId: issue.puzzleId || '', view: issue.view || '' });
  }

  function hasPrompt(milestone) {
    return load().prompts.includes(milestone);
  }

  function markPrompt(milestone) {
    const data = load();
    if (!data.prompts.includes(milestone)) data.prompts.push(milestone);
    save(data);
  }

  function summarize(input) {
    const data = input || load();
    const events = data.events || [];
    const sessionIds = new Set(events.map(event => event.sessionId));
    const sessions = Math.max(sessionIds.size, 1);
    const sessionsWith = type => new Set(events.filter(event => event.type === type).map(event => event.sessionId));
    const tutorialStarts = sessionsWith('tutorial_started');
    const tutorialCompletes = sessionsWith('tutorial_completed');
    const firstStarts = new Set(events.filter(event => event.type === 'puzzle_started' && event.puzzleId === '1-1').map(event => event.sessionId));
    const firstCompletes = new Set(events.filter(event => event.type === 'puzzle_completed' && event.puzzleId === '1-1').map(event => event.sessionId));
    const completions = events.filter(event => event.type === 'puzzle_completed');
    const timed = completions.filter(event => Number.isFinite(Number(event.durationSeconds)));
    const abandons = events.filter(event => event.type === 'puzzle_abandoned');
    const quitCounts = abandons.reduce((counts, event) => {
      const key = event.puzzleId || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
    const topQuit = Object.entries(quitCounts).sort((a, b) => b[1] - a[1])[0];
    const funScores = (data.feedback || []).map(item => Number(item.fun)).filter(Number.isFinite);
    return {
      sessions,
      tutorialRate: tutorialStarts.size ? Math.round((tutorialCompletes.size / tutorialStarts.size) * 100) : 0,
      firstPuzzleRate: firstStarts.size ? Math.round((firstCompletes.size / firstStarts.size) * 100) : 0,
      completions: completions.length,
      puzzlesPerSession: Number((completions.length / sessions).toFixed(1)),
      averageSolveSeconds: timed.length ? Math.round(timed.reduce((sum, event) => sum + Number(event.durationSeconds), 0) / timed.length) : 0,
      hints: events.filter(event => event.type === 'hint_used').length,
      mistakes: events.filter(event => event.type === 'mistake_made').length,
      resets: events.filter(event => event.type === 'puzzle_reset').length,
      abandons: abandons.length,
      topQuitPuzzle: topQuit ? topQuit[0] : 'None yet',
      topQuitCount: topQuit ? topQuit[1] : 0,
      averageFun: funScores.length ? Number((funScores.reduce((a, b) => a + b, 0) / funScores.length).toFixed(1)) : 0,
      feedbackCount: (data.feedback || []).length,
      issueCount: (data.issues || []).length
    };
  }

  function eventsCsv(input) {
    const data = input || load();
    const columns = ['timestamp','sessionId','type','puzzleId','lakeId','difficulty','durationSeconds','hintsUsed','mistakes','rating','timePenalty','hintType','tokenCost','view'];
    const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    return [columns.join(','), ...(data.events || []).map(event => columns.map(column => escape(event[column])).join(','))].join('\n');
  }

  return { STORAGE_KEY, startSession, track, addFeedback, addIssue, hasPrompt, markPrompt, getData: load, summarize, eventsCsv };
});

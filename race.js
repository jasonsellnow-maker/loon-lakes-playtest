(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LoonRace = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MAX_SCORE = 5;
  const HINT_COST = 3;

  function formatDuration(seconds = 0) {
    const safe = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(safe / 60);
    const remainder = safe % 60;
    return minutes ? `${minutes}:${String(remainder).padStart(2, '0')}` : `0:${String(remainder).padStart(2, '0')}`;
  }

  function scoreRun({ durationSeconds = 0, hintsUsed = 0, mistakes = 0, parSeconds = 0 } = {}) {
    const timePenalty = parSeconds > 0 && durationSeconds > parSeconds ? 1 : 0;
    const deductions = Math.max(0, hintsUsed) + Math.max(0, mistakes) + timePenalty;
    return {
      score: Math.max(1, MAX_SCORE - deductions),
      timePenalty,
      deductions
    };
  }

  function lakeTotals(results = [], lakeName = '') {
    const totals = results.reduce((summary, result) => {
      summary.durationSeconds += Number(result?.durationSeconds) || 0;
      summary.hintsUsed += Number(result?.hintsUsed) || 0;
      summary.mistakes += Number(result?.mistakes) || 0;
      summary.feathers += Number(result?.score) || 0;
      return summary;
    }, { lakeName, durationSeconds: 0, hintsUsed: 0, mistakes: 0, feathers: 0, puzzles: results.length });
    return totals;
  }

  function buildShareText(metrics, url) {
    const scope = metrics.puzzles > 1 ? `${metrics.lakeName} lake race` : `${metrics.lakeName} puzzle race`;
    return [
      `I finished the ${scope} in ${formatDuration(metrics.durationSeconds)}!`,
      `🪶 ${metrics.feathers} feathers · ✦ ${metrics.hintsUsed} hints · ⚠ ${metrics.mistakes} mistakes`,
      'Think you can beat my flock?',
      url
    ].join('\n');
  }

  return { MAX_SCORE, HINT_COST, formatDuration, scoreRun, lakeTotals, buildShareText };
});

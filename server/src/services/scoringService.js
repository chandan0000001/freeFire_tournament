/**
 * Scoring calculation engine for RIT Esports Arena
 */

export const calculateEntryScore = (entry, scoringConfig) => {
  const killPointValue = scoringConfig?.killPointValue ?? 1;
  const booyahBonus = scoringConfig?.booyahBonus ?? 12;

  const kills = Math.max(0, parseInt(entry.kills, 10) || 0);
  const isBooyah = Boolean(entry.isBooyah || entry.placement === 1);

  // Kill points
  const killPoints = kills * killPointValue;

  // Booyah bonus points
  const booyahPoints = isBooyah ? booyahBonus : 0;

  // Optional placement points (if placement points map exists in config)
  let placementPoints = 0;
  if (scoringConfig?.placementPoints && typeof scoringConfig.placementPoints.get === 'function') {
    placementPoints = scoringConfig.placementPoints.get(entry.placement) || 0;
  } else if (scoringConfig?.placementPoints && typeof scoringConfig.placementPoints === 'object') {
    placementPoints = scoringConfig.placementPoints[entry.placement] || 0;
  }

  // Total points calculation
  const totalPoints = killPoints + booyahPoints;

  return {
    kills,
    isBooyah,
    killPoints,
    booyahPoints,
    placementPoints,
    calculatedPoints: totalPoints,
  };
};

/**
 * Sorts participants according to tie-breaker rules:
 * Default: Total Points desc -> Booyahs desc -> Kills desc -> Placement asc
 */
export const rankParticipants = (entries, tieBreakerOrder = ['booyahs', 'kills', 'bestPlacement']) => {
  return [...entries].sort((a, b) => {
    // 1. Primary: Total Points (higher is better)
    if (b.calculatedPoints !== a.calculatedPoints) {
      return b.calculatedPoints - a.calculatedPoints;
    }

    // 2. Tie-breakers
    for (const rule of tieBreakerOrder) {
      if (rule === 'booyahs') {
        const aBooyahs = a.isBooyah ? 1 : (a.booyahCount || 0);
        const bBooyahs = b.isBooyah ? 1 : (b.booyahCount || 0);
        if (bBooyahs !== aBooyahs) return bBooyahs - aBooyahs;
      }
      if (rule === 'kills') {
        if (b.kills !== a.kills) return b.kills - a.kills;
      }
      if (rule === 'bestPlacement') {
        const aRank = a.placement || 999;
        const bRank = b.placement || 999;
        if (aRank !== bRank) return aRank - bRank; // lower placement number is better (e.g. #1 > #2)
      }
    }

    return 0;
  });
};

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEntryScore, rankParticipants } from '../src/services/scoringService.js';

test('Scoring Calculation: correctly computes kills and booyah bonus', () => {
  const config = { killPointValue: 1, booyahBonus: 12 };

  // Team with 8 kills and Booyah
  const result1 = calculateEntryScore({ kills: 8, isBooyah: true, placement: 1 }, config);
  assert.equal(result1.kills, 8);
  assert.equal(result1.isBooyah, true);
  assert.equal(result1.killPoints, 8);
  assert.equal(result1.booyahPoints, 12);
  assert.equal(result1.calculatedPoints, 20); // 8 + 12

  // Team with 5 kills and 2nd place (no Booyah)
  const result2 = calculateEntryScore({ kills: 5, isBooyah: false, placement: 2 }, config);
  assert.equal(result2.kills, 5);
  assert.equal(result2.isBooyah, false);
  assert.equal(result2.killPoints, 5);
  assert.equal(result2.booyahPoints, 0);
  assert.equal(result2.calculatedPoints, 5);
});

test('Scoring Calculation: respects custom admin kill points and booyah bonus', () => {
  const customConfig = { killPointValue: 2, booyahBonus: 15 };
  const result = calculateEntryScore({ kills: 4, isBooyah: true, placement: 1 }, customConfig);
  assert.equal(result.calculatedPoints, 23); // (4 * 2) + 15 = 23
});

test('Tie Breaker Engine: breaks ties with Booyahs > Kills > Placement', () => {
  const entries = [
    { participantName: 'Team Alpha', calculatedPoints: 15, isBooyah: false, kills: 15, placement: 3 },
    { participantName: 'Team Bravo', calculatedPoints: 15, isBooyah: true, kills: 3, placement: 1 },
    { participantName: 'Team Charlie', calculatedPoints: 20, isBooyah: false, kills: 20, placement: 2 },
  ];

  const ranked = rankParticipants(entries);
  // Team Charlie has most points (20) -> Rank 1
  assert.equal(ranked[0].participantName, 'Team Charlie');
  // Team Bravo has Booyah tie-breaker over Team Alpha (both 15 points) -> Rank 2
  assert.equal(ranked[1].participantName, 'Team Bravo');
  // Team Alpha -> Rank 3
  assert.equal(ranked[2].participantName, 'Team Alpha');
});

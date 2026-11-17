import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Tournament } from '../src/models/Tournament.js';
import { Registration } from '../src/models/Registration.js';
import { reserveSlot, releaseSlot } from '../src/services/slotService.js';
import { calculateEntryScore, rankParticipants } from '../src/services/scoringService.js';
import { generateRegistrationRef } from '../src/utils/refGenerator.js';
import { TOURNAMENT_STATUS } from '../src/constants/statuses.js';

test('Integration Test Suite', async (t) => {
  // Connect to DB for testing
  await mongoose.connect(process.env.MONGODB_URI);

  await t.test('Slot Concurrency & Atomicity: prevents overbooking', async () => {
    // Create a temporary test tournament with maxSlots = 2
    const testTournament = await Tournament.create({
      title: 'Unit Test Tournament Slots',
      slug: `test-slots-${Date.now()}`,
      format: 'squad',
      entryFee: 29,
      maxSlots: 2,
      registeredSlots: 0,
      matchDate: new Date(Date.now() + 86400000),
      registrationEnd: new Date(Date.now() + 86400000),
      status: TOURNAMENT_STATUS.REGISTRATION_OPEN,
    });

    // 1st reservation succeeds
    const t1 = await reserveSlot(testTournament._id);
    assert.equal(t1.registeredSlots, 1);

    // 2nd reservation succeeds and marks tournament full
    const t2 = await reserveSlot(testTournament._id);
    assert.equal(t2.registeredSlots, 2);
    assert.equal(t2.status, TOURNAMENT_STATUS.FULL);

    // 3rd reservation MUST FAIL because slots are exhausted
    await assert.rejects(
      async () => {
        await reserveSlot(testTournament._id);
      },
      /full|No remaining slots/
    );

    // Clean up
    await Tournament.findByIdAndDelete(testTournament._id);
  });

  await t.test('Reference Generator: produces valid formatted human-readable codes', () => {
    const squadRef = generateRegistrationRef('squad');
    const soloRef = generateRegistrationRef('solo');

    assert.match(squadRef, /^RIT-FF-SQ-[A-Z0-9]{12}$/);
    assert.match(soloRef, /^RIT-FF-SO-[A-Z0-9]{12}$/);
  });

  await t.test('Room Credentials Security: credentials are never selected by default', async () => {
    const { Match } = await import('../src/models/Match.js');
    
    // Check match schema
    const schemaPaths = Match.schema.paths;
    assert.equal(schemaPaths['roomCredentials.roomId'].options.select, false);
    assert.equal(schemaPaths['roomCredentials.roomPassword'].options.select, false);
  });

  // Disconnect after test suite
  await mongoose.disconnect();
});

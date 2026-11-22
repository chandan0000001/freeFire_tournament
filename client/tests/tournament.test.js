import test from 'node:test';
import assert from 'node:assert/strict';
import { tournamentAvailability } from '../src/utils/tournament.js';
const now = Date.UTC(2026, 10, 22);
const fixture = { maxSlots:12, registeredSlots:3, status:'registration_open', matchDate:now + 60000 };
test('actual attendance is preserved for live and completed matches', () => {
 for (const status of ['live','completed','room_ready','full']) {
  const result = tournamentAvailability({ ...fixture, status }, now);
  assert.equal(result.registered,3); assert.equal(result.percentage,25); assert.equal(result.canRegister,false);
 }
});
test('open matches require capacity and an unexpired schedule and deadline', () => {
 assert.equal(tournamentAvailability(fixture,now).canRegister,true);
 for (const override of [{registeredSlots:12},{maxSlots:0},{matchDate:'invalid'},{matchDate:now},{registrationEnd:now-1},{status:'registration_closed'},{registrationStart:now+1}]) assert.equal(tournamentAvailability({...fixture,...override},now).canRegister,false);
});
test('zero capacity and overbooked data cannot create invalid progress or negative availability', () => {
 assert.equal(tournamentAvailability({...fixture,maxSlots:0},now).percentage,0);
 const result = tournamentAvailability({...fixture,registeredSlots:20},now);
 assert.equal(result.remaining,0); assert.equal(result.percentage,100);
});

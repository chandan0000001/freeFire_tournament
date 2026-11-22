import test from 'node:test';
import assert from 'node:assert/strict';
import { toLocalDateTimeInput } from '../src/utils/dateTime.js';
test('editing a date does not shift the tournament time in the organizer timezone', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'Asia/Kolkata';
    const original = '2026-12-21T09:00:00.000Z';
    const input = toLocalDateTimeInput(original);
    assert.equal(input,'2026-12-21T14:30');
    assert.equal(new Date(input).toISOString(), original);
  } finally { if(previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
test('missing and invalid schedules render as empty fields', () => {
  assert.equal(toLocalDateTimeInput(null),'');
  assert.equal(toLocalDateTimeInput('invalid'),'');
});

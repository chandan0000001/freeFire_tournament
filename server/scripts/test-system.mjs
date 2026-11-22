import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';

const directory = await mkdtemp(join(tmpdir(), 'arena-test-'));
const mongoPort = Number(process.env.TEST_MONGO_PORT || 27028);
const redisPort = Number(process.env.TEST_REDIS_PORT || 6388);
const children = [];
let http, redis;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function start(command, args) {
  const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  children.push(child);
  child.on('error', error => console.error(command, error.message));
  child.stderr.on('data', data => process.stderr.write(data));
  return child;
}
const password = `Test!${randomBytes(12).toString('hex')}`;
Object.assign(process.env, { NODE_ENV: 'test', JWT_SECRET: randomBytes(32).toString('hex'), CLIENT_URL: 'http://localhost:5173,http://127.0.0.1:5178', BREVO_API_KEY: '', REDIS_URL: `redis://127.0.0.1:${redisPort}`, REDIS_KEY_PREFIX: 'arena-test:', ADMIN_UPI_ID: 'test@upi', ADMIN_UPI_NAME: 'Test Arena', ADMIN_WHATSAPP_NUMBER: '919999999999' });
let passed = 0;
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`); }
try {
  start('mongod', ['--dbpath', directory, '--port', String(mongoPort), '--bind_ip', '127.0.0.1', '--replSet', 'arenaTest', '--quiet']);
  let redisProcess = start('redis-server', ['--port', String(redisPort), '--bind', '127.0.0.1', '--save', '', '--appendonly', 'no']);
  const uri = `mongodb://127.0.0.1:${mongoPort}/arena_test`;
  const bootstrap = new mongoose.mongo.MongoClient(`${uri}?directConnection=true`, { serverSelectionTimeoutMS: 1000 });
  for (let i = 0; ; i++) { try { await bootstrap.connect(); break; } catch (error) { if(i > 30) throw error; await sleep(500); } }
  await bootstrap.db('admin').command({ replSetInitiate: { _id: 'arenaTest', members: [{ _id: 0, host: `127.0.0.1:${mongoPort}` }] } });
  await bootstrap.close();
  await mongoose.connect(`${uri}?replicaSet=arenaTest`, { serverSelectionTimeoutMS: 20000 });
  const { default: app } = await import('../src/app.js');
  const { cache, redisClient } = await import('../src/config/redis.js'); redis = redisClient;
  const { User } = await import('../src/models/User.js');
  const { Tournament } = await import('../src/models/Tournament.js');
  const { Registration } = await import('../src/models/Registration.js');
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  const users = [];
  for (const [name, role] of [['Admin', 'admin'], ['Player One', 'player'], ['Player Two', 'player'], ['Player Three', 'player']]) users.push(await User.create({ name, role, email: `${name.replaceAll(' ', '').toLowerCase()}@example.test`, password, mobileNumber: '9999999999' }));
  http = app.listen(0, '127.0.0.1');
  await new Promise(resolve => http.once('listening', resolve));
  const base = `http://127.0.0.1:${http.address().port}/api`;
  async function request(path, method = 'GET', body, token) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    return { status: response.status, ...data };
  }
  const tokens = [];
  for (const user of users) { const login = await request('/auth/login', 'POST', { email: user.email, password }); assert.equal(login.status, 200, JSON.stringify(login)); tokens.push(login.token); }
  const admin = (path, method = 'GET', body) => request('/admin' + path, method, body, tokens[0]);
  const player = (index, path, method = 'GET', body) => request(path, method, body, tokens[index]);
  await check('role ownership boundaries', async () => {
    assert.equal((await request('/admin/tournaments')).status, 401);
    assert.equal((await player(1, '/admin/tournaments')).status, 403);
  });
  let tournament;
  const tournamentBody = { title: 'Odisha Test Championship', slug: 'odisha-test', format: 'solo', entryFee: 50, maxSlots: 2, status: 'draft', registrationStart: new Date(Date.now() - 60000), registrationEnd: new Date(Date.now() + 3600000), matchDate: new Date(Date.now() + 7200000), prizeConfig: { firstPlace: 200, totalPool: 200 } };
  await check('tournament CRUD, draft privacy and cache invalidation', async () => {
    const created = await admin('/tournaments', 'POST', tournamentBody); assert.equal(created.status, 201, JSON.stringify(created)); tournament = created.tournament;
    assert.equal((await request('/tournaments')).count, 0);
    assert.equal((await request('/tournaments/odisha-test')).status, 404);
    assert.equal((await admin('/tournaments')).count, 1);
    const before = (await request('/sync')).revision;
    assert.equal((await admin(`/tournaments/${tournament._id}/status`, 'PATCH', { status: 'registration_open' })).status, 200);
    assert.notEqual((await request('/sync')).revision, before);
    assert.equal((await request('/tournaments')).count, 1);
    assert.equal((await admin(`/tournaments/${tournament._id}`, 'PATCH', { title: 'Updated Odisha Arena', registeredSlots: 999 })).status, 200);
    const detail = await request('/tournaments/odisha-test'); assert.equal(detail.tournament.title, 'Updated Odisha Arena'); assert.equal(detail.tournament.registeredSlots, 0);
  });
  const registrations = [];
  await check('direct registrations, duplicate submissions and ownership', async () => {
    const body = { tournamentId: tournament._id, captain: { name: 'Player', phone: '9999999999', email: users[2].email }, inGameName: 'TestPlayer', freeFireUid: '123456789', preferredSlot: 'evening', utr: '123456789012' };
    const concurrent = await Promise.all([player(1, '/registrations/solo', 'POST', body), player(1, '/registrations/solo', 'POST', body)]);
    assert.deepEqual(concurrent.map(x => x.status).sort(), [201, 409], JSON.stringify(concurrent));
    for (const i of [2, 3]) assert.equal((await player(i, '/registrations/solo', 'POST', body)).status, 201);
    registrations.push(...await Registration.find().sort({ createdAt: 1 }));
    assert.equal(registrations[0].captain.email, users[1].email);
    const mine = await player(2, '/registrations/my'); assert.equal(mine.registrations.length, 1);
  });
  await check('payment verification capacity and client slot refresh', async () => {
    const responses = await Promise.all(registrations.map((reg, index) => admin(`/registrations/${reg._id}/payment`, 'PATCH', { status: 'verified', utr: String(123456789012 + index) })));
    assert.equal(responses.filter(x => x.status === 200).length, 2, JSON.stringify(responses));
    const detail = await request('/tournaments/odisha-test'); assert.equal(detail.tournament.registeredSlots, 2); assert.equal(detail.tournament.remainingSlots, 0);
    assert.equal((await admin(`/tournaments/${tournament._id}`, 'PATCH', { maxSlots: 1 })).status, 400);
    assert.equal((await admin(`/tournaments/${tournament._id}`, 'DELETE')).status, 409);
  });
  await check('rooms, recipients, delivery logs and private credentials', async () => {
    assert.equal((await admin(`/rooms/${tournament._id}`, 'POST', { roomId: '123456', roomPassword: 'Private123' })).status, 200);
    const eligible = await Registration.find({ paymentStatus: 'verified' });
    const delivered = await admin(`/rooms/${tournament._id}/send`, 'POST', { registrationIds: eligible.map(x => x._id) }); assert.equal(delivered.status, 200, JSON.stringify(delivered));
    assert.equal((await admin(`/rooms/${tournament._id}/logs`)).status, 200);
    assert.ok(!JSON.stringify(await request('/tournaments/odisha-test')).includes('Private123'));
  });
  await check('results review, publication and idempotent prize allocation', async () => {
    const winner = await Registration.findOne({ paymentStatus: 'verified' });
    const record = await admin('/results/direct-record', 'POST', { tournamentId: tournament._id, autoPublish: false, entries: [{ registrationId: winner._id, participantName: winner.captain.name, placement: 1, kills: 5, isBooyah: true }] });
    assert.equal(record.status, 201, JSON.stringify(record));
    const id = record.result._id;
    assert.equal((await admin(`/results/${id}/review`, 'PATCH', { adminReviewNotes: 'Verified against observer' })).status, 200);
    const published = await Promise.all([admin(`/results/${id}/publish`, 'POST', {}), admin(`/results/${id}/publish`, 'POST', {})]);
    assert.ok(published.every(x => x.status === 200), JSON.stringify(published));
    assert.equal((await request('/results')).count, 1);
    assert.equal((await admin(`/results/${id}/review`, 'PATCH', { adminReviewNotes: 'Change published' })).status, 409);
  });
  await check('admin lists and public standings/settings', async () => {
    for (const path of ['/dashboard/stats', '/registrations', '/matches', '/results', '/prizes', '/settings', '/audit-logs']) assert.equal((await admin(path)).status, 200, path);
    for (const path of ['/leaderboards', '/winners', '/settings/public']) assert.equal((await request(path)).status, 200, path);
  });
  await check('settings immediately refresh public data; prize and empty-tournament controls', async () => {
    await request('/settings/public');
    assert.equal((await admin('/settings', 'PUT', { announcementBanner: 'Odisha test announcement', contactEmail: 'arena@example.test' })).status, 200);
    assert.equal((await request('/settings/public')).settings.announcementBanner, 'Odisha test announcement');
    const created = await admin('/tournaments', 'POST', { ...tournamentBody, title: 'Prize Test', slug: 'prize-test' }); assert.equal(created.status, 201);
    const prize = await admin('/prizes', 'POST', { tournamentId: created.tournament._id, rank: 4, title: 'Community award', amount: 50, winnerName: 'Test player' }); assert.equal(prize.status, 201, JSON.stringify(prize));
    assert.equal((await admin(`/prizes/${prize.prize._id}/payout`, 'PATCH', { payoutStatus: 'on_hold', notes: 'Awaiting verification' })).status, 200);
    assert.equal((await admin(`/prizes/${prize.prize._id}`, 'DELETE')).status, 200);
    assert.equal((await admin(`/tournaments/${created.tournament._id}`, 'DELETE')).status, 200);
    assert.equal((await admin('/registrations?limit=-1')).status, 400);
  });
  await check('password reset revokes existing sessions and rejects token reuse', async () => {
    const { createHash } = await import('node:crypto');
    const token = randomBytes(32).toString('hex');
    await User.updateOne({ _id: users[3]._id }, { resetPasswordToken: createHash('sha256').update(token).digest('hex'), resetPasswordExpires: new Date(Date.now() + 60000) });
    const newPassword = 'Reset!' + randomBytes(12).toString('hex');
    const body = { token, password: newPassword, confirmPassword: newPassword };
    assert.equal((await request('/auth/reset-password', 'POST', body)).status, 200);
    assert.equal((await player(3, '/auth/me')).status, 401);
    assert.equal((await request('/auth/reset-password', 'POST', body)).status, 400);
    assert.equal((await request('/auth/login', 'POST', { email: users[3].email, password: newPassword })).status, 200);
    const missing = await request('/auth/forgot-password', 'POST', { email: 'missing@example.test' });
    const publicRevision = await cache.revision();
    const existing = await request('/auth/forgot-password', 'POST', { email: users[3].email });
    assert.equal(existing.message, missing.message);
    assert.equal(await cache.revision(), publicRevision);
  });
  await check('Redis coalescing, expiry, fixed windows and namespaced invalidation', async () => {
    let loads = 0;
    await cache.scope(() => Promise.all(Array.from({ length: 8 }, () => cache.remember('results:test-coalescing', 1, async () => { loads++; await sleep(40); return { okay: true }; }))));
    assert.equal(loads, 1);
    await redis.set('another-app:keep', 'untouched');
    await cache.scope(async () => { await cache.set('results:erase:1', 1); await cache.delPattern('results:erase:*'); assert.equal(await cache.get('results:erase:1'), null); });
    await cache.flush(); assert.equal(await redis.get('another-app:keep'), 'untouched');
    const first = await cache.counter('test-window', 200); await sleep(100); const second = await cache.counter('test-window', 200); assert.equal(second.totalHits, 2); assert.ok(Math.abs(first.resetTime - second.resetTime) < 20); await sleep(130); assert.equal((await cache.counter('test-window', 200)).totalHits, 1);
  });
  await check('Redis stale-writer isolation, expiry and restart recovery', async () => {
    assert.equal((await admin('/cache/status')).cache.backend, 'redis');
    const revisions = await Promise.all(Array.from({ length: 8 }, () => cache.bumpRevision()));
    assert.equal(new Set(revisions).size, 8);
    assert.equal((await request('/admin/cache/status')).status, 401);
    await cache.scope(async () => {
      await cache.set('results:expires', { value: 1 }, 1);
      await sleep(1100); assert.equal(await cache.get('results:expires'), null);
    });
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let started;
    const ready = new Promise(resolve => { started = resolve; });
    const oldRead = cache.scope(async () => { started(); await gate; await cache.set('results:stale', 'old response'); });
    await ready; await cache.bumpRevision(); release(); await oldRead;
    await cache.scope(async () => { assert.equal(await cache.get('results:stale'), null); });
    const before = await cache.revision();
    redisProcess.kill('SIGTERM'); await new Promise(resolve => redisProcess.once('exit', resolve));
    for (let i = 0; redis.status === 'ready' && i < 20; i++) await sleep(50);
    assert.equal((await admin('/cache/status')).cache.backend, 'memory');
    assert.equal((await admin('/settings', 'PUT', { announcementBanner: 'Changed during Redis outage' })).status, 200);
    assert.equal((await request('/settings/public')).settings.announcementBanner, 'Changed during Redis outage');
    redisProcess = start('redis-server', ['--port', String(redisPort), '--bind', '127.0.0.1', '--save', '', '--appendonly', 'no']);
    for (let i = 0; redis.status !== 'ready' && i < 60; i++) await sleep(100);
    assert.equal(redis.status, 'ready');
    assert.notEqual(await cache.revision(), before);
    assert.equal((await request('/settings/public')).settings.announcementBanner, 'Changed during Redis outage');
  });
  if (process.env.TEST_BROWSER === '1') {
    await check('desktop/mobile browser routes, admin controls and live client updates', async () => {
      const { createRequire } = await import('node:module');
      const require = createRequire(import.meta.url);
      const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/postman/app/resources/app/node_modules/playwright-core');
      const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5178', '--strictPort'], { cwd: new URL('../../client/', import.meta.url), env: { ...process.env, VITE_API_BASE_URL: base, VITE_SYNC_INTERVAL_MS: '10000' }, stdio: ['ignore', 'ignore', 'pipe'] });
      children.push(vite); vite.stderr.on('data', data => process.stderr.write(data));
      const origin = 'http://127.0.0.1:5178';
      for (let i = 0; ; i++) { try { await fetch(origin); break; } catch (error) { if(i > 30) throw error; await sleep(300); } }
      const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] });
      try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        const page = await context.newPage();
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(origin + '/login');
        await page.getByLabel('Email address', { exact: true }).fill(users[0].email);
        await page.getByLabel('Password', { exact: true }).fill(password);
        await page.getByRole('button', { name: 'Show password', exact: true }).click();
        assert.equal(await page.locator('#login-password').getAttribute('type'), 'text');
        await page.getByRole('button', { name: 'Sign in to account' }).click();
        await page.waitForURL('**/admin/dashboard');
        for (const path of ['dashboard', 'tournaments', 'registrations', 'rooms', 'results', 'prizes', 'settings', 'audit-logs']) {
          await page.goto(origin + '/admin/' + path); await page.waitForTimeout(500);
          assert.ok(!(await page.locator('body').innerText()).includes('Something went wrong'), path);
          assert.equal(await page.locator('.admin-shell').count(), 1, path);
        }
        await page.goto(origin + '/admin/tournaments'); await page.waitForTimeout(400);
        await page.getByRole('button', { name: /create tournament/i }).click();
        await page.getByLabel('Tournament Title *', { exact: true }).fill('Browser Odisha Cup');
        await page.locator('#tournament-entryFee').fill('0');
        await page.locator('#tournament-maxSlots').fill('8');
        await page.locator('#tournament-matchDate').fill('2027-12-01T18:30');
        await page.locator('#tournament-registration-end').fill('2027-12-01T17:30');
        await page.getByRole('button', { name: /save|create tournament/i }).last().click();
        await page.waitForTimeout(700);
        assert.equal(await page.getByRole('dialog').count(), 0, 'tournament save must close editor');
        assert.ok((await page.locator('body').innerText()).includes('Browser Odisha Cup'));
        await page.screenshot({ path: '/tmp/arena-admin-desktop.png', fullPage: true });
        const publicPage = await context.newPage();
        await publicPage.goto(origin + '/tournaments'); await publicPage.waitForTimeout(500);
        const created = await Tournament.findOne({ title: 'Browser Odisha Cup' });
        assert.ok(created);
        await admin(`/tournaments/${created._id}`, 'PATCH', { title: 'Live Odisha Cup' });
        await publicPage.getByRole('heading', { name: 'Live Odisha Cup' }).waitFor({ timeout: 18000 });
        await publicPage.goto(origin); await publicPage.waitForTimeout(500);
        await publicPage.screenshot({ path: '/tmp/arena-home-desktop.png', fullPage: true });
        await publicPage.locator('.mode-card[href="/tournaments?format=solo"]').click();
        await publicPage.waitForURL('**/tournaments?format=solo');
        await publicPage.waitForTimeout(600);
        assert.ok(await publicPage.getByRole('button', { name: 'Solo', exact: true }).evaluate(el => el.getAttribute('aria-pressed') === 'true'));
        await publicPage.goto(origin + '/privacy');
        await publicPage.getByRole('heading', { name: 'Privacy & friendly play.' }).waitFor();

        const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
        const phone = await mobile.newPage(); phone.on('pageerror', error => errors.push(error.message));
        for (const path of ['/', '/tournaments', '/leaderboard', '/results', '/winners', '/login', '/register', '/forgot-password']) {
          await phone.goto(origin + path); await phone.waitForTimeout(300);
          assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `mobile overflow: ${path}`);
          assert.ok(!(await phone.locator('body').innerText()).includes('Something went wrong'), path);
        }
        for (const width of [320, 768, 1440]) {
          await phone.setViewportSize({ width, height: 1000 });
          for (const route of ['/', '/tournaments']) {
            await phone.goto(origin + route); await phone.waitForTimeout(450);
            assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + ' overflow at ' + width);
          }
        }
        await phone.setViewportSize({ width: 390, height: 844 });
        await phone.goto(origin + '/tournaments'); await phone.waitForTimeout(500);
        await phone.screenshot({ path: '/tmp/arena-tournaments-mobile.png', fullPage: true });
        await phone.goto(origin + '/register'); await phone.waitForTimeout(400);
        await phone.screenshot({ path: '/tmp/arena-register-mobile.png', fullPage: true });
        for (const width of [320, 768, 1440]) {
          await phone.setViewportSize({ width, height: 1000 }); await phone.waitForTimeout(200);
          assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `registration overflow at ${width}`);
        }
        await phone.screenshot({ path: '/tmp/arena-register-desktop.png', fullPage: true });
        await phone.setViewportSize({ width: 390, height: 844 });
        await phone.goto(origin); await phone.waitForTimeout(500);
        for (const img of await phone.locator('main img').all()) {
          await img.scrollIntoViewIfNeeded();
          await img.evaluate(el => el.decode());
        }
        await phone.evaluate(() => scrollTo(0, 0));
        await phone.screenshot({ path: '/tmp/arena-home-mobile.png', fullPage: true });
        const image = await phone.locator('.hero-image').evaluate(img => ({ src: img.currentSrc, loaded: img.complete && img.naturalWidth > 0 }));
        assert.ok(image.loaded); assert.ok(image.src.includes('odisha-squad.webp'), image.src);
        await phone.goto(origin + '/login');
        await phone.getByLabel('Email address', { exact: true }).fill(users[0].email);
        await phone.getByLabel('Password', { exact: true }).fill(password);
        await phone.getByRole('button', { name: 'Sign in to account' }).click();
        await phone.waitForURL('**/admin/dashboard');
        await phone.screenshot({ path: '/tmp/arena-admin-mobile.png', fullPage: true });
        assert.deepEqual(errors, []);
      } finally { await browser.close(); vite.kill('SIGTERM'); }
    });
  }
  console.log(`System checks passed: ${passed}`);
} catch (error) { console.error(error); process.exitCode = 1; }
finally {
  if (http) await new Promise(resolve => http.close(resolve));
  if (redis) redis.disconnect();
  await mongoose.disconnect();
  for (const child of children) child.kill('SIGTERM');
  await Promise.all(children.map(child => child.exitCode !== null ? null : new Promise(resolve => child.once('exit', resolve))));
  await rm(directory, { recursive: true, force: true });
}

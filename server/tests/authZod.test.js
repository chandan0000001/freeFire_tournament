import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../src/validations/authValidation.js';
import { redisAuth } from '../src/config/redis.js';
import { resolveClientBase } from '../src/controllers/authController.js';

test('Auth Zod Validation: Register schema enforces required fields and security rules', () => {
  // Invalid registration: short name, bad phone, weak password
  const invalid = registerSchema.safeParse({
    fullName: 'Al',
    email: 'not-an-email',
    mobileNumber: '12345',
    password: 'weak',
  });
  assert.equal(invalid.success, false);
  const issues = invalid.error.issues || invalid.error.errors || [];
  const errorPaths = issues.map((e) => e.path[0]);
  assert.ok(errorPaths.includes('fullName'));
  assert.ok(errorPaths.includes('email'));
  assert.ok(errorPaths.includes('mobileNumber'));
  assert.ok(errorPaths.includes('password'));

  // Valid registration (strictly 4 required fields)
  const valid = registerSchema.safeParse({
    fullName: 'Rahul Sharma',
    email: 'rahul.gamer@gmail.com',
    mobileNumber: '9876543210',
    password: 'Password123!',
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.email, 'rahul.gamer@gmail.com');
  assert.equal(valid.data.mobileNumber, '9876543210');
});

test('Auth Zod Validation: Reset password schema requires matching passwords', () => {
  const mismatch = resetPasswordSchema.safeParse({
    token: 'valid-token-123',
    password: 'NewPassword123!',
    confirmPassword: 'MismatchPassword123!',
  });
  assert.equal(mismatch.success, false);

  const matched = resetPasswordSchema.safeParse({
    token: 'valid-token-123',
    password: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  });
  assert.equal(matched.success, true);
});

test('Redis Auth Helpers: Rate limiting and Reset Token caching operate correctly', async () => {
  const testKey = `test_ratelimit_${Date.now()}`;
  
  // Rate limit increments
  const r1 = await redisAuth.rateLimit(testKey, 2, 60);
  assert.equal(r1.allowed, true);
  assert.equal(r1.current, 1);

  const r2 = await redisAuth.rateLimit(testKey, 2, 60);
  assert.equal(r2.allowed, true);
  assert.equal(r2.current, 2);

  const r3 = await redisAuth.rateLimit(testKey, 2, 60);
  assert.equal(r3.allowed, false);

  // Reset token store & retrieval
  const sampleToken = `tok_${Date.now()}`;
  await redisAuth.storeResetToken(sampleToken, { userId: 'u123', email: 'test@example.com' }, 60);
  
  const retrieved = await redisAuth.getResetToken(sampleToken);
  assert.deepEqual(retrieved, { userId: 'u123', email: 'test@example.com' });

  await redisAuth.clearResetToken(sampleToken);
  const cleared = await redisAuth.getResetToken(sampleToken);
  assert.equal(cleared, null);
});

test('Client Base URL Resolver: Prevents comma-separated URL bug and extracts valid single origin', () => {
  const origEnvClient = process.env.CLIENT_URL;
  const origNodeEnv = process.env.NODE_ENV;

  try {
    // 1. Simulates production environment with comma-separated CLIENT_URL
    process.env.CLIENT_URL = 'http://localhost:5173,https://rittournament.vercel.app';
    process.env.NODE_ENV = 'production';

    // When request has Origin header, it must take precedence
    const reqWithOrigin = { headers: { origin: 'https://rittournament.vercel.app' } };
    assert.equal(resolveClientBase(reqWithOrigin), 'https://rittournament.vercel.app');

    // When request has no Origin, it must pick single valid production URL without comma
    const reqNoOrigin = { headers: {} };
    assert.equal(resolveClientBase(reqNoOrigin), 'https://rittournament.vercel.app');
    assert.ok(!resolveClientBase(reqNoOrigin).includes(','));

    // In development mode, prefers localhost
    process.env.NODE_ENV = 'development';
    assert.equal(resolveClientBase(reqNoOrigin), 'http://localhost:5173');
    assert.ok(!resolveClientBase(reqNoOrigin).includes(','));
  } finally {
    process.env.CLIENT_URL = origEnvClient;
    process.env.NODE_ENV = origNodeEnv;
  }
});
